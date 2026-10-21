import React, { useState } from 'react';
import { Split } from 'lucide-react';

interface PdfSplitPanelProps {
  isProcessing: boolean;
  onExecuteSplit: (rangeText: string) => void;
}

export const PdfSplitPanel: React.FC<PdfSplitPanelProps> = ({
  isProcessing,
  onExecuteSplit,
}) => {
  const [rangeInput, setRangeInput] = useState<string>('1');

  const presetChips = [
    { label: 'Page 1', value: '1' },
    { label: 'Pages 1-2', value: '1-2' },
    { label: 'Pages 1-3', value: '1-3' },
    { label: 'All Except 1', value: '2-99' },
  ];

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex items-center space-x-2">
          <Split className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-[var(--color-text)]">
            Extract Page Range from PDF:
          </span>
        </div>

        <button
          type="button"
          disabled={isProcessing || !rangeInput.trim()}
          onClick={() => onExecuteSplit(rangeInput)}
          className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
        >
          <Split className="w-3.5 h-3.5" />
          <span>{isProcessing ? 'Extracting...' : `Extract & Download Pages`}</span>
        </button>
      </div>

      <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <span className="text-xs font-bold text-[var(--color-muted-text)] shrink-0">
            Pages:
          </span>
          <input
            type="text"
            value={rangeInput}
            onChange={(e) => setRangeInput(e.target.value)}
            placeholder="e.g. 1, 3-5, 8"
            className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] text-xs font-mono font-bold text-[var(--color-text)] focus:border-purple-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {presetChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => setRangeInput(chip.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                rangeInput === chip.value
                  ? 'bg-purple-600 text-white font-black'
                  : 'bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-purple-400 text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
