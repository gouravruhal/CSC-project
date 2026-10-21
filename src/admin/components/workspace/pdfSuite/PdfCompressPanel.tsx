import React, { useState } from 'react';
import { Gauge } from 'lucide-react';

interface PdfCompressPanelProps {
  isProcessing: boolean;
  onExecuteCompress: (level: 'extreme' | 'recommended' | 'less') => void;
}

export const PdfCompressPanel: React.FC<PdfCompressPanelProps> = ({
  isProcessing,
  onExecuteCompress,
}) => {
  const [level, setLevel] = useState<'extreme' | 'recommended' | 'less'>('recommended');

  const options = [
    {
      id: 'extreme' as const,
      label: 'Extreme Compression',
      desc: 'Smallest file size for strict portal limits',
    },
    {
      id: 'recommended' as const,
      label: 'Recommended Compression',
      desc: 'Good quality & standard file size reduction',
    },
    {
      id: 'less' as const,
      label: 'Light Compression',
      desc: 'Highest visual clarity with stream optimization',
    },
  ];

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-[var(--color-text)]">
            Compress PDF Document:
          </span>
        </div>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onExecuteCompress(level)}
          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>{isProcessing ? 'Compressing...' : 'Compress & Download PDF'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => setLevel(opt.id)}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              level === opt.id
                ? 'bg-emerald-500/15 border-emerald-500 shadow-xs'
                : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                checked={level === opt.id}
                onChange={() => setLevel(opt.id)}
                className="accent-emerald-500"
              />
              <span className="text-xs font-bold text-[var(--color-text)]">{opt.label}</span>
            </div>
            <p className="text-[10px] text-[var(--color-muted-text)] mt-1 ml-5">
              {opt.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
