import fitz  # PyMuPDF
import docx
import re
import spacy
from keybert import KeyBERT
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# === Ayarlar ===
model_name = "google/mt5-base"  # Çok dilli T5, Türkçe dahil
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# --- PDF/Word metin çıkarma ---

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text("text") + " "
    return text

def extract_text_from_docx(docx_path: str) -> str:
    doc = docx.Document(docx_path)
    text = " ".join(para.text for para in doc.paragraphs)
    return text

# --- Metin temizleme ---

def clean_text(text: str) -> str:
    text = text.replace("\n", " ")
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s.,?!]', '', text)
    return text.strip()

# --- Cümlelere bölme ---

nlp = spacy.load("xx_sent_ud_sm")

def split_into_sentences(text: str) -> list[str]:
    doc = nlp(text)
    return [sent.text.strip() for sent in doc.sents]

# --- Keyword extraction ---

# kw_model = KeyBERT(model='xlm-r-distilroberta-base-paraphrase-v1')
# def extract_keywords(text: str, top_n=10):
#     keywords = kw_model.extract_keywords(
#         text,
#         keyphrase_ngram_range=(1, 2),
#         stop_words="english",
#         top_n=5
#     )

#     return keywords

def generate_question_from_sentence(sentence):
    input_text = f"generate question: {sentence}"
    inputs = tokenizer.encode(input_text, return_tensors="pt", max_length=512, truncation=True)

    outputs = model.generate(
        inputs,
        max_length=64,
        num_beams=4,
        early_stopping=True
    )
    question = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return question

# --- Ana pipeline ---

def process_document(file_path: str):
    # Dosyadan metin al
    if file_path.lower().endswith(".pdf"):
        raw_text = extract_text_from_pdf(file_path)
    elif file_path.lower().endswith(".docx"):
        raw_text = extract_text_from_docx(file_path)
    else:
        raise ValueError("Desteklenmeyen format. PDF veya DOCX olmalı.")

    # Temizle
    cleaned = clean_text(raw_text)

    # Cümlelere böl
    sentences = split_into_sentences(cleaned)

    # Keyword çıkar
    #keywords = extract_keywords(cleaned, top_n=15)

    # TXT çıktısı
    with open("output.txt", "w", encoding="utf-8") as f:
        f.write("=== CÜMLELER ===\n")
        for s in sentences:
            f.write(s + "\n")
        # f.write("\n=== ANAHTAR KELİMELER ===\n")
        # for kw, score in keywords:
        #     f.write(f"{kw} ({score:.4f})\n")

    print(f"İşlem tamamlandı! {len(sentences)} cümle bulundu. output.txt dosyasına yazıldı.")
    
    print("🧠 mt5-base ile soru üretiliyor...")
    questions = []
    for sent in sentences[:20]:  # İlk 20 cümle ile sınırla, uzun sürebilir
        q = generate_question_from_sentence(sent)
        questions.append(q)

    with open("questions.txt", "w", encoding="utf-8") as f:
        for q in questions:
            f.write(q + "\n\n")

    print(f"{len(questions)} soru üretildi ve 'questions.txt' dosyasına yazıldı.")
    

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Kullanım: python academyth_pipeline.py <dosya_yolu>")
        sys.exit(1)

    process_document(sys.argv[1])
