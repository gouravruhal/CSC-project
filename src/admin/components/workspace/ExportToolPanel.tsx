import React from 'react';
import { Download, FileDown, Printer, FileText } from 'lucide-react';

interface ExportToolPanelProps {
  isProcessing: boolean;
  onDownloadJpg: () => void;
  onDownloadPng: () => void;
  onConvertToPdf: () => void;
  onPrint: () => void;
}

export const ExportToolPanel: React.FC<ExportToolPanelProps> = ({
  isProcessing,
  onDownloadJpg,
  onDownloadPng,
  onConvertToPdf,
  onPrint,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-1 w-full">
      <button
        type="button"
        disabled={isProcessing}
        onClick={onDownloadJpg}
        className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] font-black text-xs text-[var(--color-text)] flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-2xs"
      >
        <Download className="w-3.5 h-3.5 text-[#30AFFF]" />
        <span>Download JPG</span>
      </button>

      <button
        type="button"
        disabled={isProcessing}
        onClick={onDownloadPng}
        className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] font-black text-xs text-[var(--color-text)] flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-2xs"
      >
        <FileDown className="w-3.5 h-3.5 text-emerald-500" />
        <span>Download PNG</span>
      </button>

      <button
        type="button"
        disabled={isProcessing}
        onClick={onConvertToPdf}
        className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] font-black text-xs text-[var(--color-text)] flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-2xs"
      >
        <FileText className="w-3.5 h-3.5 text-purple-400" />
        <span>Convert to A4 PDF</span>
      </button>

      <button
        type="button"
        disabled={isProcessing}
        onClick={onPrint}
        className="w-full py-2.5 px-3 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] font-black text-xs text-slate-950 flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-xs"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Print Document</span>
      </button>
    </div>
  );
};
