import fitz
import docx
import re
import spacy

# --- Metin çıkarma fonksiyonları ---

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

# --- Metin temizleme fonksiyonu ---

def clean_text(text: str) -> str:
    text = text.replace("\n", " ")                 # Satır sonlarını boşluk yap
    text = re.sub(r'\s+', ' ', text)               # Çoklu boşlukları tek boşluk yap
    text = re.sub(r'[^\w\s.,?!]', '', text)        # Özel karakterleri kaldır (Türkçe karakterler dahil)
    return text.strip()

# --- spaCy ile cümle bölme ---

nlp = spacy.load("xx_sent_ud_sm")

def split_into_sentences(text: str) -> list[str]:
    doc = nlp(text)
    return [sent.text.strip() for sent in doc.sents]

# --- Ana pipeline fonksiyonu ---

def process_document(file_path: str) -> list[str]:
    if file_path.lower().endswith(".pdf"):
        raw_text = extract_text_from_pdf(file_path)
    elif file_path.lower().endswith(".docx"):
        raw_text = extract_text_from_docx(file_path)
    else:
        raise ValueError("Desteklenmeyen dosya formatı. Sadece PDF veya DOCX olmalı.")
    
    cleaned = clean_text(raw_text)
    sentences = split_into_sentences(cleaned)
    return sentences

# --- Test için ---

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Kullanım: python academyth_text_preprocessing.py <dosya_yolu>")
        sys.exit(1)

    dosya = sys.argv[1]
    cümleler = process_document(dosya)
    print(f"Toplam cümle sayısı: {len(cümleler)}")
    print("İlk 10 cümle:")
    for cümle in cümleler[:10]:
        print("-", cümle)
