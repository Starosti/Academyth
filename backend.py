import PyPDF2
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import google.generativeai as genai
import os
from docx import Document # python-docx kütüphanesi için
import io
import json
import threading
import time
import requests

app = Flask(__name__)
CORS(app) # Frontend'den gelen istekleri kabul etmek için CORS'u etkinleştirin

# Gemini API anahtarınızı buraya ekleyin veya ortam değişkenlerinden alın
# genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
# Şimdilik boş bırakıyoruz, Canvas ortamı otomatik sağlayacak
genai.configure(api_key="AIzaSyA0GYAJdB3hr52rJh0PGEIKocqsIj5qH-k")



def split_text_into_chunks(text, chunk_size=4000):
    """Metni, API limitlerini aşmamak için daha küçük parçalara böler."""
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

def process_document_content(file_type, file_content_bytes):
    """
    Yüklenen dosya türüne göre içeriği metne dönüştürür.
    PDF için PyPDF2, DOCX için python-docx kullanılır.
    """
    if file_type == 'application/pdf':
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file_content_bytes))
            full_text = []
            for page in reader.pages:
                full_text.append(page.extract_text())
            return '\n'.join(filter(None, full_text))
        except Exception as e:
            print(f"PDF işlenirken hata: {e}")
            return None
    elif file_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': # .docx
        try:
            doc = Document(io.BytesIO(file_content_bytes))
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            return '\n'.join(full_text)
        except Exception as e:
            print(f"DOCX işlenirken hata: {e}")
            return None
    else:
        return None

# Bu endpoint, frontend'den gelen metin içeriği ve zorluk seviyesine göre sorular üretir.
# Frontend'den bu adrese ('/generate_quiz') bir POST isteği gönderilmelidir.
# İsteğin gövdesinde (body) JSON formatında şu veriler olmalıdır:
# {
#   "documentContent": "Buraya soru üretilecek uzun metin gelecek...",
#   "difficulty": "Kolay" // veya "Orta", "Zor"
# }
@app.route('/generate_quiz', methods=['POST'])
def generate_quiz():
    # Gelen isteğin JSON verisini al
    data = request.get_json()

    # Gerekli alanların (documentContent ve difficulty) istekte olup olmadığını kontrol et
    if not data or 'documentContent' not in data or 'difficulty' not in data:
        return jsonify({'error': '`documentContent` ve `difficulty` alanları zorunludur.'}), 400

    # JSON verisinden ilgili alanları değişkenlere ata
    document_content = data['documentContent']
    difficulty = data['difficulty']
    question_count = 10 # Soru sayısı sabit olarak 10

    # Metni, API'nin kabul ettiği maksimum karakter limitlerini aşmamak için parçalara böl
    text_chunks = split_text_into_chunks(document_content)

    # Sonucu stream (akış) olarak göndermek için bir inner function tanımlanır.
    # Bu, tüm soruların üretilmesini beklemeden, üretilen soruları anında frontend'e göndermeyi sağlar.
    # Böylece kullanıcı daha hızlı bir şekilde ilk soruları görür.
    def generate_questions_stream():
        try:
            # Google'ın Generative AI modelini başlat
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # JSON array'inin başlangıcını stream'e ekle
            yield '['
            first_chunk = True

            # Metnin her bir parçası için API'ye istek gönder
            # Not: Bu yapı, metin çok uzunsa birden fazla istek gönderir.
            # Eğer toplamda sadece 10 soru isteniyorsa, bu döngü yerine tüm metni tek seferde göndermek daha mantıklı olabilir.
            # Şimdilik metnin tamamını tek bir chunk olarak ele alıp tek istek yapacağız.
            full_text = " ".join(text_chunks)

            # Yapay zeka modeline verilecek olan talimat (prompt)
            # Bu talimat, metni, istenen soru sayısını ve zorluk seviyesini içerir.
            prompt = f"""Aşağıdaki metin parçasına dayanarak, belirtilen zorluk seviyesine uygun, tam olarak {question_count} adet Türkçe çoktan seçmeli soru oluştur. 

Zorluk Seviyesi: {difficulty}

Her sorunun 4 seçeneği olmalı. Bu seçeneklerden sadece bir tanesi doğru olmalı. 
Dönen JSON formatı şu şekilde olmalıdır: Her soru bir obje olmalı ve 'question' (soru metni) ve 'answerOptions' (cevap seçenekleri array'i) alanlarını içermelidir. 
'answerOptions' içindeki her seçenek objesi ise 'text' (seçenek metni), 'isCorrect' (doğru olup olmadığını belirten boolean) ve 'rationale' (o seçeneğin neden doğru veya yanlış olduğunu kısaca açıklayan bir metin) alanlarını içermelidir.

Metin Parçası:
{full_text}"""

            # Modeli çağırarak içeriği üret
            response = model.generate_content(
                [prompt],
                generation_config={
                    "response_mime_type": "application/json", # Cevabın JSON formatında olmasını zorunlu kıl
                    # Beklenen JSON şemasını burada tanımlıyoruz. Bu, modelin doğru formatta cevap vermesini sağlar.
                    "response_schema": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "question": {"type": "STRING"},
                                "answerOptions": {
                                    "type": "ARRAY",
                                    "items": {
                                        "type": "OBJECT",
                                        "properties": {
                                            "text": {"type": "STRING"},
                                            "isCorrect": {"type": "BOOLEAN"},
                                            "rationale": {"type": "STRING"}
                                        },
                                        "required": ["text", "isCorrect", "rationale"]
                                    }
                                }
                            },
                            "required": ["question", "answerOptions"]
                        }
                    }
                }
            )
            # Modelden gelen cevabın içindeki metin kısmını al (bu kısım JSON string'i içerir)
            quiz_data_string = response.candidates[0].content.parts[0].text
            
            # Gelen '[{...}]' formatındaki string'in başındaki ve sonundaki köşeli parantezleri kaldırıyoruz
            # çünkü stream'e biz kendimiz ekledik.
            if quiz_data_string.startswith('[') and quiz_data_string.endswith(']'):
                inner_json = quiz_data_string[1:-1]
                if inner_json:
                    yield inner_json # Sadece JSON içeriğini stream'e ekle
            
            # JSON array'inin sonunu stream'e ekle
            yield ']'
        except Exception as e:
            # Hata oluşursa konsola yazdır
            print(f"Stream sırasında hata: {e}")
            # Hata durumunda bile geçerli bir JSON formatı (boş bir array) döndürmeyi dene
            yield '[]'

    # Oluşturulan stream'i HTTP Response olarak döndür. Mimetype 'application/json' olarak ayarlanır.
    return Response(generate_questions_stream(), mimetype='application/json')

# Bu endpoint, kullanıcının yüklediği dosyaları (PDF, DOCX) işleyerek metin içeriğini çıkarır.
# Frontend'den bu adrese ('/upload') bir POST isteği gönderilmelidir.
# İstek, 'multipart/form-data' formatında olmalı ve 'file' adında bir dosya içermelidir.
@app.route('/upload', methods=['POST'])
def upload_document():
    # İstekte 'file' adında bir dosya olup olmadığını kontrol et
    if 'file' not in request.files:
        return jsonify({'error': 'Dosya bulunamadı.'}), 400
    
    file = request.files['file']
    
    # Dosya adının boş olup olmadığını kontrol et (kullanıcı dosya seçmeden butona basmış olabilir)
    if file.filename == '':
        return jsonify({'error': 'Dosya seçilmedi.'}), 400
    
    # Dosyanın MIME türünü ve içeriğini (byte olarak) al
    file_type = file.content_type
    file_content_bytes = file.read()
    
    # Dosya içeriğini metne dönüştürmek için yardımcı fonksiyonu çağır
    text = process_document_content(file_type, file_content_bytes)
    
    # Metin dönüştürme işlemi başarısız olursa hata döndür
    if text is None:
        return jsonify({'error': 'Dosya işlenemedi veya desteklenmeyen format (sadece PDF ve DOCX).'}), 400
    
    # Başarılı olursa, çıkarılan metni JSON formatında frontend'e geri döndür.
    # Frontend bu metni alıp daha sonra /generate_quiz endpoint'ine gönderecektir.
    return jsonify({'documentContent': text})

@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'API çalışıyor. /upload ile dosya yükleyin, /generate_quiz ile soru oluşturun.'})

def send_quiz_request(local_file_path, difficulty="kolay"):
    # Sunucunun tam açılması için biraz bekle
    time.sleep(3)

    with open(local_file_path, "rb") as f:
        file_bytes = f.read()

    if local_file_path.endswith(".pdf"):
        file_type = "application/pdf"
    elif local_file_path.endswith(".docx"):
        file_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        raise Exception("Desteklenmeyen dosya formatı.")

    text = process_document_content(file_type, file_bytes)
    if not text:
        raise Exception("Dosya okunamadı veya boş içerik.")

    response = requests.post(
        "http://127.0.0.1:5000/generate_quiz",
        json={
            "documentContent": text,
            "difficulty": difficulty
        }
    )

    filename = os.path.basename(local_file_path)
    base_name = os.path.splitext(filename)[0]
    save_dir = "questions"
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, base_name + ".json")

    if response.status_code == 200:
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"✅ Soru-cevaplar {save_path} dosyasına kaydedildi.")
    else:
        print(f"❌ API isteği başarısız oldu. Kod: {response.status_code} | Mesaj: {response.text}")

def start_flask():
    app.run(debug=False, use_reloader=False, port=5000)

if __name__ == '__main__':
    t = threading.Thread(target=start_flask)
    t.daemon = True
    t.start()

    local_file_path = "./data/01.FundamentalsofElectricityandElectronics.pdf"
    difficulty = "zor"
    send_quiz_request(local_file_path, difficulty)