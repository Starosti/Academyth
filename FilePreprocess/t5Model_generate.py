from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch
import fitz  # PyMuPDF

def read_pdf_text(pdf_path):
    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text()
    return text

def clean_text(text):
    return ' '.join(text.strip().split())

def generate_questions(text, model, tokenizer, device, chunk_size=512):
    inputs = []
    for i in range(0, len(text), chunk_size):
        chunk = text[i:i+chunk_size]
        prompt = f"generate questions: {chunk}"
        inputs.append(prompt)

    questions = []
    for prompt in inputs:
        input_ids = tokenizer.encode(prompt, return_tensors="pt").to(device)
        output = model.generate(input_ids, max_length=128, num_return_sequences=1, do_sample=True, top_k=50, top_p=0.95)
        decoded = tokenizer.decode(output[0], skip_special_tokens=True)
        questions.append(decoded)

    return questions

if __name__ == "__main__":
    model_name = "iarfmoose/t5-base-question-generator"
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    tokenizer = T5Tokenizer.from_pretrained(model_name)
    model = T5ForConditionalGeneration.from_pretrained(model_name).to(device)

    pdf_path = "../data/01.FundamentalsofElectricityandElectronics.pdf"
    raw_text = read_pdf_text(pdf_path)
    clean_txt = clean_text(raw_text)

    print("[+] Metin okundu ve temizlendi.")

    questions = generate_questions(clean_txt, model, tokenizer, device)
    
    with open("questions.txt", "w", encoding="utf-8") as f:
        for q in questions:
            f.write(q + "\n\n")

    print(f"[✓] {len(questions)} soru üretildi ve 'questions.txt' dosyasına yazıldı.")
