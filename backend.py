import PyPDF2
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
from docx import Document  # python-docx kütüphanesi için
import io
import json
import threading
import time
import requests
import uuid
import shutil
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Frontend'den gelen istekleri kabul etmek için CORS'u etkinleştirin

# Create directory for storing uploaded files
UPLOAD_FOLDER = "uploaded_documents"
METADATA_FILE = os.path.join(UPLOAD_FOLDER, "metadata.json")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory storage for document metadata (in production, use a database)
document_storage = {}

# In-memory storage for quiz sessions and performance data
quiz_sessions = {}


def load_existing_documents():
    """
    Sunucu başlatıldığında mevcut dosyaları tarar ve document_storage'a yükler.
    """
    if not os.path.exists(UPLOAD_FOLDER):
        print("Upload folder bulunamadı, oluşturuluyor...")
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        return

    print("Mevcut dosyalar taranıyor...")
    loaded_count = 0

    # Önce metadata.json dosyasından yükle
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                metadata = json.load(f)

            for document_id, doc_info in metadata.items():
                file_path = doc_info.get("file_path")

                # Dosyanın hala mevcut olup olmadığını kontrol et
                if file_path and os.path.exists(file_path):
                    # Dosyanın okunabilir olduğunu kontrol et
                    try:
                        with open(file_path, "rb") as file:
                            file_content_bytes = file.read()

                        # İçerik parse edilebilir mi kontrol et
                        content = process_document_content(
                            doc_info["file_type"], file_content_bytes
                        )
                        if content is not None:
                            document_storage[document_id] = doc_info
                            loaded_count += 1
                            print(
                                f"Metadata'dan yüklendi: {doc_info['original_filename']} (ID: {document_id})"
                            )
                        else:
                            print(
                                f"Dosya içeriği okunamıyor: {doc_info['original_filename']}"
                            )
                    except Exception as e:
                        print(
                            f"Dosya okuma hatası {doc_info['original_filename']}: {e}"
                        )
                else:
                    print(f"Dosya bulunamadı: {file_path}")

            print(f"Metadata dosyasından {loaded_count} dosya yüklendi.")
            return

        except Exception as e:
            print(f"Metadata dosyası okuma hatası: {e}")
            print("Dosya sistemi taraması yapılıyor...")

    # Metadata dosyası yoksa veya hatalıysa, dosya sistemi taraması yap
    try:
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)

            # metadata.json dosyasını atla
            if filename == "metadata.json":
                continue

            # Sadece dosyaları işle, klasörleri atla
            if not os.path.isfile(file_path):
                continue

            # Dosya adından document ID ve uzantıyı çıkar
            name_parts = filename.rsplit(".", 1)
            if len(name_parts) != 2:
                print(f"Geçersiz dosya adı formatı: {filename}")
                continue

            document_id, extension = name_parts

            # UUID formatını kontrol et
            try:
                uuid.UUID(document_id)
            except ValueError:
                print(f"Geçersiz UUID formatı: {document_id}")
                continue

            # Dosya türünü belirle
            if extension.lower() == "pdf":
                file_type = "application/pdf"
            elif extension.lower() == "docx":
                file_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            else:
                print(f"Desteklenmeyen dosya türü: {extension}")
                continue

            # Dosya bilgilerini al
            file_stats = os.stat(file_path)
            upload_time = file_stats.st_mtime

            # Dosyanın okunabilir olduğunu kontrol et
            try:
                with open(file_path, "rb") as file:
                    file_content_bytes = file.read()

                # İçerik parse edilebilir mi kontrol et
                content = process_document_content(file_type, file_content_bytes)
                if content is None:
                    print(f"Dosya içeriği okunamıyor: {filename}")
                    continue

            except Exception as e:
                print(f"Dosya okuma hatası {filename}: {e}")
                continue

            # Document storage'a ekle
            document_storage[document_id] = {
                "file_path": file_path,
                "file_type": file_type,
                "original_filename": f"document_{document_id}.{extension}",  # Orijinal adı bilinmiyor, varsayılan kullan
                "upload_time": upload_time,
            }

            loaded_count += 1
            print(f"Dosya sisteminden yüklendi: {filename} (ID: {document_id})")

    except Exception as e:
        print(f"Dosya tarama sırasında hata: {e}")

    print(f"Toplam {loaded_count} dosya yüklendi.")

    # Yüklenen verileri metadata dosyasına kaydet
    save_document_metadata()


def save_document_metadata():
    """
    Document storage verilerini metadata.json dosyasına kaydeder.
    """
    try:
        with open(METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(document_storage, f, ensure_ascii=False, indent=2)
        print(f"Metadata {len(document_storage)} dosya ile güncellendi.")
    except Exception as e:
        print(f"Metadata kaydetme hatası: {e}")


# .env dosyasını yükle
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY ortam değişkeni tanımlı değil!")
genai.configure(api_key=api_key)  # type: ignore


def split_text_into_chunks(text, chunk_size=4000):
    """Metni, API limitlerini aşmamak için daha küçük parçalara böler."""
    return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]


def get_document_content_by_id(document_id):
    """
    Belirli bir document ID'ye göre dosya içeriğini getirir.
    """
    if document_id not in document_storage:
        return None

    doc_info = document_storage[document_id]
    file_path = doc_info["file_path"]
    file_type = doc_info["file_type"]

    try:
        with open(file_path, "rb") as file:
            file_content_bytes = file.read()
        return process_document_content(file_type, file_content_bytes)
    except Exception as e:
        print(f"Dosya okunurken hata: {e}")
        return None


def process_document_content(file_type, file_content_bytes):
    """
    Yüklenen dosya türüne göre içeriği metne dönüştürür.
    PDF için PyPDF2, DOCX için python-docx kullanılır.
    """
    if file_type == "application/pdf":
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file_content_bytes))
            full_text = []
            for page in reader.pages:
                full_text.append(page.extract_text())
            return "\n".join(filter(None, full_text))
        except Exception as e:
            print(f"PDF işlenirken hata: {e}")
            return None
    elif (
        file_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):  # .docx
        try:
            doc = Document(io.BytesIO(file_content_bytes))
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            return "\n".join(full_text)
        except Exception as e:
            print(f"DOCX işlenirken hata: {e}")
            return None
    else:
        return None


def analyze_performance(
    answers, questions, difficulty, document_content=None, time_spent=0
):
    """
    Kullanıcının performansını analiz eder ve detaylı bir rapor döndürür.
    """
    try:
        total_questions = len(questions)
        correct_answers = sum(
            1
            for i, answer in enumerate(answers)
            if answer >= 0 and answer == questions[i]["correctAnswer"]
        )

        accuracy = (
            (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        )

        # Format time spent for analysis
        def format_time_for_analysis(seconds):
            if seconds < 60:
                return f"{seconds} saniye"
            elif seconds < 3600:
                minutes = seconds // 60
                remaining_seconds = seconds % 60
                if remaining_seconds > 0:
                    return f"{minutes} dakika {remaining_seconds} saniye"
                else:
                    return f"{minutes} dakika"
            else:
                hours = seconds // 3600
                remaining_minutes = (seconds % 3600) // 60
                if remaining_minutes > 0:
                    return f"{hours} saat {remaining_minutes} dakika"
                else:
                    return f"{hours} saat"

        time_analysis = (
            format_time_for_analysis(time_spent) if time_spent > 0 else "Bilinmiyor"
        )

        # Kategorize topics based on question content (basic analysis)
        topic_performance = {}

        # Create prompt for AI analysis
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Prepare questions and answers for analysis
        qa_summary = []
        for i, question in enumerate(questions):
            user_answer_index = answers[i] if i < len(answers) else -1
            user_answer = (
                question["options"][user_answer_index]
                if 0 <= user_answer_index < len(question["options"])
                else "Yanıtlanmadı"
            )
            correct_answer = question["options"][question["correctAnswer"]]
            is_correct = user_answer_index == question["correctAnswer"]

            qa_summary.append(
                {
                    "question": question["question"],
                    "user_answer": user_answer,
                    "correct_answer": correct_answer,
                    "is_correct": is_correct,
                }
            )

        analysis_prompt = f"""
        You are an expert educational evaluator. Carefully analyze the student's quiz performance and generate a comprehensive, student-focused evaluation report.

        Quiz Details:
        - Difficulty Level: {difficulty}
        - Total Questions: {total_questions}
        - Correct Answers: {correct_answers}
        - Accuracy Rate: {accuracy:.1f}%
        - Time Spent: {time_analysis}

        Questions and Answers:
        {json.dumps(qa_summary, ensure_ascii=False, indent=2)}

        Please provide a detailed report in the following format:

        1. Overall Performance Evaluation: Objectively assess the student's performance, considering both accuracy and speed. Highlight notable achievements and overall understanding.
        2. Strengths: Identify specific topics, concepts, or question types where the student excelled. Use evidence from the quiz responses.
        3. Areas for Improvement: Point out topics, concepts, or question types that need further attention, with constructive suggestions.
        4. Time Management: Evaluate how effectively the student managed their time. Offer practical advice for improvement if needed.
        5. Recommendations: Give actionable advice and learning strategies to help the student improve future performance.
        6. Motivational Message: End with a positive, encouraging message tailored to the student's effort and progress.

        The analysis must be in English, focused on the student's growth, and written in a supportive, constructive tone.
        Only return the report itself, without any introductory or closing remarks, and use plain text (not Markdown).
        """

        response = model.generate_content(analysis_prompt)
        analysis_text = response.candidates[0].content.parts[0].text

        return {
            "accuracy": accuracy,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "difficulty": difficulty,
            "detailed_analysis": analysis_text,
            "performance_level": (
                "Mükemmel"
                if accuracy >= 90
                else (
                    "Çok İyi"
                    if accuracy >= 80
                    else (
                        "İyi"
                        if accuracy >= 70
                        else "Orta" if accuracy >= 60 else "Geliştirilmeli"
                    )
                )
            ),
        }

    except Exception as e:
        print(f"Performance analysis error: {e}")
        return {
            "accuracy": accuracy if "accuracy" in locals() else 0,
            "correct_answers": correct_answers if "correct_answers" in locals() else 0,
            "total_questions": total_questions if "total_questions" in locals() else 0,
            "difficulty": difficulty,
            "detailed_analysis": "Analiz oluşturulurken bir hata oluştu.",
            "performance_level": "Bilinmiyor",
        }


# Bu endpoint, frontend'den gelen document ID ve zorluk seviyesine göre sorular üretir.
# Frontend'den bu adrese ('/generate_quiz') bir POST isteği gönderilmelidir.
# İsteğin gövdesinde (body) JSON formatında şu veriler olmalıdır:
# {
#   "documentId": "UUID formatında document ID",
#   "difficulty": "Kolay" // veya "Orta", "Zor"
# }
@app.route("/generate_quiz", methods=["POST"])
def generate_quiz():
    # Gelen isteğin JSON verisini al
    data = request.get_json()

    # Gerekli alanların (documentId ve difficulty) istekte olup olmadığını kontrol et
    if not data or "documentId" not in data or "difficulty" not in data:
        return (
            jsonify({"error": "`documentId` ve `difficulty` alanları zorunludur."}),
            400,
        )

    # JSON verisinden ilgili alanları değişkenlere ata
    document_id = data["documentId"]
    difficulty = data["difficulty"]
    question_count = 10  # Soru sayısı sabit olarak 10

    # Document ID'ye göre dosya içeriğini getir
    document_content = get_document_content_by_id(document_id)

    if document_content is None:
        return (
            jsonify(
                {"error": "Belirtilen document ID bulunamadı veya dosya okunamadı."}
            ),
            404,
        )

    # Metni, API'nin kabul ettiği maksimum karakter limitlerini aşmamak için parçalara böl
    text_chunks = split_text_into_chunks(document_content)

    # Sonucu stream (akış) olarak göndermek için bir inner function tanımlanır.
    # Bu, tüm soruların üretilmesini beklemeden, üretilen soruları anında frontend'e göndermeyi sağlar.
    # Böylece kullanıcı daha hızlı bir şekilde ilk soruları görür.
    def generate_questions_stream():
        try:
            # Google'ın Generative AI modelini başlat
            model = genai.GenerativeModel("gemini-2.5-flash")  # type: ignore

            # JSON array'inin başlangıcını stream'e ekle
            yield "["
            first_chunk = True

            # Metnin her bir parçası için API'ye istek gönder
            # Not: Bu yapı, metin çok uzunsa birden fazla istek gönderir.
            # Eğer toplamda sadece 10 soru isteniyorsa, bu döngü yerine tüm metni tek seferde göndermek daha mantıklı olabilir.
            # Şimdilik metnin tamamını tek bir chunk olarak ele alıp tek istek yapacağız.
            full_text = " ".join(text_chunks)

            # Yapay zeka modeline verilecek olan talimat (prompt)
            # Bu talimat, metni, istenen soru sayısını ve zorluk seviyesini içerir.
            prompt = f"""Read the following text and generate exactly {question_count} multiple-choice questions in English, tailored to the specified difficulty level.

Difficulty Level: {difficulty}

Instructions:
- Each question must be clear, relevant to the text, and test understanding or critical thinking.
- Each question must have 4 answer options, with only one correct answer.
- Vary the question types (e.g., factual, conceptual, application, inference) where possible.
- Avoid repeating questions or options.
- Ensure the questions and options are grammatically correct and unambiguous.
- The questions and answers should be in English.

Output Format (JSON):
- Each question should be an object containing 'question' (the question text) and 'answerOptions' (an array of answer option objects).
- Each option object in 'answerOptions' must include:
    - 'text': the option text
    - 'isCorrect': boolean indicating if it is correct
    - 'rationale': a brief explanation of why the option is correct or incorrect

Text:
{full_text}"""

            # Modeli çağırarak içeriği üret
            response = model.generate_content(
                [prompt],
                generation_config={
                    "response_mime_type": "application/json",  # Cevabın JSON formatında olmasını zorunlu kıl
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
                                            "rationale": {"type": "STRING"},
                                        },
                                        "required": ["text", "isCorrect", "rationale"],
                                    },
                                },
                            },
                            "required": ["question", "answerOptions"],
                        },
                    },
                },
            )
            # Modelden gelen cevabın içindeki metin kısmını al (bu kısım JSON string'i içerir)
            quiz_data_string = response.candidates[0].content.parts[0].text

            # Gelen '[{...}]' formatındaki string'in başındaki ve sonundaki köşeli parantezleri kaldırıyoruz
            # çünkü stream'e biz kendimiz ekledik.
            if quiz_data_string.startswith("[") and quiz_data_string.endswith("]"):
                inner_json = quiz_data_string[1:-1]
                if inner_json:
                    yield inner_json  # Sadece JSON içeriğini stream'e ekle

            # JSON array'inin sonunu stream'e ekle
            yield "]"
        except Exception as e:
            # Hata oluşursa konsola yazdır
            print(f"Stream sırasında hata: {e}")
            # Hata durumunda bile geçerli bir JSON formatı (boş bir array) döndürmeyi dene
            yield "[]"

    # Oluşturulan stream'i HTTP Response olarak döndür. Mimetype 'application/json' olarak ayarlanır.
    return Response(generate_questions_stream(), mimetype="application/json")


# Bu endpoint, kullanıcının yüklediği dosyaları (PDF, DOCX) kaydeder ve dosya için bir ID döndürür.
# Frontend'den bu adrese ('/upload') bir POST isteği gönderilmelidir.
# İstek, 'multipart/form-data' formatında olmalı ve 'file' adında bir dosya içermelidir.
@app.route("/upload", methods=["POST"])
def upload_document():
    # İstekte 'file' adında bir dosya olup olmadığını kontrol et
    if "file" not in request.files:
        return jsonify({"error": "Dosya bulunamadı."}), 400

    file = request.files["file"]

    # Dosya adının boş olup olmadığını kontrol et (kullanıcı dosya seçmeden butona basmış olabilir)
    if file.filename == "":
        return jsonify({"error": "Dosya seçilmedi."}), 400

    # Dosyanın MIME türünü kontrol et (sadece PDF ve DOCX destekleniyor)
    file_type = file.content_type
    if file_type not in [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]:
        return (
            jsonify(
                {
                    "error": "Desteklenmeyen dosya formatı. Sadece PDF ve DOCX dosyaları kabul edilir."
                }
            ),
            400,
        )

    # Benzersiz bir document ID oluştur
    document_id = str(uuid.uuid4())

    # Dosya uzantısını belirle
    file_extension = ".pdf" if file_type == "application/pdf" else ".docx"

    # Dosyayı kaydetmek için yol oluştur
    file_path = os.path.join(UPLOAD_FOLDER, f"{document_id}{file_extension}")

    try:
        # Dosyayı kaydet
        file.save(file_path)

        # Document metadata'sını hafızada sakla
        document_storage[document_id] = {
            "file_path": file_path,
            "file_type": file_type,
            "original_filename": file.filename,
            "upload_time": time.time(),
        }

        # Dosya içeriğini doğrulamak için okumayı dene
        with open(file_path, "rb") as saved_file:
            file_content_bytes = saved_file.read()

        # Dosya içeriğini metne dönüştürmek için yardımcı fonksiyonu çağır
        text = process_document_content(file_type, file_content_bytes)

        # Metin dönüştürme işlemi başarısız olursa dosyayı sil ve hata döndür
        if text is None:
            os.remove(file_path)
            del document_storage[document_id]
            return (
                jsonify({"error": "Dosya işlenemedi. Dosya bozuk olabilir."}),
                400,
            )

        # Başarılı olursa, document ID'yi ve dosya bilgilerini frontend'e geri döndür
        # Metadata dosyasını güncelle
        save_document_metadata()

        return jsonify(
            {
                "documentId": document_id,
                "originalFilename": file.filename,
                "message": "Dosya başarıyla yüklendi ve kaydedildi.",
            }
        )

    except Exception as e:
        # Hata durumunda dosyayı temizle
        if os.path.exists(file_path):
            os.remove(file_path)
        if document_id in document_storage:
            del document_storage[document_id]

        print(f"Dosya yüklenirken hata: {e}")
        return (
            jsonify({"error": "Dosya yüklenirken bir hata oluştu."}),
            500,
        )


@app.route("/analyze_performance", methods=["POST"])
def analyze_performance_endpoint():
    """
    Kullanıcının quiz performansını analiz eder.
    Gönderilecek veri formatı:
    {
        "answers": [1, 0, 2, 1, 0],  // Kullanıcının cevapları
        "questions": [...],           // Soru listesi
        "difficulty": "Orta",         // Zorluk seviyesi
        "documentId": "uuid",         // Opsiyonel: döküman ID'si
        "timeSpent": 120             // Opsiyonel: harcanan süre (saniye)
    }
    """
    try:
        data = request.get_json()

        if not data or "answers" not in data or "questions" not in data:
            return jsonify({"error": "answers ve questions alanları zorunludur."}), 400

        answers = data["answers"]
        questions = data["questions"]
        difficulty = data.get("difficulty", "Orta")
        document_id = data.get("documentId")
        time_spent = data.get("timeSpent", 0)

        # Döküman içeriğini al (eğer döküman ID'si verilmişse)
        document_content = None
        if document_id:
            document_content = get_document_content_by_id(document_id)

        # Performans analizini yap
        analysis_result = analyze_performance(
            answers, questions, difficulty, document_content, time_spent
        )

        # Quiz session'ı kaydet (isteğe bağlı)
        session_id = str(uuid.uuid4())
        quiz_sessions[session_id] = {
            "answers": answers,
            "questions": questions,
            "difficulty": difficulty,
            "document_id": document_id,
            "time_spent": time_spent,
            "analysis": analysis_result,
            "timestamp": time.time(),
        }

        # Sonucu döndür
        response = {
            "sessionId": session_id,
            "analysis": analysis_result,
            "timeSpent": time_spent,
        }

        return jsonify(response)

    except Exception as e:
        print(f"Performance analysis endpoint error: {e}")
        return jsonify({"error": "Performans analizi sırasında bir hata oluştu."}), 500


@app.route("/documents", methods=["GET"])
def get_all_documents():
    """
    Tüm yüklenen dokümanların listesini döndürür (Library sayfası için).
    """
    documents = []
    for doc_id, doc_info in document_storage.items():
        # Dosya boyutunu hesapla
        try:
            file_size_bytes = os.path.getsize(doc_info["file_path"])
            if file_size_bytes < 1024:
                file_size = f"{file_size_bytes} B"
            elif file_size_bytes < 1024 * 1024:
                file_size = f"{file_size_bytes / 1024:.1f} KB"
            else:
                file_size = f"{file_size_bytes / (1024 * 1024):.1f} MB"
        except:
            file_size = "Unknown"

        # Upload tarihini formatla
        upload_date = time.strftime("%Y-%m-%d", time.localtime(doc_info["upload_time"]))

        documents.append(
            {
                "id": doc_id,
                "name": doc_info["original_filename"],
                "uploadDate": upload_date,
                "size": file_size,
                "lastUsed": upload_date,  # Şimdilik upload date ile aynı
                "fileType": doc_info["file_type"],
            }
        )

    # Upload tarihine göre ters sıralama (en yeni önce)
    documents.sort(key=lambda x: x["uploadDate"], reverse=True)

    return jsonify({"documents": documents})


@app.route("/document/<document_id>", methods=["DELETE"])
def delete_document(document_id):
    """
    Belirli bir document ID'ye sahip dosyayı siler.
    """
    if document_id not in document_storage:
        return jsonify({"error": "Document ID bulunamadı."}), 404

    doc_info = document_storage[document_id]
    file_path = doc_info["file_path"]

    try:
        # Dosyayı diskten sil
        if os.path.exists(file_path):
            os.remove(file_path)

        # Metadata'yı hafızadan sil
        del document_storage[document_id]

        # Metadata dosyasını güncelle
        save_document_metadata()

        return jsonify(
            {"message": "Dosya başarıyla silindi.", "deletedDocumentId": document_id}
        )

    except Exception as e:
        print(f"Dosya silinirken hata: {e}")
        return jsonify({"error": "Dosya silinirken bir hata oluştu."}), 500


@app.route("/document/<document_id>", methods=["GET"])
def get_document_info(document_id):
    """
    Belirli bir document ID için dosya bilgilerini döndürür.
    """
    if document_id not in document_storage:
        return jsonify({"error": "Document ID bulunamadı."}), 404

    doc_info = document_storage[document_id]
    return jsonify(
        {
            "documentId": document_id,
            "originalFilename": doc_info["original_filename"],
            "fileType": doc_info["file_type"],
            "uploadTime": doc_info["upload_time"],
        }
    )


@app.route("/", methods=["GET"])
def index():
    return jsonify(
        {
            "message": "API çalışıyor. /upload ile dosya yükleyin, /generate_quiz ile soru oluşturun."
        }
    )


def start_flask():
    # Sunucu başlamadan önce mevcut dosyaları yükle
    print("Flask sunucusu başlatılıyor...")
    load_existing_documents()
    print("Sunucu hazır!")
    app.run(debug=False, use_reloader=False, port=5000)


if __name__ == "__main__":
    # Flask uygulamasını doğrudan başlat
    start_flask()
