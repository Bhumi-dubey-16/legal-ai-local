import fitz  # PyMuPDF
import chromadb
from chromadb.utils import embedding_functions

def extract_and_chunk_pdf(pdf_path, chunk_size=1000, chunk_overlap=200):
    """
    1. Reads a local PDF file, extracts text from each page, 
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
        
        # Skip empty or scanned image pages (we will handle OCR later)
        if not page_text.strip():
            print(f"⚠️ Page {page_num + 1} has no selectable text.")
            continue
            
        # Cut the page text into small chunks using a sliding window
        start = 0
        while start < len(page_text):
            end = start + chunk_size
            chunk = page_text[start:end]
            
            # Save text chunk along with source metadata
            all_chunks.append({
                "text": chunk.strip(),
                "metadata": {
                    "page": page_num + 1,
                    "source": pdf_path
                }
            })
            # Slide window forward with an overlap so sentences aren't cut in half
            start += (chunk_size - chunk_overlap)
            
    print(f"✅ Extraction finished! Generated {len(all_chunks)} text chunks.")
    return all_chunks


def save_chunks_to_chroma(chunks, collection_name="legal_docs"):
    """
    2. Takes text chunks, converts them into numerical vectors using a local 
    embedding model, and stores them inside an offline ChromaDB database.
    """
    if not chunks:
        print("⚠️ No chunks available to save.")
        return
        
    print(f"📦 Initializing local vector database...")
    
    # Creates a physical folder 'chroma_db' on your desktop inside your project directory
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    
    # Downloads and runs a lightweight math model to understand words completely offline
    default_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Create or fetch our target table
    collection = chroma_client.get_or_create_collection(
        name=collection_name, 
        embedding_function=default_ef
    )
    
    print(f"🧬 Converting text chunks to vectors and inserting into '{collection_name}'...")
    
    # Format arrays cleanly for ChromaDB processing
    documents = [c["text"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]
    ids = [f"id_{i}" for i in range(len(chunks))]
    
    # Insert or update data
    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"✨ Successfully saved {len(chunks)} chunks to ChromaDB database!")


if __name__ == "__main__":
    print("🚀 Running full ingestion and vector storage test...")
    
    # Step 1: Run parser
    extracted_chunks = extract_and_chunk_pdf("test.pdf")
    
    # Step 2: Push to local database
    save_chunks_to_chroma(extracted_chunks)