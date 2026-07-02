import base64
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from chromadb.utils import embedding_functions
import ollama

# Global dictionary to safely hold our database collection across Windows processes
models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Rows 1 & 2: Safely loads the heavy AI models exactly ONCE when the server boots up,
    preventing Windows background reload crashes.
    """
    print("🚀 Initializing local AI models and ChromaDB...")
    
    CHROMA_DATA_PATH = "./chroma_db"
    chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
    default_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    try:
        collection = chroma_client.get_collection(
            name="legal_docs", 
            embedding_function=default_ef
        )
        models["collection"] = collection
        print("✅ Legal document database loaded successfully!")
    except Exception as e:
        print(f"❌ Warning: Could not load collection 'legal_docs'. Error: {e}")
    
    yield
    models.clear()

# Pass our lifespan configuration to FastAPI
app = FastAPI(title="Offline Legal AI Backend Server", lifespan=lifespan)

# Keep CORS configurations active so Bhumi's frontend can connect smoothly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REQUEST SCHEMAS (Pydantic Models) ---
class QueryRequest(BaseModel):
    question: str

class DraftRequest(BaseModel):
    prompt: str

class EncryptionRequest(BaseModel):
    text: str


# --- API ROUTES ---

@app.get("/")
def home():
    return {"status": "online", "message": "Offline Legal AI Backend Server is running"}


@app.post("/api/ask")
def ask_local_ai(request: QueryRequest):
    """
    ROW 2: Takes a question, pulls matching context from ChromaDB, 
    and lets the local Ollama model formulate a precise response.
    """
    try:
        collection = models.get("collection")
        if not collection:
            raise HTTPException(status_code=500, detail="Database collection is not initialized.")
            
        db_results = collection.query(
            query_texts=[request.question],
            n_results=2
        )
        
        context_chunks = []
        source_pages = []
        if db_results['documents'] and db_results['documents'][0]:
            for i in range(len(db_results['documents'][0])):
                context_chunks.append(db_results['documents'][0][i])
                source_pages.append(str(db_results['metadatas'][0][i]['page']))
        
        context_text = "\n\n---\n\n".join(context_chunks)
        
        if not context_text:
            return {
                "success": False,
                "answer": "I couldn't find any relevant details in the documents to answer that question.", 
                "sources": []
            }

        system_prompt = f"""
        You are a precise, helpful AI assistant. You must answer the user's question using ONLY the verified document context provided below. 
        If the context does not contain the answer, politely state that you cannot find it in the provided documents. Do not make up information.

        ---
        VERIFIED CONTEXT FROM DOCUMENTS:
        {context_text}
        ---
        """

        response = ollama.generate(
            model="llama3.2:3b",
            prompt=f"{system_prompt}\n\nUser Question: {request.question}\nYour precise answer:"
        )
        
        return {
            "success": True,
            "answer": response['response'].strip(),
            "sources": list(set(source_pages))
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/draft")
def draft_and_analyze_risk(request: DraftRequest):
    """
    ROW 3: Generates a legal draft based on a prompt and automatically 
    extracts a structured list of legal risks or liabilities.
    """
    try:
        system_instruction = """
        You are an expert legal counsel assistant. Generate a professional legal draft based on the user's request.
        Immediately following the draft, provide a dedicated section titled 'RISK ANALYSIS' where you bullet-point at least 2-3 potential risks, vulnerabilities, or heavy obligations for the parties involved.
        """
        
        response = ollama.generate(
            model="llama3.2:3b",
            prompt=f"{system_instruction}\n\nUser Request: {request.prompt}\n\nLegal Draft and Risk Analysis:"
        )
        
        full_text = response['response'].strip()
        
        draft_part = full_text
        risk_part = "No specific risks flagged by the model."
        
        if "RISK ANALYSIS" in full_text:
            parts = full_text.split("RISK ANALYSIS")
            draft_part = parts[0].strip()
            risk_part = parts[1].replace(":", "").strip()

        return {
            "success": True,
            "draft": draft_part,
            "risk_analysis": risk_part
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chronology")
def extract_chronology():
    """
    ROW 4: Scans the loaded ChromaDB document chunks to build a 
    structured chronological timeline of dates and key events.
    """
    try:
        collection = models.get("collection")
        if not collection:
            raise HTTPException(status_code=500, detail="Database collection not initialized.")
        
        existing_docs = collection.get(limit=5)
        context_text = "\n".join(existing_docs['documents']) if existing_docs['documents'] else ""
        
        if not context_text:
            return {"success": False, "timeline": "No documents found to construct a timeline."}

        timeline_prompt = f"""
        Analyze the following text segments and extract a clean chronological timeline of events, milestones, or dates mentioned.
        Format it as a clean list ordered by date.
        
        TEXT SEGMENTS:
        {context_text}
        """
        
        response = ollama.generate(
            model="llama3.2:3b",
            prompt=timeline_prompt
        )
        
        return {
            "success": True,
            "timeline": response['response'].strip()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/encrypt")
def local_encrypt_utility(request: EncryptionRequest):
    """
    ROW 5: Fast local obfuscation/encryption mock utility to demonstrate 
    data privacy pipelines for sensitive contract details.
    """
    try:
        encoded_bytes = base64.b64encode(request.text.encode("utf-8"))
        encrypted_string = encoded_bytes.decode("utf-8")
        
        return {
            "success": True,
            "original_length": len(request.text),
            "masked_token": f"AES256_LOCAL_{encrypted_string}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))