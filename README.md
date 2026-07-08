# Legal AI — Offline Legal Document Assistant

A fully offline AI assistant for legal professionals. Upload case files, contracts, and pleadings — ask questions, generate drafts, flag contract risks, and build case chronologies, all processed locally with zero data leaving the device.

Built to solve a real constraint: cloud AI tools like ChatGPT can't be used on privileged legal documents without risking a breach of attorney-client privilege. This runs entirely on your own machine — no internet required after setup, no third party ever sees your documents.

## Features

- **Ask Documents** — query across uploaded case files, get cited, page-referenced answers
- **Draft Assistant** — generate legal drafts (petitions, notices, contracts) from plain-English instructions, exportable as Word documents
- **Contract Risk Analyzer** — flag risky, one-sided, or missing clauses with plain-English explanations
- **Case Chronology Builder** — auto-extract a dated, cited timeline of events from case documents
- **History** — revisit past questions and drafts, re-download any generated document
- **Multi-format ingestion** — PDF, DOCX, PNG, and JPG all supported; scanned/image-based documents are read via local OCR fallback

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop App | Electron + React |
| Backend API | Python + FastAPI |
| LLM (text generation) | Mistral 7B via Ollama |
| Vision / OCR | glm-ocr via Ollama |
| Document parsing | PyMuPDF, python-docx |
| Vector search | ChromaDB |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Encryption at rest | Fernet (AES-based), via `cryptography` |

## Architecture

1. Documents are uploaded and parsed locally — PyMuPDF for PDFs, python-docx for Word files
2. Pages with no extractable text (scanned documents, images) are routed through a local vision model (`glm-ocr`) for OCR
3. Extracted text is chunked and embedded, then stored in a local ChromaDB vector index
4. User questions are embedded and matched against relevant chunks via similarity search
5. Retrieved context is passed to a local LLM (Mistral, via Ollama) to generate a grounded, cited answer
6. Nothing in this pipeline makes a network call — every model runs as a local process

## Setup

### Prerequisites

- **Node.js** v18+
- **Python** 3.9+
- **Ollama** — [download here](https://ollama.com/download)

### 1. Clone the repo

```bash
git clone [https://github.com/yourusername/legal-ai-local.git](https://github.com/yourusername/legal-ai-local.git)
cd legal-ai-local

2. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

3. Pull required models
ollama serve                  # leave running in its own terminal
ollama pull mistral
ollama pull glm-ocr

4. Start the backend
python3 -m uvicorn app:app --reload

5. Frontend setup (new terminal)
cd frontend
npm install
npm run electron:dev


Three processes must run simultaneously:
Terminal                               Command                                               Purpose
1                                      ollama serve                                          Local model runtime
2                                      python3 -m uvicorn app:app --reload (in backend/)     API server
3                                      npm run electron:dev (in frontend/)                   Desktop app


Project Structure
legal-ai-local/
├── backend/
│   ├── app.py            # FastAPI routes
│   ├── ingest.py         # Document parsing, chunking, OCR fallback
│   ├── requirements.txt
│   └── chroma_db/        # Local vector store (gitignored)
├── frontend/
│   ├── electron/          # Electron main process
│   ├── src/
│   │   ├── components/    # Feature UI (chat, draft, risk, chronology, history, upload)
│   │   ├── api/client.js  # Backend API calls
│   │   └── utils/         # Local history storage
│   └── package.json
├── docs/
│   └── API_CONTRACT.md
└── README.md

Known Limitations
Uploaded documents currently share a single local index; per-client/per-matter data isolation is a planned next step

Removing a document from the UI does not yet delete its underlying vectors from ChromaDB

No formal legal/compliance review has been conducted yet to confirm Bar Council alignment

Not yet packaged as a single-click installer — currently requires running from source