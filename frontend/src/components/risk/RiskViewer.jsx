import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { analyzeContract } from '../../api/client';

const severityStyle = {
  high: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-300',
    label: 'High Risk',
    textSize: 'text-base font-semibold',
  },
  medium: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    label: 'Medium Risk',
    textSize: 'text-sm font-medium',
  },
  low: {
    color: 'text-green-700',
    bg: 'bg-green-100',
    border: 'border-green-300',
    label: 'Low Risk',
    textSize: 'text-sm',
  },
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

  const refreshAnalysis = () => {
    setRisks(null);
    runAnalysis();
  };

  return (
    <div className="p-6 max-w-2xl h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] tracking-widest text-slate uppercase">Contract Risk Analysis</p>
        {risks && (
          <button
            onClick={refreshAnalysis}
            disabled={loading}
            title="Refresh analysis"
            className="text-slate hover:text-ink transition-colors disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
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
              <div key={i} className={`border rounded-md p-4 bg-paper shadow-sm ${s.border}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                    <AlertTriangle size={11} />
                    {s.label}
                  </span>
                </div>
                <p className={`${s.textSize} text-ink mb-1`}>{r.clause}</p>
                <p className={`${s.textSize} text-ink-soft leading-relaxed`}>{r.explanation}</p>
              </div>
            );
          }) : (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 p-4 rounded border border-green-300">
              <ShieldCheck size={16} /> No flag criteria met.
            </div>
          )}
        </div>
      )}
    </div>
  );
}