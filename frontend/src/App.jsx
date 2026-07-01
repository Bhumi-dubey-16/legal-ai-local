import { useState } from 'react';
import { MessageSquare, FileText, ShieldAlert, Clock3, File, CheckSquare, Square } from 'lucide-react';
import FileUpload from './components/upload/FileUpload';
import ChatPanel from './components/chat/ChatPanel';
import DraftAssistant from './components/draft/DraftAssistant';
import RiskViewer from './components/risk/RiskViewer';
import ChronologyView from './components/chronology/ChronologyView';

const TABS = [
  { id: 'ask', label: 'Ask Documents', icon: MessageSquare },
  { id: 'draft', label: 'Draft Assistant', icon: FileText },
  { id: 'risk', label: 'Contract Risk', icon: ShieldAlert },
  { id: 'chronology', label: 'Chronology', icon: Clock3 },
];

function App() {
  const [activeTab, setActiveTab] = useState('ask');
  
  // Clean flat list of uploaded documents
  const [documents, setDocuments] = useState([
    { doc_id: 'doc_1', name: 'Primary_Agreement.pdf' },
    { doc_id: 'doc_2', name: 'Pleadings_Draft.pdf' }
  ]);
  
  // Track IDs of files that are explicitly checked
  const [checkedDocIds, setCheckedDocIds] = useState(['doc_1']);

  const toggleDocSelection = (docId) => {
    setCheckedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  return (
    <div className="h-screen flex bg-paper text-ink">
      {/* Sidebar Control Panel */}
      <aside className="w-76 border-r border-line flex flex-col">
        <div className="px-5 py-4 border-b border-line">
          <p className="text-[11px] tracking-widest text-slate uppercase">Workspace</p>
          <h1 className="font-serif-doc text-lg mt-0.5">Case Files</h1>
        </div>

        {/* Feature Navigation Tabs */}
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

        {/* Unified Document Ingestion & Selection Matrix */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Flat File Ingestion Dropzone */}
          <div>
            <p className="text-[11px] tracking-widest text-slate uppercase mb-2">Upload Files</p>
            <FileUpload onUploaded={(newDoc) => {
              setDocuments(prev => [...prev, newDoc]);
              setCheckedDocIds(prev => [...prev, newDoc.doc_id]); // Auto-check on upload
            }} />
          </div>

          {/* Selectable File Registry */}
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
                  <button
                    key={doc.doc_id}
                    onClick={() => toggleDocSelection(doc.doc_id)}
                    className="w-full flex items-center gap-2.5 text-xs px-2 py-2 rounded hover:bg-line/30 transition-colors text-left border border-transparent"
                  >
                    <div className="flex-shrink-0">
                      {isChecked ? (
                        <CheckSquare size={14} className="text-brass" />
                      ) : (
                        <Square size={14} className="text-slate" />
                      )}
                    </div>
                    <File size={13} className="text-slate flex-shrink-0" />
                    <span className={`truncate ${isChecked ? 'font-medium text-ink' : 'text-ink-soft'}`}>
                      {doc.name}
                    </span>
                  </button>
                );
              })}
              {documents.length === 0 && (
                <p className="text-[11px] italic text-slate py-2">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Local Security Status Anchor */}
        <div className="px-5 py-3 border-t border-line text-[11px] text-slate flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-risk-low" />
          Offline Environment · Secure Data Vault
        </div>
      </aside>

      {/* Primary Feature Render Target */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {checkedDocIds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-paper">
            <p className="text-sm text-slate max-w-sm leading-relaxed">
              Please check at least one document in the sidebar list to use the <strong>{TABS.find(t => t.id === activeTab)?.label}</strong> feature.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'ask' && <ChatPanel docIds={checkedDocIds} />}
            {activeTab === 'draft' && <DraftAssistant docIds={checkedDocIds} />}
            {activeTab === 'risk' && <RiskViewer docIds={checkedDocIds} />}
            {activeTab === 'chronology' && <ChronologyView docIds={checkedDocIds} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;