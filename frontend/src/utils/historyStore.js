const CHAT_KEY = 'legalai_chat_history';
const DRAFT_KEY = 'legalai_draft_history';

function loadList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

// --- Chat sessions (Ask Documents) ---
export function saveChatSession(session) {
  const list = loadList(CHAT_KEY);
  const idx = list.findIndex((s) => s.id === session.id);
  if (idx >= 0) list[idx] = session;
  else list.unshift(session);
  saveList(CHAT_KEY, list.slice(0, 100));
}

export function getChatHistory() {
  return loadList(CHAT_KEY);
}

export function deleteChatSession(id) {
  saveList(CHAT_KEY, loadList(CHAT_KEY).filter((s) => s.id !== id));
}

// --- Drafts ---
export function saveDraft(draft) {
  const list = loadList(DRAFT_KEY);
  list.unshift(draft);
  saveList(DRAFT_KEY, list.slice(0, 100));
}

export function getDraftHistory() {
  return loadList(DRAFT_KEY);
}

export function deleteDraft(id) {
  saveList(DRAFT_KEY, loadList(DRAFT_KEY).filter((d) => d.id !== id));
}