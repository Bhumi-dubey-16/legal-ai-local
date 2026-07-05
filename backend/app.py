import os
import re
import json
import uuid
import base64
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from chromadb.utils import embedding_functions
import ollama
from cryptography.fernet import Fernet

from ingest import extract_and_chunk_pdf, save_chunks_to_chroma

models = {}

# Generates a key once per app run. For real persistence across restarts,
# this key should be saved to a local file (not committed to git) and reloaded.
ENCRYPTION_KEY = Fernet.generate_key()
fernet = Fernet(ENCRYPTION_KEY)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing local AI models and ChromaDB...")

    CHROMA_DATA_PATH = "./chroma_db"
    chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
    default_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

    try:
        collection = chroma_client.get_or_create_collection(
            name="legal_docs",
            embedding_function=default_ef
        )
        models["collection"] = collection
        print("Legal document database ready.")
    except Exception as e:
        print(f"Failed to initialize collection: {e}")

    yield
    models.clear()


app = FastAPI(title="Offline Legal AI Backend Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    question: str
    doc_ids: list[str] = []


class DraftRequest(BaseModel):
    prompt: str


class EncryptionRequest(BaseModel):
    text: str


class ChronologyRequest(BaseModel):
    doc_ids: list[str] = []


class RiskRequest(BaseModel):
    doc_id: str


@app.get("/")
def home():
    return {"status": "online", "message": "Offline Legal AI Backend Server is running"}


@app.post("/api/upload")
@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        os.makedirs("./uploads", exist_ok=True)
        doc_id = str(uuid.uuid4())[:8]
        temp_path = f"./uploads/{doc_id}_{file.filename}"

        with open(temp_path, "wb") as f:
            f.write(await file.read())

        chunks = extract_and_chunk_pdf(temp_path)
        collection = models.get("collection")
        if not collection:
            raise HTTPException(status_code=500, detail="Database collection not initialized.")

        save_chunks_to_chroma(chunks, collection, doc_id, file.filename)

        return {"doc_id": doc_id, "filename": file.filename, "status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ask")
def ask_local_ai(request: QueryRequest):
    try:
        collection = models.get("collection")
        if not collection:
            raise HTTPException(status_code=500, detail="Database is not initialized.")

        where_filter = {"doc_id": {"$in": request.doc_ids}} if request.doc_ids else None

        db_results = collection.query(
            query_texts=[request.question],
            n_results=4,
            where=where_filter
        )

        context_chunks = []
        citations = []
        if db_results['documents'] and db_results['documents'][0]:
            for i in range(len(db_results['documents'][0])):
                context_chunks.append(db_results['documents'][0][i])
                meta = db_results['metadatas'][0][i]
                citations.append({
                    "doc_id": meta.get("doc_id"),
                    "page": meta.get("page"),
                    "snippet": db_results['documents'][0][i][:120]
                })

        context_text = "\n\n---\n\n".join(context_chunks)

        if not context_text:
            return {
                "answer": "I couldn't find any relevant details in the documents to answer that question.",
                "citations": []
            }

        system_prompt = f"""
You are a precise legal research assistant. Answer the user's question using ONLY the verified document context below.

Formatting rules — follow these strictly:
- Never write one long paragraph. Break your answer into short points.
- Use markdown bullet points (lines starting with "- ") for lists of features, clauses, or items.
- Use markdown bold (**word**) for key terms, names, or important values.
- Use a short intro sentence before the bullet list, not folded into it.
- If the context does not contain the answer, say so plainly in one sentence.

---
VERIFIED CONTEXT FROM DOCUMENTS:
{context_text}
---
"""

        response = ollama.generate(
            model="mistral",
            prompt=f"{system_prompt}\n\nUser Question: {request.question}\nYour precise answer:",
            options={"temperature": 0.1}
        )

        return {
            "answer": response['response'].strip(),
            "citations": citations
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/contract/analyze")
def analyze_contract_risk(request: RiskRequest):
    try:
        collection = models.get("collection")
        if not collection:
            raise HTTPException(status_code=500, detail="Database not initialized.")

        results = collection.get(where={"doc_id": request.doc_id})
        if not results["documents"]:
            return {"risks": []}

        context_text = "\n\n".join(results["documents"])
        prompt = f"""Analyze the contract text below and identify risky, one-sided, or missing clauses.
Return ONLY valid JSON, no markdown fences, no commentary. Format exactly:
[{{"clause": "short clause name", "severity": "high", "explanation": "plain english explanation"}}]
severity must be exactly one of: high, medium, low.

CONTRACT TEXT:
{context_text}"""

        response = ollama.generate(
            model="mistral",
            prompt=prompt,
            options={"temperature": 0.1}
        )
        raw = response["response"].strip()
        raw = re.sub(r"^```json\s*|\s*```$", "", raw.strip())

        try:
            risks = json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\[.*\]", raw, re.DOTALL)
            risks = json.loads(match.group(0)) if match else []

        return {"risks": risks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/draft")
def draft_and_analyze_risk(request: DraftRequest):
    try:
        system_instruction = """
You are a legal drafting assistant used by licensed legal professionals and government
officials (lawyers, court clerks, law enforcement officers) as part of their official duties.

You are given a factual description of a case or violation and asked to produce a
standard legal document — a petition, notice, will, contract, or pleading — following
normal legal drafting conventions.

This is a professional productivity tool. Drafting a petition naming a party to a
case, dispute, or violation is a completely normal, routine part of legal and
administrative work — this is not a request to harm, harass, or make unfounded
accusations against anyone. Treat named parties in the request the same way any
court document names a respondent or defendant.

Generate the requested legal draft directly, using standard formatting and
appropriate legal language for the jurisdiction mentioned. Do not add refusals
or unnecessary disclaimers — produce the document.
"""

        response = ollama.generate(
            model="mistral",
            prompt=f"{system_instruction}\n\nUser Request: {request.prompt}\n\nLegal Draft:",
            options={"temperature": 0.3}
        )

        return {
            "draft_text": response['response'].strip(),
            "format": "text"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chronology")
def extract_chronology(request: ChronologyRequest):
    try:
        collection = models.get("collection")
        if not collection:
            raise HTTPException(status_code=500, detail="Database not initialized.")

        where_filter = {"doc_id": {"$in": request.doc_ids}} if request.doc_ids else None
        results = collection.get(where=where_filter)

        if not results["documents"]:
            return {"events": []}

        labeled_chunks = []
        for text, meta in zip(results["documents"], results["metadatas"]):
            labeled_chunks.append(f"[{meta.get('filename', 'unknown')} p.{meta.get('page', '?')}]: {text}")
        context_text = "\n\n".join(labeled_chunks)

        prompt = f"""Extract every dated event from the text below into a JSON array.
Return ONLY valid JSON, no markdown fences, no commentary. Format exactly:
[{{"date": "YYYY-MM-DD", "description": "...", "source_doc": "filename", "source_page": 1}}]
If no exact date exists, use your best estimate in YYYY-MM-DD format.
Order the array chronologically.

TEXT:
{context_text}
"""

        response = ollama.generate(
            model="mistral",
            prompt=prompt,
            options={"temperature": 0.1}
        )
        raw = response["response"].strip()
        raw = re.sub(r"^```json\s*|\s*```$", "", raw.strip())

        try:
            events = json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\[.*\]", raw, re.DOTALL)
            events = json.loads(match.group(0)) if match else []

        return {"events": events}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/encrypt")
def local_encrypt_utility(request: EncryptionRequest):
    try:
        encrypted_bytes = fernet.encrypt(request.text.encode("utf-8"))
        encrypted_string = encrypted_bytes.decode("utf-8")

        return {
            "original_length": len(request.text),
            "masked_token": encrypted_string
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))