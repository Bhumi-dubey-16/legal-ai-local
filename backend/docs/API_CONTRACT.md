# API Contract

Base URL (local): http://localhost:8000

## POST /api/ask
Request:  { "query": string, "doc_ids": string[] }
Response: { "answer": string, "citations": [{ "doc_id": string, "page": number, "snippet": string }] }

## POST /api/draft
Request:  { "instruction": string, "reference_doc_ids": string[] }
Response: { "draft_text": string, "format": "docx" }

## POST /api/contract/analyze
Request:  { "doc_id": string }
Response: { "risks": [{ "clause": string, "severity": "low"|"medium"|"high", "explanation": string }] }

## POST /api/chronology
Request:  { "doc_ids": string[] }
Response: { "events": [{ "date": string, "description": string, "source_doc": string, "source_page": number }] }

## POST /api/documents/upload
Request:  multipart/form-data (file)
Response: { "doc_id": string, "filename": string, "status": "processing"|"ready" }