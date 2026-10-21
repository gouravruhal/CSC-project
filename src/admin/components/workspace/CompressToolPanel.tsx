import React, { useState } from 'react';
import { Gauge, Printer, Download, Sparkles } from 'lucide-react';
import { PrintSizeMode } from '../../../lib/pdfSuite/printHelper';

interface CompressToolPanelProps {
  targetKb: number;
  customKbInput: string;
  isProcessing: boolean;
  onSelectPresetKb: (kb: number) => void;
  onChangeCustomKbInput: (val: string) => void;
  onExecuteCompress: (targetKb: number) => void;
  onPrintCompressed?: (targetKb: number, mode: PrintSizeMode) => void;
}

export const CompressToolPanel: React.FC<CompressToolPanelProps> = ({
  targetKb,
  customKbInput,
  isProcessing,
  onSelectPresetKb,
  onChangeCustomKbInput,
  onExecuteCompress,
  onPrintCompressed,
}) => {
  const [printMode, setPrintMode] = useState<PrintSizeMode>('fit-page');

  const presets = [
    { kb: 20, label: '< 20 KB (Sign)' },
    { kb: 50, label: '< 50 KB (Photo)' },
    { kb: 100, label: '< 100 KB (Passport)' },
    { kb: 200, label: '< 200 KB (Aadhaar/ID)' },
    { kb: 500, label: '< 500 KB (Marksheet)' },
  ];

  const getEffectiveKb = () => {
    const parsed = parseInt(customKbInput, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : targetKb;
  };

  return (
    <div className="space-y-2.5 pt-1">
      {/* Govt Standard Limits Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase text-[var(--color-muted-text)] mr-0.5">
            Portal Limits:
          </span>
          {presets.map((item) => (
            <button
              key={item.kb}
              type="button"
              onClick={() => {
                onSelectPresetKb(item.kb);
                onChangeCustomKbInput(String(item.kb));
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                targetKb === item.kb
                  ? 'bg-[#30AFFF] text-slate-950 font-black shadow-xs ring-1 ring-[#30AFFF]'
                  : 'bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] hover:text-[#30AFFF]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-[10px] font-mono text-[var(--color-muted-text)] shrink-0 hidden sm:inline">
          Target Limit: <span className="font-bold text-[#30AFFF]">&lt; {getEffectiveKb()} KB</span>
        </span>
      </div>

      {/* Custom KB & Dual Actions: Compress Download & Print Reduced */}
      <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {/* Custom KB & Print Sizing */}
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-[var(--color-muted-text)] shrink-0">
              Custom KB:
            </span>
            <div className="relative flex items-center">
              <input
                type="number"
                min="5"
                max="5000"
                value={customKbInput}
                onChange={(e) => onChangeCustomKbInput(e.target.value)}
                className="w-20 px-2.5 py-1.5 pr-7 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] text-xs font-mono font-bold text-[var(--color-text)] focus:border-[#30AFFF] focus:outline-hidden"
                placeholder="50"
              />
              <span className="absolute right-2 text-[10px] font-bold text-[var(--color-muted-text)] pointer-events-none">
                KB
              </span>
            </div>
          </div>

          {/* Print Sizing Selector */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-[11px] font-bold text-[var(--color-muted-text)] mr-0.5">
              Print Size:
            </span>
            {[
              { id: 'fit-page' as const, label: 'Fit A4' },
              { id: 'passport' as const, label: 'Passport (3.5×4.5cm)' },
              { id: 'id-card' as const, label: 'ID Card (8.6×5.4cm)' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPrintMode(opt.id)}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  printMode === opt.id
                    ? 'bg-[#30AFFF]/20 border border-[#30AFFF] text-[#30AFFF]'
                    : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Compress & Download, and Print Reduced Size */}
        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onExecuteCompress(getEffectiveKb())}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs cursor-pointer shadow-xs transition-colors flex items-center justify-center space-x-1.5"
            title="Download compressed image meeting portal limit"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Processing...' : `Download (<${getEffectiveKb()} KB)`}</span>
          </button>

          {onPrintCompressed && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onPrintCompressed(getEffectiveKb(), printMode)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-emerald-500 text-[var(--color-text)] hover:text-emerald-500 font-black text-xs cursor-pointer shadow-2xs transition-colors flex items-center justify-center space-x-1.5"
              title="Print reduced size image with exact dimension scaling"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-500" />
              <span>Print Reduced</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
