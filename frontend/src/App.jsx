import { useState, useEffect } from 'react';
import { MessageSquare, FileText, ShieldAlert, Clock3, File, CheckSquare, Square, History, X } from 'lucide-react';
import FileUpload from './components/upload/FileUpload';
import ChatPanel from './components/chat/ChatPanel';
import DraftAssistant from './components/draft/DraftAssistant';
import RiskViewer from './components/risk/RiskViewer';
import ChronologyView from './components/chronology/ChronologyView';
import HistoryView from './components/history/HistoryView';

const TABS = [
  { id: 'ask', label: 'Ask Documents', icon: MessageSquare },
  { id: 'draft', label: 'Draft Assistant', icon: FileText },
  { id: 'risk', label: 'Contract Risk', icon: ShieldAlert },
  { id: 'chronology', label: 'Chronology', icon: Clock3 },
  { id: 'history', label: 'History', icon: History },
];

const DOCS_KEY = 'legalai_documents';
const CHECKED_KEY = 'legalai_checked_docs';

function loadDocs() {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadChecked() {
  try {
    const raw = localStorage.getItem(CHECKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('ask');

  const [documents, setDocuments] = useState(loadDocs);
  const [checkedDocIds, setCheckedDocIds] = useState(loadChecked);

  const [loadedChatSession, setLoadedChatSession] = useState(null);
  const [loadedDraft, setLoadedDraft] = useState(null);

  // Persist documents + selection to disk (localStorage) every time they change
  useEffect(() => {
    localStorage.setItem(DOCS_KEY, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(CHECKED_KEY, JSON.stringify(checkedDocIds));
  }, [checkedDocIds]);

  const toggleDocSelection = (docId) => {
    setCheckedDocIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const deleteDocument = (docId, e) => {
    e.stopPropagation(); // don't trigger the checkbox toggle underneath
    setDocuments(prev => prev.filter(d => d.doc_id !== docId));
    setCheckedDocIds(prev => prev.filter(id => id !== docId));
  };

  const openChatSession = (session) => {
    setLoadedChatSession(session);
    setActiveTab('ask');
  };

  const openDraft = (draft) => {
    setLoadedDraft(draft);
    setActiveTab('draft');
  };

  const requiresDocSelection = activeTab !== 'history';

  return (
    <div className="h-screen flex bg-paper text-ink">
      <aside className="w-76 border-r border-line flex flex-col">
        <div className="px-5 py-4 border-b border-line">
          <p className="text-[11px] tracking-widest text-slate uppercase">Workspace</p>
          <h1 className="font-serif-doc text-lg mt-0.5">Case Files</h1>
        </div>

        <nav className="px-3 py-3 border-b border-line">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 text-sm px-3 py-2 rounded-md mb-1 transition-colors ${
                  active ? 'bg-brass-soft text-ink font-medium' : 'text-ink-soft hover:bg-line/50'
                }`}
              >
                <Icon size={15} strokeWidth={1.75} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <p className="text-[11px] tracking-widest text-slate uppercase mb-2">Upload Files</p>
            <FileUpload onUploaded={(newDoc) => {
              setDocuments(prev => [...prev, newDoc]);
              setCheckedDocIds(prev => [...prev, newDoc.doc_id]);
            }} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] tracking-widest text-slate uppercase">Select Files to Use</p>
              <span className="text-[10px] text-slate bg-line/40 px-1.5 py-0.5 rounded">
                {checkedDocIds.length} selected
              </span>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {documents.map((doc) => {
                const isChecked = checkedDocIds.includes(doc.doc_id);
                return (
                  <div
                    key={doc.doc_id}
                    onClick={() => toggleDocSelection(doc.doc_id)}
                    className="w-full flex items-center gap-2.5 text-xs px-2 py-2 rounded hover:bg-line/30 transition-colors text-left border border-transparent cursor-pointer group"
                  >
                    <div className="flex-shrink-0">
                      {isChecked ? (
                        <CheckSquare size={14} className="text-brass" />
                      ) : (
                        <Square size={14} className="text-slate" />
                      )}
                    </div>
                    <File size={13} className="text-slate flex-shrink-0" />
                    <span className={`truncate flex-1 ${isChecked ? 'font-medium text-ink' : 'text-ink-soft'}`}>
                      {doc.name}
                    </span>
                    <button
                      onClick={(e) => deleteDocument(doc.doc_id, e)}
                      className="flex-shrink-0 text-slate opacity-0 group-hover:opacity-100 hover:text-risk-high transition-opacity"
                      title="Remove document"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
              {documents.length === 0 && (
                <p className="text-[11px] italic text-slate py-2">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-line text-[11px] text-slate flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-risk-low" />
          Offline Environment · Secure Data Vault
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {requiresDocSelection && checkedDocIds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-paper">
            <p className="text-sm text-slate max-w-sm leading-relaxed">
              Please check at least one document in the sidebar list to use the <strong>{TABS.find(t => t.id === activeTab)?.label}</strong> feature.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'ask' && <ChatPanel docIds={checkedDocIds} loadedSession={loadedChatSession} />}
            {activeTab === 'draft' && <DraftAssistant docIds={checkedDocIds} loadedDraft={loadedDraft} />}
            {activeTab === 'risk' && <RiskViewer docIds={checkedDocIds} />}
            {activeTab === 'chronology' && <ChronologyView docIds={checkedDocIds} />}
            {activeTab === 'history' && <HistoryView onOpenChat={openChatSession} onOpenDraft={openDraft} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;