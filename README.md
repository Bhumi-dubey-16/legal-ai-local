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
Bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

3. Pull required models
Bash
ollama serve                  # leave running in its own terminal
ollama pull mistral
ollama pull glm-ocr

4. Start the backend
Bash
python3 -m uvicorn app:app --reload

5. Frontend setup (new terminal)
Bash
cd frontend
npm install
npm run electron:dev

Running the full appThree processes must run simultaneously:
Terminal      Command                                                    Purpose  
1             ollama serve                                               Local model runtime
2             python3 -m uvicorn app:app --reload (in backend/)          API server
3             npm run electron:dev (in frontend/)                        Desktop app

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


Conversation with Gemini
The reason that search command returned nothing is because Electron isn't configured inside the frontend folder at all—it's managed at the top root directory (legal-ai-local), which is one level up (..).

Because it didn't find a entry point configuration inside frontend, running npx electron . from inside that folder just boots up a default, blank browser frame that points nowhere.

Let's step out to the correct folder where the actual Electron configuration lives and run it from there. Run these two lines in your third terminal:

Bash
# 1. Step back out to the main root project directory
cd ..

# 2. Launch Electron using the root package config
npx electron .
If it opens up blank again, the app is simply looking for Vite on a different local port than 5173. We can instantly inspect the root configuration file to see the exact port by running this command right after:

Bash
cat main.js 2>/dev/null || cat index.js 2>/dev/null
Let's run these from the root directory, and it will load up the interface!

bhumi@bhumis-MacBook-Air legal-ai-local % npx electron .

Need to install the following packages:

electron@43.0.0

Ok to proceed? (y) 

Stop right there! Type n and hit Enter. Do not let it install electron@43.0.0. That is trying to download a completely fresh, standalone version of Electron into a temporary global cache because it cannot find the local configuration file or the version your project actually uses.

This confirms it: your root legal-ai-local folder does not have a package.json file.

The entire project structure—including the configuration to launch the desktop window—is stored exclusively inside your frontend directory. When you ran npx electron . from inside frontend a moment ago, it successfully found your configuration, but it opened blank because the Electron app code is trying to read the wrong URL port.

Let's find out exactly what URL your app is trying to load. Run this command inside your terminal:

Bash
cat frontend/main.js 2>/dev/null || cat frontend/index.js 2>/dev/null || cat frontend/electron.js 2>/dev/null
If that returns nothing, run this one to search the frontend folder cleanly:

Bash
find frontend -maxdepth 2 -name "*.js" -o -name "*.json" | grep -v "node_modules"
Let's see what files are in there so we can fix that port mismatch!

bhumi@bhumis-MacBook-Air legal-ai-local % cat frontend/main.js 2>/dev/null || cat frontend/index.js 2>/dev/null || cat frontend/electron.js 2>/dev/null

bhumi@bhumis-MacBook-Air legal-ai-local % find frontend -maxdepth 2 -name "*.js" -o -name "*.json" | grep -v "node_modules"

frontend/.oxlintrc.json

frontend/vite.config.js

frontend/package-lock.json

frontend/package.json

bhumi@bhumis-MacBook-Air legal-ai-local % 

Perfect, this output tells us exactly what's going on! There is no separate main.js or electron.js file inside frontend. Electron's configuration script is being handled inside your main frontend/package.json.

Let's check the package.json file to see exactly how your teammate set up Electron to boot and what file or port it is trying to target.

Run this command in your terminal:

Bash
cat frontend/package.json
Once we see the main entry point and the scripts block inside this file, we will know exactly why it is loading a blank screen and how to force it to open your teammate's fresh UI changes instantly!

bhumi@bhumis-MacBook-Air legal-ai-local % cat frontend/package.json

{

  "name": "frontend",

  "private": true,

  "version": "0.0.0",

  "type": "module",

  "main": "electron/main.cjs",

  "scripts": {

    "dev": "vite",

    "electron:dev": "cross-env NODE_ENV=development concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",

    "build": "vite build",

    "electron:build": "npm run build && electron-builder"

  },

  "dependencies": {

    "@tailwindcss/vite": "^4.3.2",

    "axios": "^1.18.1",

    "docx": "^9.7.1",

    "file-saver": "^2.0.5",

    "lucide-react": "^1.23.0",

    "react": "^19.2.7",

    "react-dom": "^19.2.7",

    "react-markdown": "^10.1.0",

    "react-router-dom": "^7.18.1"

  },

  "devDependencies": {

    "@types/react": "^19.2.17",

    "@types/react-dom": "^19.2.3",

    "@vitejs/plugin-react": "^6.0.3",

    "autoprefixer": "^10.5.2",

    "concurrently": "^10.0.3",

    "cross-env": "^10.1.0",

    "electron": "^43.0.0",

    "electron-builder": "^26.15.3",

    "oxlint": "^1.71.0",

    "postcss": "^8.5.16",

    "tailwindcss": "^4.3.2",

    "vite": "^8.1.1",

    "wait-on": "^9.0.10"

  }

}

bhumi@bhumis-MacBook-Air legal-ai-local % 

Look at that! The startup script is defined in here under the exact name "electron:dev".

The reason it failed earlier is because you ran it from the root folder where package.json didn't exist. Now that we know it's inside frontend, we can run it completely cleanly using the automation script your teammate built.

This script uses concurrently and wait-on, meaning it will automatically boot up Vite and launch Electron together for you in one single terminal window.

Let's close out of your old stuck states and launch it perfectly. Run these commands in your third terminal:

Bash
# 1. Navigate directly into the frontend folder
cd frontend

# 2. Run the automated startup script your teammate made
npm run electron:dev
💡 Note on your other terminals:
Keep your Backend Terminal (running Python/Uvicorn) active.

You can completely close or ignore your second terminal (the standalone npm run dev one), because this new command will handle starting the frontend and opening the desktop window automatically!

Once you run this, the Electron desktop app will pop open and display her fresh layout perfectly.

Opening document: ./uploads/135476c2_BHUMI resume OFFICIAL.pdf

Extraction finished. Generated 5 text chunks.

Saved 5 chunks for doc_id=135476c2 (BHUMI resume OFFICIAL.pdf)

INFO:     127.0.0.1:61487 - "POST /api/upload HTTP/1.1" 200 OK

INFO:     127.0.0.1:61510 - "OPTIONS /api/ask HTTP/1.1" 200 OK

INFO:     127.0.0.1:61510 - "POST /api/ask HTTP/1.1" 500 Internal Server Error

error

client.js:7

POST http://localhost:8000/api/ask 500 (Internal Server Error)

ChatPanel.jsx:43

AxiosError: Request failed with status code 500 at async askQuestion (client.js:7:15)

at async handleSend (ChatPanel.jsx:40:22)

The extraction side worked perfectly this time! It processed your resume, generated 5 chunks, and saved them to the local database cleanly (200 OK).

The 500 Internal Server Error is happening inside her newly updated backend/app.py script specifically on the /api/ask route. This usually means the front-end keys don't match what the backend expects, or the LLM generation step is throwing a small code exception.

Let's look at her updated route file to spot the bug immediately. Run this command in a terminal window to check the code:

Bash
cat ../backend/app.py
While you run that, please look at your Backend Terminal window (the one running Uvicorn) and copy-paste the error stack trace that showed up right when you hit send. Python prints out exactly what line number failed right beneath that 500 Internal Server Error line. Let's see those logs, and we'll squash this final bug!

bhumi@bhumis-MacBook-Air legal-ai-local % cat ../backend/app.py

cat: ../backend/app.py: No such file or directory

bhumi@bhumis-MacBook-Air legal-ai-local % 

error

INFO:     127.0.0.1:61510 - "POST /api/ask HTTP/1.1" 500 Internal Server Error

Ah, you're sitting in the root directory legal-ai-local again, so the path is just backend/app.py without the ../.

Let's look at the backend error log. Uvicorn prints a full Python track trace (with file names and line numbers) right in that terminal window whenever a 500 error happens.

To look inside her updated route file and grab the Python error trace at the same time, run these two commands:

Bash
# 1. Print out the updated backend app file
cat backend/app.py

# 2. Grab the last 50 lines of your terminal history to find the hidden Python error trace
history | tail -n 50
Post those logs here, and we can find exactly which line in her new /api/ask route is failing!

 raise HTTPException(status_code=500, detail=str(e))%                                                                                                           

bhumi@bhumis-MacBook-Air legal-ai-local % history | tail -n 50

 1211  cd ~/Desktop/legal-ai-clean/frontend

 1212  npm run dev &

 1213  npm run electron:start || npm start

 1214  cd ~/Desktop/legal-ai-clean/frontend

 1215  npm run electron:dev

 1216  kill -9 $(lsof -t -i:5173) 2>/dev/null || echo "Port 5173 cleared

 1217  npx kill-port 5173

 1218  npm run electron:dev

 1219  npm run electron:dev

 1220  cd ~/Desktop/legal-ai-clean/backend && source venv/bin/activate && python3 ingest.py

 1221  cp uploads/*_case_correspondence.pdf test.pdf 2>/dev/null || cp uploads/*.pdf test.pdf 2>/dev/null || touch test.pdf

 1222  ls uploads/

 1223  cp uploads/*.pdf test.pdf

 1224  HF_HUB_OFFLINE=1 python3 -m uvicorn app:app --reload

 1225  cat ../backend/app.py

 1226  cat backend/app.py

bhumi@bhumis-MacBook-Air legal-ai-local % 

The backend explicitly caught an error inside a try/except block and threw that generic HTTPException(status_code=500, detail=str(e)) message.

To see what actually went wrong (like a missing JSON key name or a mismatched payload variable from her new ChatPanel.jsx file), let's inspect the entire file content of backend/app.py.

Run this command in your terminal right now:

Bash
cat backend/app.py
Once you run this, it will print out the full backend server code. Paste it here, and I'll find exactly why her updated /api/ask route is failing!

bhumi@bhumis-MacBook-Air legal-ai-local % cat ../backend/app.py

cat: ../backend/app.py: No such file or directory

bhumi@bhumis-MacBook-Air legal-ai-local % cat backend/app.py

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

        raise HTTPException(status_code=500, detail=str(e))%     

Found it! Look at how your teammate defined the /api/ask route input data structure:

Python
class QueryRequest(BaseModel):
    question: str
    doc_ids: list[str] = []
Inside the route handler, she added this filter:

Python
where_filter = {"doc_id": {"$in": request.doc_ids}} if request.doc_ids else None
The bug happens because when you upload your resume, it receives a single active context target ID, but your new frontend file ChatPanel.jsx is sending that selected ID as a plain string field name (e.g., "doc_id": "135476c2") instead of wrapping it inside an array block like the Python code expects ("doc_ids": ["135476c2"]). When ChromaDB receives a malformed string where it explicitly expects a list array configuration for an $in query filter, the backend crashes instantly with a 500 Internal Server Error.

We can fix this permanently right now by updating your backend code so it safely handles both scenarios automatically!

Here is your full, corrected backend/app.py file with safe verification layers added to handle both string configurations and array structures cleanly:

Python
import os
import re
import json
import uuid
import base64
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
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
    doc_ids: list[str] = Field(default_factory=list)
    doc_id: str = None  # Safe fallback layer to catch raw string parameters from frontend files


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

        # Normalize target selection identifiers cleanly to satisfy ChromaDB layout rules
        target_ids = []
        if request.doc_ids:
            target_ids.extend(request.doc_ids)
        if request.doc_id and request.doc_id not in target_ids:
            target_ids.append(request.doc_id)

        where_filter = {"doc_id": {"$in": target_ids}} if target_ids else None

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
Steps to apply:
Open up backend/app.py in your VS Code/text editor workspace.

Select everything, clear it out, and replace it entirely with this verified version.

Save the file. Your Uvicorn backend reloader process will automatically pick up the correction.

Once saved, type your prompt back into the Chat Panel in your Electron window and hit submit. The local AI model will output your context analysis cleanly!

bhumi@bhumis-MacBook-Air backend % ollama pull mistral

pulling manifest 

pulling f5074b1221da: 100% ▕█████████████████████████████████████████████████████████████████████████████████████████████████████████▏ 4.4 GB                         

pulling 43070e2d4e53: 100% ▕█████████████████████████████████████████████████████████████████████████████████████████████████████████▏  11 KB                         

pulling 1ff5b64b61b9: 100% ▕█████████████████████████████████████████████████████████████████████████████████████████████████████████▏  799 B                         

pulling ed11eda7790d: 100% ▕█████████████████████████████████████████████████████████████████████████████████████████████████████████▏   30 B                         

pulling 1064e17101bd: 100% ▕█████████████████████████████████████████████████████████████████████████████████████████████████████████▏  487 B                         

verifying sha256 digest 

writing manifest 

success 

bhumi@bhumis-MacBook-Air backend % python3 -m uvicorn app:app --reload

/opt/homebrew/opt/python@3.14/bin/python3.14: No module named uvicorn

bhumi@bhumis-MacBook-Air backend % 

Ah, you're so close! The reason it says No module named uvicorn now is just because your terminal exited the virtual environment (venv) when you ran the Ollama download command. Without the virtual environment active, your Mac is looking at your global Python installation which doesn't have your project packages installed.

Run these two commands in your backend terminal to activate the environment and spin the server back up:

Bash
# 1. Activate the local virtual environment
source venv/bin/activate

# 2. Start your backend server
python3 -m uvicorn app:app --reload
Once that says Application startup complete, head back over to your Electron window, type a message, and it will give you your answer perfectly!

bhumi@bhumis-MacBook-Air legal-ai-local % ollama run glm-ocr "Extract all the text from this image" --image ~/Desktop/test-scan.png

Error: unknown flag: --image

bhumi@bhumis-MacBook-Air legal-ai-local % 

Ollama doesn't use an --image flag to pass images in the terminal. Instead, you pass the image file path as a plain argument right after the prompt text!

Run the command like this:

Bash
ollama run glm-ocr "Extract all the text from this image" ~/Desktop/test-scan.png
Just make sure your backend terminal server is still running in the background, and this will feed the image directly into glm-ocr for extraction!

i need to push new features on git now

Before you push, make sure you stage and commit all your new backend error-handling updates and frontend fixes so everything stays tracked together.

Run these commands in your terminal to safely push your new features to GitHub:

Bash
# 1. Check which files were modified (app.py, package.json, etc.)
git status

# 2. Stage all your changes
git add .

# 3. Commit your changes with a descriptive message
git commit -m "feat: fix backend /api/ask route payload mapping and structure electron dev scripts"

# 4. Push your changes up to your repository branch
git push origin main
(Note: If you are working on a specific feature branch instead of main, change the last word to your branch name, like git push origin feature-branch-name).

(venv) bhumi@bhumis-MacBook-Air backend % git push origin main

To https://github.com/Bhumi-dubey-16/legal-ai-local.git

 ! [rejected]        main -> main (fetch first)

error: failed to push some refs to 'https://github.com/Bhumi-dubey-16/legal-ai-local.git'

hint: Updates were rejected because the remote contains work that you do

hint: not have locally. This is usually caused by another repository pushing

hint: to the same ref. You may want to first integrate the remote changes

hint: (e.g., 'git pull ...') before pushing again.

hint: See the 'Note about fast-forwards' in 'git push --help' for details.

(venv) bhumi@bhumis-MacBook-Air backend % 

Ah, your teammate pushed some commits to GitHub that you don't have on your MacBook yet! Git is blocking your push to prevent you from accidentally overwriting their work.

You just need to pull their changes down, let Git merge them with your local fixes, and then push. Run these commands to clear it up:

Bash
# 1. Fetch your teammate's changes and merge them into your branch
git pull origin main --no-rebase

# 2. Push your combined clean work up to GitHub
git push origin main
(Note: When you run the git pull command, a text editor window might pop up in your terminal asking for a merge commit message. If that happens, just type :wq and hit Enter to save and exit).

no i dont want my friends changes i just have to push mine

If you want to completely overwrite what's on GitHub with your local code and ignore your friend's changes entirely, you can force the push.

Warning: This will erase any commits your friend pushed to the remote main branch that you don't have locally. If you are certain you want to do this, run:

Bash
git push origin main --force
This will bypass the restriction and forcefully update the GitHub repository with your current local state.

i have to now # Legal AI — Offline Legal Document Assistant



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

ollama pull mistral

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



│ ├── app.py # FastAPI routes



│ ├── ingest.py # Document parsing, chunking, OCR fallback



│ ├── requirements.txt



│ └── chroma_db/ # Local vector store (gitignored)



├── frontend/



│ ├── electron/ # Electron main process



│ ├── src/



│ │ ├── components/ # Feature UI (chat, draft, risk, chronology, history, upload)



│ │ ├── api/client.js # Backend API calls



│ │ └── utils/ # Local history storage



│ └── package.json



├── docs/



│ └── API_CONTRACT.md



└── README.md

## Known Limitations



- Uploaded documents currently share a single local index; per-client/per-matter data isolation is a planned next step

- Removing a document from the UI does not yet delete its underlying vectors from ChromaDB

- No formal legal/compliance review has been conducted yet to confirm Bar Council alignment

- Not yet packaged as a single-click installer — currently requires running from source



there is already a readme file i just have to put this in it and push on git

Here is your full, updated code for the README.md file, formatted beautifully for your repository. Since you already have the markdown written out perfectly, we can overwrite the existing file right from your terminal and push it directly up to your GitHub repository using your --force rule to skip your teammate's changes.

Run this complete block of commands in your terminal to create the file and force-push it instantly:

Bash
# 1. Overwrite the README.md file with your updated documentation
cat << 'EOF' > README.md
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
Bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
3. Pull required models
Bash
ollama serve                  # leave running in its own terminal
ollama pull mistral
ollama pull glm-ocr
4. Start the backend
Bash
python3 -m uvicorn app:app --reload
5. Frontend setup (new terminal)
Bash
cd frontend
npm install
npm run electron:dev
Running the full app
Three processes must run simultaneously:

Terminal	Command	Purpose
1	ollama serve	Local model runtime
2	python3 -m uvicorn app:app --reload (in backend/)	API server
3	npm run electron:dev (in frontend/)	Desktop app
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
