import fitz  # PyMuPDF
import chromadb
from chromadb.utils import embedding_functions


def extract_and_chunk_pdf(pdf_path, chunk_size=1000, chunk_overlap=200):
    """
    Reads a local PDF file, extracts text from each page,
    and breaks it into overlapping blocks for our vector database.
    """
    print(f"Opening document: {pdf_path}")

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening file: {e}")
        return []

    all_chunks = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text = page.get_text()

        if not page_text.strip():
            print(f"Page {page_num + 1} has no selectable text.")
            continue

        start = 0
        while start < len(page_text):
            end = start + chunk_size
            chunk = page_text[start:end]

            all_chunks.append({
                "text": chunk.strip(),
                "metadata": {
                    "page": page_num + 1,
                    "source": pdf_path
                }
            })
            start += (chunk_size - chunk_overlap)

    print(f"Extraction finished. Generated {len(all_chunks)} text chunks.")
    return all_chunks


def save_chunks_to_chroma(chunks, collection, doc_id, filename):
    """
    Takes text chunks and stores them inside ChromaDB, tagged with
    doc_id + filename so they can be filtered per-document later
    (needed for chronology / risk analysis / ask).
    """
    if not chunks:
        print("No chunks available to save.")
        return

    documents = [c["text"] for c in chunks]
    metadatas = [
        {"page": c["metadata"]["page"], "doc_id": doc_id, "filename": filename}
        for c in chunks
    ]
    ids = [f"{doc_id}_p{c['metadata']['page']}_{i}" for i, c in enumerate(chunks)]

    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

    print(f"Saved {len(chunks)} chunks for doc_id={doc_id} ({filename})")


if __name__ == "__main__":
    print("Running standalone ingestion test...")

    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    default_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    test_collection = chroma_client.get_or_create_collection(
        name="legal_docs",
        embedding_function=default_ef
    )

    extracted_chunks = extract_and_chunk_pdf("test.pdf")
    save_chunks_to_chroma(extracted_chunks, test_collection, doc_id="test001", filename="test.pdf")