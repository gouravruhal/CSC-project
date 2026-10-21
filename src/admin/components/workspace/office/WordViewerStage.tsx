import React, { useState } from 'react';
import { WordDocFormatting, calculateDocStats } from './wordDocumentHelper';
import { ZoomIn, ZoomOut, FileText, Globe } from 'lucide-react';

interface WordViewerStageProps {
  content: string;
  onChangeContent: (val: string) => void;
  formatting: WordDocFormatting;
  fileName: string;
}

export const WordViewerStage: React.FC<WordViewerStageProps> = ({
  content,
  onChangeContent,
  formatting,
  fileName,
}) => {
  const [zoom, setZoom] = useState(100);
  const stats = calculateDocStats(content);

  const getMarginClass = () => {
    if (formatting.margins === 'narrow') return 'p-8 sm:p-10';
    if (formatting.margins === 'wide') return 'p-14 sm:p-20';
    return 'p-10 sm:p-14';
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-slate-950/20 rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs min-h-[560px]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--bg-card)] text-xs text-[var(--color-muted-text)]">
        <div className="flex items-center space-x-2 font-bold text-[var(--color-text)]">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="truncate max-w-xs">{fileName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">A4 Document</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(60, z - 10))}
            className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--color-text)] cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] w-9 text-center">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(160, z + 10))}
            className="p-1 rounded hover:bg-[var(--bg-primary)] text-[var(--color-text)] cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulated Ruler */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 border-b border-[var(--color-border)] px-8 py-0.5 flex justify-center text-[9px] font-mono select-none text-slate-500">
        <div className="w-full max-w-[800px] flex justify-between px-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <span>{i + 1}&quot;</span>
              <div className="h-1.5 w-px bg-slate-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Workspace */}
      <div className="flex-1 w-full p-4 sm:p-8 flex justify-center items-start overflow-y-auto bg-slate-100 dark:bg-slate-900/60 min-h-[500px]">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            fontFamily: formatting.fontFamily,
            fontSize: `${formatting.fontSize}px`,
            textAlign: formatting.align,
            lineHeight: formatting.lineSpacing,
            fontWeight: formatting.bold ? 'bold' : 'normal',
            fontStyle: formatting.italic ? 'italic' : 'normal',
            textDecoration: formatting.underline ? 'underline' : 'none',
          }}
          className={`w-full max-w-[820px] min-h-[1050px] bg-white text-slate-900 rounded-xs shadow-2xl border border-slate-300 dark:border-slate-700/50 ${getMarginClass()} flex flex-col justify-between`}
        >
          {/* Header on page */}
          <div className="border-b border-slate-200 pb-2 mb-6 text-[11px] text-slate-400 font-sans flex justify-between items-center select-none">
            <span>Atal Seva Kendra Documentation Portal</span>
            <span>Ref: ASK-DOC-2026</span>
          </div>

          {/* Document Content */}
          <textarea
            value={content}
            onChange={(e) => onChangeContent(e.target.value)}
            aria-label="Document editor"
            className="flex-1 w-full bg-transparent resize-none border-none outline-none text-slate-900 whitespace-pre-wrap font-inherit leading-inherit"
            placeholder="Type or edit official document text here..."
            spellCheck="true"
          />

          {/* Footer on page */}
          <div className="border-t border-slate-200 pt-3 mt-6 text-[10px] text-slate-400 font-sans flex justify-between items-center select-none">
            <span>Official Record • Confidential Citizen File</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>

      {/* MS Word Bottom Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-t border-[var(--color-border)] bg-[var(--bg-card)] text-[11px] text-[var(--color-muted-text)] font-medium select-none">
        <div className="flex items-center space-x-3">
          <span>Page 1 of 1</span>
          <span>•</span>
          <span className="font-bold text-[var(--color-text)]">{stats.words} words</span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Globe className="w-3 h-3 text-blue-400" />
            <span>English (India)</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-emerald-500 font-bold">● AutoSaved</span>
          <span>100% Zoom</span>
        </div>
      </div>
    </div>
  );
};
