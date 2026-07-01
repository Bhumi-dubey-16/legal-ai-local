// Mock configurations
const USE_MOCK = true;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const client = {
  post: async (url, data) => {
    console.log(`API POST to ${url}`, data);
    return { data: {} };
  }
};

export async function uploadDocument(file) {
  if (USE_MOCK) {
    await delay(1000);
    return {
      doc_id: `doc_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`
    };
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await client.post('/upload', formData);
  return res.data;
}

export async function sendChatMessage(messages, docIds) {
  if (USE_MOCK) {
    await delay(1000);
    return {
      message: `[Context: analyzing ${docIds.length} active documents] I have processed your request based on the selected folders and documents. The core obligations appear standard, with exceptions noted in specific clauses.`
    };
  }
  const res = await client.post('/chat', { messages, doc_ids: docIds });
  return res.data;
}

export async function analyzeContract(docId) {
  if (!docId) return { risks: [] };
  if (USE_MOCK) {
    await delay(1200);
    return {
      risks: [
        { clause: "Termination for Convenience (Cl. 9.2)", severity: "high", explanation: "Only the counterparty may terminate without cause. You have no equivalent right, creating a one-sided exit option." },
        { clause: "Limitation of Liability (Cl. 14.1)", severity: "medium", explanation: "Liability cap is set at 1x fees paid, well below market standard of 2–3x for this contract type." },
        { clause: "Indemnification (Cl. 16.4)", severity: "low", explanation: "Standard mutual indemnity language, no unusual carve-outs found." },
      ],
    };
  }
  const res = await client.post('/contract/analyze', { doc_id: docId });
  return res.data;
}

export async function generateDraft(instruction, referenceDocIds) {
  if (USE_MOCK) {
    await delay(1500);
    return {
      draft_text: `PETITION UNDER SECTION 9\n\nTo the Hon'ble Court,\n\nThe Petitioner respectfully submits as follows:\n\n1. That the above-named parties entered into an agreement dated [DATE]...\n\n2. That the Respondent has failed to fulfil obligations under Clause [X]...\n\n[Draft continues based on: "${instruction}" across ${referenceDocIds.length} reference files]`,
      format: "docx",    };
  }
  const res = await client.post('/draft', { instruction, reference_doc_ids: referenceDocIds });
  return res.data;
}

export async function buildChronology(docIds) {
  if (USE_MOCK) {
    await delay(1300);
    return {
      events: [
        { date: "2025-01-10", description: "Initial agreement signed between parties", source_doc: "Agreement.pdf", source_page: 1 },
        { date: "2025-03-03", description: "First disputed meeting occurs", source_doc: "Minutes.pdf", source_page: 12 },
        { date: "2025-04-22", description: "Respondent issues notice of breach", source_doc: "Notice_Letter.pdf", source_page: 3 },
      ],
    };
  }
  const res = await client.post('/chronology', { doc_ids: docIds });
  return res.data;
}