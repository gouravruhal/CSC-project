import React, { useState } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';

interface PdfRotatePanelProps {
  isProcessing: boolean;
  onExecuteRotate: (angle: 90 | 180 | 270, pageRange?: string) => void;
}

export const PdfRotatePanel: React.FC<PdfRotatePanelProps> = ({
  isProcessing,
  onExecuteRotate,
}) => {
  const [selectedAngle, setSelectedAngle] = useState<90 | 180 | 270>(90);
  const [pageTarget, setPageTarget] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('1');

  const handleRotate = () => {
    onExecuteRotate(
      selectedAngle,
      pageTarget === 'custom' ? customRange : undefined
    );
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex items-center space-x-2">
          <RotateCw className="w-4 h-4 text-[#30AFFF]" />
          <span className="text-xs font-bold text-[var(--color-text)]">
            Rotate PDF Orientation:
          </span>
        </div>

        <button
          type="button"
          disabled={isProcessing}
          onClick={handleRotate}
          className="px-4 py-1.5 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isProcessing ? 'Rotating...' : `Rotate & Download PDF (${selectedAngle}°)`}</span>
        </button>
      </div>

      <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
        {/* Angle selector */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-bold text-[var(--color-muted-text)] mr-1">Angle:</span>
          {[
            { angle: 90 as const, label: '90° Clockwise', icon: <RotateCw className="w-3.5 h-3.5" /> },
            { angle: 180 as const, label: '180° Invert', icon: <RotateCw className="w-3.5 h-3.5" /> },
            { angle: 270 as const, label: '90° Counter-CW', icon: <RotateCcw className="w-3.5 h-3.5" /> },
          ].map((item) => (
            <button
              key={item.angle}
              type="button"
              onClick={() => setSelectedAngle(item.angle)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors ${
                selectedAngle === item.angle
                  ? 'bg-[#30AFFF] text-slate-950 font-black shadow-xs'
                  : 'bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Scope selector */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setPageTarget('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              pageTarget === 'all'
                ? 'bg-[#30AFFF]/15 border border-[#30AFFF] text-[#30AFFF]'
                : 'text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
            }`}
          >
            All Pages
          </button>
          <button
            type="button"
            onClick={() => setPageTarget('custom')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              pageTarget === 'custom'
                ? 'bg-[#30AFFF]/15 border border-[#30AFFF] text-[#30AFFF]'
                : 'text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
            }`}
          >
            Specific Pages:
          </button>
          {pageTarget === 'custom' && (
            <input
              type="text"
              value={customRange}
              onChange={(e) => setCustomRange(e.target.value)}
              placeholder="e.g. 1, 2"
              className="w-20 px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] text-xs font-mono font-bold text-[var(--color-text)]"
            />
          )}
        </div>
      </div>
    </div>
  );
};
