import React, { useState } from 'react';
import { ListOrdered } from 'lucide-react';
import { PageNumberPosition, PageNumberFormat } from '../../../../lib/pdfSuite';

interface PdfPageNumbersPanelProps {
  isProcessing: boolean;
  onExecutePageNumbers: (position: PageNumberPosition, format: PageNumberFormat) => void;
}

export const PdfPageNumbersPanel: React.FC<PdfPageNumbersPanelProps> = ({
  isProcessing,
  onExecutePageNumbers,
}) => {
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('page-of-total');

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex items-center space-x-2">
          <ListOrdered className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-[var(--color-text)]">
            Add Page Numbers to PDF:
          </span>
        </div>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onExecutePageNumbers(position, format)}
          className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>{isProcessing ? 'Numbering...' : 'Add Numbers & Download'}</span>
        </button>
      </div>

      <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Position */}
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-[var(--color-muted-text)] mr-1">Position:</span>
          {[
            { id: 'bottom-center' as const, label: 'Bottom Center' },
            { id: 'bottom-right' as const, label: 'Bottom Right' },
            { id: 'top-right' as const, label: 'Top Right' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPosition(item.id)}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                position === item.id
                  ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                  : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Format */}
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-[var(--color-muted-text)] mr-1">Format:</span>
          {[
            { id: 'page-of-total' as const, label: 'Page 1 of N' },
            { id: 'simple-number' as const, label: '1, 2, 3...' },
            { id: 'dash-number' as const, label: '- 1 -' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFormat(item.id)}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                format === item.id
                  ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                  : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
