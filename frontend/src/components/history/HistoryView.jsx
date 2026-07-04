import { useState, useEffect } from 'react';
import { Download, Trash2, MessageSquare, FileText, RefreshCw } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { getChatHistory, deleteChatSession, getDraftHistory, deleteDraft } from '../../utils/historyStore';

export default function HistoryView({ onOpenChat, onOpenDraft }) {
  const [tab, setTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setChats(getChatHistory());
    setDrafts(getDraftHistory());
  };

  const handleRefreshClick = () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 300); // brief visual feedback
  };

  useEffect(() => { refresh(); }, []);

  const handleExportDraft = async (draft) => {
    const paragraphs = draft.draftText
      .split('\n')
      .map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })], spacing: { after: 200 } }));
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `draft-${draft.id}.docx`);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] tracking-widest text-slate uppercase">History</p>
        <button
          onClick={handleRefreshClick}
          title="Refresh history"
          className="text-slate hover:text-ink transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      <h2 className="font-serif-doc text-xl text-ink mb-4">Past sessions & drafts</h2>

      <div className="flex gap-4 mb-5 border-b border-line">
        <button
          onClick={() => setTab('chats')}
          className={`text-sm pb-2 border-b-2 transition-colors ${tab === 'chats' ? 'border-brass text-ink font-medium' : 'border-transparent text-slate'}`}
        >
          Questions
        </button>
        <button
          onClick={() => setTab('drafts')}
          className={`text-sm pb-2 border-b-2 transition-colors ${tab === 'drafts' ? 'border-brass text-ink font-medium' : 'border-transparent text-slate'}`}
        >
          Drafts
        </button>
      </div>

      {tab === 'chats' && (
        <div className="space-y-2">
          {chats.length === 0 && <p className="text-sm text-slate">No past questions yet.</p>}
          {chats.map((session) => (
            <div key={session.id} className="border border-line rounded-md p-3.5 flex items-start gap-3">
              <MessageSquare size={15} className="text-slate mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink truncate">{session.messages[0]?.content || 'Untitled session'}</p>
                <p className="text-[11px] text-slate mt-0.5">
                  {new Date(session.timestamp).toLocaleString()} · {session.messages.length} messages
                </p>
              </div>
              <button onClick={() => onOpenChat(session)} className="text-xs px-2.5 py-1 border border-line rounded hover:border-brass shrink-0">
                Open
              </button>
              <button onClick={() => { deleteChatSession(session.id); refresh(); }} className="text-slate hover:text-risk-high shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'drafts' && (
        <div className="space-y-2">
          {drafts.length === 0 && <p className="text-sm text-slate">No past drafts yet.</p>}
          {drafts.map((draft) => (
            <div key={draft.id} className="border border-line rounded-md p-3.5 flex items-start gap-3">
              <FileText size={15} className="text-slate mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink truncate">{draft.instruction}</p>
                <p className="text-[11px] text-slate mt-0.5">{new Date(draft.timestamp).toLocaleString()}</p>
              </div>
              <button onClick={() => onOpenDraft(draft)} className="text-xs px-2.5 py-1 border border-line rounded hover:border-brass shrink-0">
                Open
              </button>
              <button onClick={() => handleExportDraft(draft)} className="text-slate hover:text-brass shrink-0">
                <Download size={14} />
              </button>
              <button onClick={() => { deleteDraft(draft.id); refresh(); }} className="text-slate hover:text-risk-high shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}