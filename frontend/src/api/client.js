import axios from 'axios';

const client = axios.create({ baseURL: 'http://localhost:8000/api' });

// --- Ask Questions ---
export async function askQuestion(query, docIds) {
  const res = await client.post('/ask', { question: query, doc_ids: docIds });
  return {
    answer: res.data.answer,
    citations: res.data.citations || [],
  };
}

// --- Document Upload ---
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await client.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// --- Draft Assistant ---
export async function generateDraft(instruction, referenceDocIds) {
  const res = await client.post('/draft', { prompt: instruction });
  return {
    draft_text: res.data.draft_text,
    format: res.data.format,
  };
}

// --- Contract Risk ---
export async function analyzeContract(docId) {
  const res = await client.post('/contract/analyze', { doc_id: docId });
  return { risks: res.data.risks };
}

// --- Chronology ---
export async function buildChronology(docIds) {
  const res = await client.post('/chronology', { doc_ids: docIds });
  return { events: res.data.events };
}