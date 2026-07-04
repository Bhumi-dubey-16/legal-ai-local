import { useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { generateDraft } from '../../api/client';
import { saveDraft } from '../../utils/historyStore';

export default function DraftAssistant({ docIds, loadedDraft }) {
  const [instruction, setInstruction] = useState(loadedDraft?.instruction || '');
  const [draft, setDraft] = useState(loadedDraft?.draftText || '');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleGenerate = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    const result = await generateDraft(instruction, docIds);
    setDraft(result.draft_text);

    saveDraft({
      id: `draft-${Date.now()}`,
      instruction,
      draftText: result.draft_text,
      timestamp: Date.now(),
    });

    setLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const paragraphs = draft
        .split('\n')
        .map((line) =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 24 })],
            spacing: { after: 200 },
          })
        );

      const doc = new Document({
        sections: [{ properties: {}, children: paragraphs }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `draft-${Date.now()}.docx`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-96 border-r border-line p-6 flex flex-col">
        <p className="text-[11px] tracking-widest text-slate uppercase mb-1">Draft Assistant</p>
        <h2 className="font-serif-doc text-lg text-ink mb-4">Describe what you need</h2>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Draft a petition under Section 9 for breach of the March agreement…"
          className="flex-1 text-sm border border-line rounded-md p-3 outline-none focus:border-brass resize-none"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-3 text-sm px-4 py-2 bg-ink text-paper rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? 'Drafting…' : 'Generate draft'}
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Loader2 size={22} className="animate-spin text-slate mb-3" />
            <p className="text-sm text-slate max-w-xs">
              Drafting locally on your machine… this may take a minute depending on document length.
            </p>
          </div>
        ) : draft ? (
          <>
            <div className="flex justify-end gap-2 mb-4">
              <button
                onClick={handleGenerate}
                title="Regenerate draft"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-line rounded-md text-ink-soft hover:border-brass hover:text-ink transition-colors"
              >
                <RefreshCw size={14} />
                Regenerate
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-line rounded-md text-ink-soft hover:border-brass hover:text-ink transition-colors disabled:opacity-40"
              >
                <Download size={14} />
                {exporting ? 'Exporting…' : 'Export as Word'}
              </button>
            </div>
            <pre className="font-serif-doc text-[15px] leading-relaxed whitespace-pre-wrap text-ink max-w-2xl">
              {draft}
            </pre>
          </>
        ) : (
          <p className="text-sm text-slate">Your generated draft will appear here, editable and ready to export.</p>
        )}
      </div>
    </div>
  );
}