import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { analyzeContract } from '../../api/client';

const severityStyle = {
  high: { color: 'text-risk-high', bg: 'bg-risk-high/10', label: 'High risk' },
  medium: { color: 'text-risk-med', bg: 'bg-risk-med/10', label: 'Medium risk' },
  low: { color: 'text-risk-low', bg: 'bg-risk-low/10', label: 'Low risk' },
};

export default function RiskViewer({ docIds }) {
  const [risks, setRisks] = useState(null);
  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    setRisks(null);
  }, [docIds]);

  const runAnalysis = async () => {
    setLoading(true);
    
    const result = await analyzeContract(docIds[0]); 
    setRisks(result.risks);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl h-full overflow-y-auto">
      <p className="text-[11px] tracking-widest text-slate uppercase mb-1">Contract Risk Analysis</p>
      <h2 className="font-serif-doc text-xl text-ink mb-4">Risk Audit Matrix</h2>

      <div className="mb-6 bg-line/20 p-4 rounded-md border border-line space-y-3">
        <p className="text-xs text-ink-soft">
          Target ready: <span className="font-semibold text-ink">{docIds.length} document(s)</span> chosen from workflow layout.
        </p>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="text-xs px-4 py-2 bg-ink text-paper rounded hover:opacity-90 transition-opacity disabled:opacity-40 font-medium"
        >
          {loading ? 'Analyzing Local Blobs…' : 'Run Risk Analysis'}
        </button>
      </div>

      {risks && (
        <div className="space-y-3 animate-fadeIn">
          {risks.length > 0 ? risks.map((r, i) => {
            const s = severityStyle[r.severity] || severityStyle.low;
            return (
              <div key={i} className="border border-line rounded-md p-4 bg-paper shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                    <AlertTriangle size={11} />
                    {s.label}
                  </span>
                </div>
                <p className="text-sm font-medium text-ink mb-1">{r.clause}</p>
                <p className="text-sm text-ink-soft leading-relaxed">{r.explanation}</p>
              </div>
            );
          }) : (
            <div className="flex items-center gap-2 text-sm text-risk-low bg-risk-low/10 p-4 rounded border border-risk-low/20">
              <ShieldCheck size={16} /> No flag criteria met.
            </div>
          )}
        </div>
      )}
    </div>
  );
}