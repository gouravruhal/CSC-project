import React, { useState } from 'react';
import { Stamp } from 'lucide-react';

interface PdfWatermarkPanelProps {
  isProcessing: boolean;
  onExecuteWatermark: (text: string, opacity: number, angle: number) => void;
}

export const PdfWatermarkPanel: React.FC<PdfWatermarkPanelProps> = ({
  isProcessing,
  onExecuteWatermark,
}) => {
  const [watermarkText, setWatermarkText] = useState<string>('VERIFIED ORIGINAL');
  const [opacity, setOpacity] = useState<number>(0.25);
  const [angle, setAngle] = useState<number>(-45);

  const presets = [
    'VERIFIED ORIGINAL',
    'MAA VAISHNO e-WORLD',
    'CONFIDENTIAL',
    'FOR KENDRA SUBMISSION ONLY',
  ];

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex items-center space-x-2">
          <Stamp className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-[var(--color-text)]">
            Stamp Security Watermark:
          </span>
        </div>

        <button
          type="button"
          disabled={isProcessing || !watermarkText.trim()}
          onClick={() => onExecuteWatermark(watermarkText, opacity, angle)}
          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
        >
          <Stamp className="w-3.5 h-3.5" />
          <span>{isProcessing ? 'Stamping...' : `Apply Watermark & Download`}</span>
        </button>
      </div>

      <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Watermark text..."
            className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:border-amber-500 focus:outline-hidden"
          />

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-[var(--color-muted-text)]">Opacity:</span>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-[var(--color-text)] w-8">
              {Math.round(opacity * 100)}%
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setAngle(-45)}
              className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                angle === -45
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)]'
              }`}
            >
              Diagonal (-45°)
            </button>
            <button
              type="button"
              onClick={() => setAngle(0)}
              className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                angle === 0
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)]'
              }`}
            >
              Horizontal (0°)
            </button>
          </div>
        </div>

        {/* Text presets chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] uppercase font-bold text-[var(--color-muted-text)]">
            Presets:
          </span>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setWatermarkText(p)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                watermarkText === p
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500'
                  : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
