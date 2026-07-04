import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { buildChronology } from '../../api/client';

export default function ChronologyView({ docIds }) {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEvents(null);
  }, [docIds]);

  const runBuild = async () => {
    setLoading(true);
    const result = await buildChronology(docIds);
    setEvents(result.events);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] tracking-widest text-slate uppercase">Case Chronology</p>
        {events && (
          <button
            onClick={runBuild}
            disabled={loading}
            title="Rebuild timeline"
            className="text-slate hover:text-ink transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
      <h2 className="font-serif-doc text-xl text-ink mb-4">Chronological Extraction</h2>

      <div className="mb-6 p-4 border border-line rounded bg-line/10 space-y-3">
        <p className="text-xs text-slate">
          Extract structural timeline elements over <span className="font-semibold text-ink">{docIds.length} target file context sheets</span>.
        </p>
        <button
          onClick={runBuild}
          disabled={loading}
          className="text-sm px-4 py-2 border border-ink rounded-md hover:bg-ink hover:text-paper transition-colors disabled:opacity-40 font-medium"
        >
          {loading ? 'Sifting files…' : 'Compile Timeline'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Loader2 size={22} className="animate-spin text-slate mb-3" />
          <p className="text-sm text-slate max-w-xs">
            Reading through documents and building the timeline locally… this can take a minute for longer files.
          </p>
        </div>
      )}

      {!loading && events && (
        <div className="relative pl-6 mt-4 animate-fadeIn">
          <div className="absolute left-[5px] top-1 bottom-1 w-px bg-line" />
          <div className="space-y-6">
            {events.map((e, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-brass" />
                <p className="text-[11px] text-slate mb-0.5 font-medium tracking-wider">{e.date}</p>
                <p className="text-sm text-ink leading-relaxed">{e.description}</p>
                <p className="text-[10px] text-slate mt-1 inline-block bg-line/40 px-2 py-0.5 rounded">
                  Source: <span className="text-ink font-medium">{e.source_doc}</span> · p.{e.source_page}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}