import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { askQuestion } from '../../api/client';
import { saveChatSession } from '../../utils/historyStore';

export default function ChatPanel({ docIds, loadedSession }) {
  const [sessionId] = useState(() => loadedSession?.id || `chat-${Date.now()}`);
  const [messages, setMessages] = useState(loadedSession?.messages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loadedSession) setMessages([]);
  }, [docIds]);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatSession({ id: sessionId, docIds, messages, timestamp: Date.now() });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const result = await askQuestion(input, docIds);
      setMessages([...updatedMessages, { role: 'assistant', content: result.answer, citations: result.citations }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-paper">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-sm text-slate max-w-sm leading-relaxed">
              Submit a prompt to query data specifically contained inside the <span className="font-semibold text-ink">{docIds.length} checked file(s)</span>.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl text-sm p-3.5 rounded-lg leading-relaxed ${
              m.role === 'user' ? 'bg-line/40 text-ink' : 'bg-brass-soft/30 text-ink'
            }`}>
              {m.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ul:pl-4 prose-li:my-1 prose-strong:text-ink">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-slate italic animate-pulse">Running local query execution...</div>
        )}
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-line bg-paper">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Query local engine on ${docIds.length} active files...`}
            className="flex-1 text-sm border border-line rounded-md px-3 py-2 outline-none focus:border-brass"
          />
          <button
            type="submit"
            disabled={loading}
            className="text-sm px-4 py-2 bg-ink text-paper rounded-md hover:opacity-90 disabled:opacity-40 font-medium"
          >
            Ask Engine
          </button>
        </div>
      </form>
    </div>
  );
}