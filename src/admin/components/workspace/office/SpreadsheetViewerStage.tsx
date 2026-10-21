import React, { useState } from 'react';
import { COLUMNS } from './spreadsheetHelper';
import { FileSpreadsheet, ZoomIn, ZoomOut, Sheet } from 'lucide-react';

interface SpreadsheetViewerStageProps {
  data: Record<string, string>;
  onChangeCell: (cellKey: string, val: string) => void;
  activeCell: string;
  onSelectCell: (cellKey: string) => void;
  fileName: string;
  rowCount: number;
}

export const SpreadsheetViewerStage: React.FC<SpreadsheetViewerStageProps> = ({
  data,
  onChangeCell,
  activeCell,
  onSelectCell,
  fileName,
  rowCount,
}) => {
  const [zoom, setZoom] = useState(100);

  return (
    <div className="flex-1 w-full flex flex-col bg-[var(--bg-primary)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs min-h-[560px]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--bg-card)] text-xs text-[var(--color-muted-text)]">
        <div className="flex items-center space-x-2 font-bold text-[var(--color-text)]">
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span className="truncate max-w-xs">{fileName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Worksheet</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(70, z - 10))}
            className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--color-text)] cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] w-9 text-center">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--color-text)] cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 w-full overflow-auto bg-[var(--bg-primary)] p-2 sm:p-4">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
          className="inline-block border border-[var(--color-border)] bg-[var(--bg-card)] rounded-lg shadow-sm overflow-hidden select-none"
        >
          {/* Column Header Row */}
          <div className="flex border-b border-[var(--color-border)] bg-slate-200/50 dark:bg-slate-800/80 font-mono text-[11px] font-bold text-[var(--color-muted-text)]">
            <div className="w-10 h-7 border-r border-[var(--color-border)] flex items-center justify-center shrink-0 bg-slate-300/40 dark:bg-slate-800" />
            {COLUMNS.map((col) => (
              <div
                key={col}
                className="w-36 h-7 border-r border-[var(--color-border)] flex items-center justify-center shrink-0 last:border-r-0"
              >
                {col}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {[...Array(rowCount)].map((_, rIdx) => {
            const rowNum = rIdx + 1;
            return (
              <div key={rowNum} className="flex border-b border-[var(--color-border)] last:border-b-0">
                {/* Row Number */}
                <div className="w-10 h-8 border-r border-[var(--color-border)] bg-slate-200/40 dark:bg-slate-800/60 font-mono text-[11px] font-bold text-[var(--color-muted-text)] flex items-center justify-center shrink-0">
                  {rowNum}
                </div>

                {/* Cells */}
                {COLUMNS.map((col) => {
                  const key = `${col}${rowNum}`;
                  const isSelected = activeCell === key;
                  const val = data[key] || '';

                  return (
                    <div
                      key={key}
                      onClick={() => onSelectCell(key)}
                      className={`w-36 h-8 border-r border-[var(--color-border)] last:border-r-0 relative flex items-center px-2 text-xs font-sans text-[var(--color-text)] transition-colors cursor-cell ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 z-10 bg-emerald-500/10'
                          : 'hover:bg-slate-500/5'
                      }`}
                    >
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => onChangeCell(key, e.target.value)}
                        onFocus={() => onSelectCell(key)}
                        aria-label={`Cell ${key}`}
                        className="w-full h-full bg-transparent border-none outline-none font-inherit text-inherit text-xs"
                      />
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-500 rounded-xs z-20 pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* MS Excel Bottom Sheet Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-t border-[var(--color-border)] bg-[var(--bg-card)] text-[11px] text-[var(--color-muted-text)] font-medium select-none">
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 rounded-t-lg bg-[var(--bg-primary)] border-t-2 border-emerald-500 font-bold text-[var(--color-text)] flex items-center space-x-1.5 shadow-2xs">
            <Sheet className="w-3 h-3 text-emerald-400" />
            <span>Sheet1</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded hover:bg-[var(--bg-primary)] cursor-pointer">+</span>
        </div>

        <div className="flex items-center space-x-3 font-mono text-[10px]">
          <span className="text-emerald-400 font-bold uppercase">Ready</span>
          <span>•</span>
          <span>{rowCount} Rows × {COLUMNS.length} Cols</span>
        </div>
      </div>
    </div>
  );
};
