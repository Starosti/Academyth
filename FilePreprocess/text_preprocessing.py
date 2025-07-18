import fitz  # PyMuPDF
import docx
import re
import spacy
from keybert import KeyBERT

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

kw_model = KeyBERT(model='paraphrase-multilingual-MiniLM-L12-v2')

def extract_keywords(text: str, top_n=10):
    keywords = kw_model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 2),
        stop_words=None,
        top_n=top_n
    )
    return keywords

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
    keywords = extract_keywords(cleaned, top_n=15)

    # TXT çıktısı
    with open("output.txt", "w", encoding="utf-8") as f:
        f.write("=== CÜMLELER ===\n")
        for s in sentences:
            f.write(s + "\n")
        f.write("\n=== ANAHTAR KELİMELER ===\n")
        for kw, score in keywords:
            f.write(f"{kw} ({score:.4f})\n")

    print(f"İşlem tamamlandı! {len(sentences)} cümle bulundu. Anahtar kelimeler output.txt dosyasına yazıldı.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Kullanım: python academyth_pipeline.py <dosya_yolu>")
        sys.exit(1)

    process_document(sys.argv[1])
