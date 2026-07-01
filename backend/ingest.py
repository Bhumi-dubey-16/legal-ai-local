import fitz  # This is the PyMuPDF library

def extract_and_chunk_pdf(pdf_path, chunk_size=1000, chunk_overlap=200):
    """
    Reads a local PDF file, extracts text from each page, 
    and breaks it into overlapping blocks for our vector database.
    """
    print(f"📖 Opening document: {pdf_path}")
    
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"❌ Error opening file: {e}")
        return []

    all_chunks = []
    
    # Loop through every single page in the PDF
    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text = page.get_text()
        
        # If the page has no text, it's a scanned image.
        # We will handle OCR here on Days 3-4!
        if not page_text.strip():
            print(f"⚠️ Page {page_num + 1} has no selectable text (might be a scanned image).")
            continue
            
        # Cut the page text into small chunks using a sliding window
        start = 0
        while start < len(page_text):
            end = start + chunk_size
            chunk = page_text[start:end]
            
            # Save the text chunk along with metadata so Bhumi's UI can cite pages later
            all_chunks.append({
                "text": chunk.strip(),
                "metadata": {
                    "page": page_num + 1,
                    "source": pdf_path
                }
            })
            # Slide the window forward, keeping a small overlap so sentences aren't brutally cut off
            start += (chunk_size - chunk_overlap)
            
    print(f"✅ Extraction finished! Generated {len(all_chunks)} text chunks.")
    return all_chunks

if __name__ == "__main__":
    # This block runs ONLY when you execute ingest.py directly
    print("🚀 Running standalone ingestion test...")
    chunks = extract_and_chunk_pdf("test.pdf")
    if chunks:
        print(f"📋 First chunk preview:\n{chunks[0]['text']}")