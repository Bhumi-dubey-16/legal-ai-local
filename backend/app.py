from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Offline Legal AI Backend")

# Enable CORS so Bhumi's frontend can talk to your backend locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "Online", "mode": "100% Offline / Local"}

@app.get("/api/health")
def health_check():
    return {"database": "Ready", "ai_engine": "Ready"}