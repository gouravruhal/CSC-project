import React from 'react';
import { Download, ExternalLink, FileText, Save, RotateCcw, Printer, CheckCircle2 } from 'lucide-react';

interface PdfViewerStageProps {
  pdfUrl: string;
  fileName: string;
  isModified?: boolean;
  onSaveChanges?: () => void;
  onRevert?: () => void;
  onPrint?: () => void;
}

export const PdfViewerStage: React.FC<PdfViewerStageProps> = ({
  pdfUrl,
  fileName,
  isModified = false,
  onSaveChanges,
  onRevert,
  onPrint,
}) => {
  return (
    <div className="flex-1 w-full flex flex-col bg-[var(--bg-primary)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs min-h-[540px]">
      {/* Top Office-grade Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[var(--color-border)] text-xs text-[var(--color-muted-text)] bg-[var(--bg-card)] print:hidden">
        <div className="flex items-center space-x-2 font-bold text-[var(--color-text)] min-w-0">
          <FileText className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-xs">{fileName}</span>
          {isModified && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              <span>Studio Edits Applied</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 shrink-0 flex-wrap">
          {isModified && onRevert && (
            <button
              type="button"
              onClick={onRevert}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-red-400 text-[11px] font-bold text-red-400 flex items-center space-x-1 transition-colors"
              title="Discard edits and revert to original"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Revert</span>
            </button>
          )}

          {onSaveChanges && (
            <button
              type="button"
              onClick={onSaveChanges}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Save changes to PDF document"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save PDF</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[11px] font-bold text-[var(--color-text)] flex items-center space-x-1 transition-colors"
              title="Print current PDF"
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>
          )}

          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[11px] font-bold text-[var(--color-text)] flex items-center space-x-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Open Tab</span>
          </a>

          <a
            href={pdfUrl}
            download={fileName}
            className="px-3 py-1 rounded-lg bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 text-[11px] font-black flex items-center space-x-1 transition-colors shadow-2xs"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Embedded PDF iframe */}
      <div className="flex-1 w-full h-full min-h-[540px] p-2 bg-slate-900/10">
        <iframe
          src={pdfUrl}
          title={fileName}
          className="w-full h-full min-h-[540px] rounded-xl border border-[var(--color-border)] bg-white shadow-inner"
        />
      </div>
    </div>
  );
};
