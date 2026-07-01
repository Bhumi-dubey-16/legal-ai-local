import { useState, useEffect } from 'react';
import { generateDraft } from '../../api/client';

export default function DraftAssistant({ docIds }) {
  const [instruction, setInstruction] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDraft('');
  }, [docIds]);

  const handleGenerate = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    const result = await generateDraft(instruction, docIds);
    setDraft(result.draft_text);
    setLoading(false);
  };

  return (
    <div className="flex h-full">
      <div className="w-96 border-r border-line p-6 flex flex-col bg-paper">
        <p className="text-[11px] tracking-widest text-slate uppercase mb-1">Draft Assistant</p>
        <h2 className="font-serif-doc text-lg text-ink mb-4">Generative Layout</h2>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Describe target format constraints or arguments..."
          className="flex-1 text-sm border border-line rounded-md p-3 outline-none focus:border-brass resize-none bg-transparent text-ink"
        />
        <div className="mt-2 text-[10px] text-slate">
          Target Scope: {docIds.length} checked reference text items.
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !instruction.trim()}
          className="mt-3 text-sm px-4 py-2 bg-ink text-paper rounded-md hover:opacity-90 transition-opacity disabled:opacity-40 font-medium"
        >
          {loading ? 'Compiling Text…' : 'Generate Draft'}
        </button>
      </div>
      <div className="flex-1 p-8 overflow-y-auto bg-paper">
        {draft ? (
          <pre className="font-serif-doc text-[15px] leading-relaxed whitespace-pre-wrap text-ink max-w-2xl bg-line/10 p-6 border border-line rounded shadow-inner">
            {draft}
          </pre>
        ) : (
          <p className="text-sm text-slate">No workspace draft triggered yet.</p>
        )}
      </div>
    </div>
  );
}