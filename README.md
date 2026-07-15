# Legal AI — Offline Legal Document Assistant
DEMO LINK- https://drive.google.com/drive/folders/1zdOc1D_kUJNmPtKvK4i4seDiBN6oCn4k?usp=sharing

A fully offline AI assistant for legal professionals. Upload case files, contracts, and pleadings — ask questions, generate drafts, flag contract risks, and build case chronologies, all processed locally with zero data leaving the device.

Built to solve a real constraint: cloud AI tools like ChatGPT can't be used on privileged legal documents without risking a breach of attorney-client privilege. This runs entirely on your own machine — no internet required after setup, no third party ever sees your documents.

## Features

- **Ask Documents** — query across uploaded case files in English or Hindi, get cited, page-referenced answers
- **Draft Assistant** — generate legal drafts (petitions, notices, contracts) from plain-English instructions, exportable as Word documents
- **Contract Risk Analyzer** — flag risky, one-sided, or missing clauses with plain-English explanations
- **Case Chronology Builder** — auto-extract a dated, cited timeline of events from case documents
- **History** — revisit past questions and drafts, re-download any generated document
- **Multi-format ingestion** — PDF, DOCX, PNG, and JPG all supported; scanned/image-based documents and direct image uploads are read via local vision-model OCR
- **Multilingual support (Hindi/English)** — ask questions in Hindi or English; the assistant detects the input language and responds in the same language, regardless of the language of the source document

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop App | Electron + React |
| Backend API | Python + FastAPI |
| LLM (text generation) | Qwen2.5 7B via Ollama |
| Vision / OCR | glm-ocr via Ollama |
| Document parsing | PyMuPDF, python-docx |
| Vector search | ChromaDB |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Encryption at rest | Fernet (AES-based), via `cryptography` |

## Architecture

1. Documents are uploaded and parsed locally — PyMuPDF for PDFs, python-docx for Word files
2. Pages with no extractable text (scanned documents), and direct image uploads (PNG/JPG), are routed through a local vision model (`glm-ocr`) for OCR
3. Extracted text is chunked and embedded, then stored in a local ChromaDB vector index
4. User questions are embedded and matched against relevant chunks via similarity search
5. The input question's language is detected (Hindi via Devanagari script detection, otherwise English), and the model is explicitly instructed to respond in that same language
6. Retrieved context is passed to a local LLM (Qwen2.5 7B, via Ollama) to generate a grounded, cited answer in the detected language
7. Nothing in this pipeline makes a network call — every model runs as a local process

### Why Qwen2.5 over Mistral

Mistral 7B was the original model used for text generation, but testing showed it was unreliable for Hindi output. Qwen2.5 7B was chosen as a replacement after direct testing confirmed significantly better factual accuracy and coherence in Hindi, at a comparable model size and inference speed. A smaller Qwen variant (3B) was also tested and rejected — it produced factually incorrect answers in Hindi, confirming this specific capability requires the larger model.

### Why two separate AI models (Qwen + glm-ocr)

Qwen handles all text reasoning — answering questions, drafting, risk analysis, chronology extraction. `glm-ocr` is used specifically for reading text out of images and scanned pages, since it's purpose-built for document OCR and performs more reliably at that narrow task than a general-purpose model would. Standard text-based PDFs are parsed directly via PyMuPDF and never touch the vision model at all, keeping normal document processing fast.

## Setup

### Prerequisites

- **Node.js** v18+
- **Python** 3.9+
- **Ollama** — [download here](https://ollama.com/download)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/legal-ai-local.git
cd legal-ai-local
```

### 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Pull required models

```bash
ollama serve                  # leave running in its own terminal
ollama pull qwen2.5:7b
ollama pull glm-ocr
```

### 4. Start the backend

```bash
python3 -m uvicorn app:app --reload
```

### 5. Frontend setup (new terminal)

```bash
cd frontend
npm install
npm run electron:dev
```

### Running the full app

Three processes must run simultaneously:

| Terminal | Command | Purpose |
|---|---|---|
| 1 | `ollama serve` | Local model runtime |
| 2 | `python3 -m uvicorn app:app --reload` (in `backend/`) | API server |
| 3 | `npm run electron:dev` (in `frontend/`) | Desktop app |

## Project Structure
legal-ai-local/
├── backend/
│   ├── app.py            # FastAPI routes, language detection, model calls
│   ├── ingest.py         # Document parsing, chunking, OCR fallback (PDF/DOCX/image)
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
## Known Limitations

- Language detection currently supports Hindi and English only (via Devanagari script detection); other languages default to English
- Retrieval (ChromaDB search) still uses an English-focused embedding model — Hindi *generation* is fully supported, but Hindi *search relevance* has not yet been upgraded with a multilingual embedding model, which would require re-indexing all existing documents
- Uploaded documents currently share a single local index; per-client/per-matter data isolation is a planned next step
- Removing a document from the UI does not yet delete its underlying vectors from ChromaDB
- Full at-rest file encryption is not yet implemented — the current encryption utility covers a single API endpoint, not the uploaded documents themselves
- No formal legal/compliance review has been conducted yet to confirm Bar Council alignment
- Not yet packaged as a single-click installer — currently requires running from source
