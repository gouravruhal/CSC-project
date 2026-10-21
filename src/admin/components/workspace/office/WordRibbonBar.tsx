import React, { useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Printer, Download, Copy, FileText, Check } from 'lucide-react';
import { WordDocFormatting } from './wordDocumentHelper';

interface WordRibbonBarProps {
  formatting: WordDocFormatting;
  onChangeFormatting: (patch: Partial<WordDocFormatting>) => void;
  wordCount: number;
  charCount: number;
  onExportPdf: () => void;
  onPrint: () => void;
  onCopyText: () => void;
  copied: boolean;
}

export const WordRibbonBar: React.FC<WordRibbonBarProps> = ({
  formatting,
  onChangeFormatting,
  wordCount,
  charCount,
  onExportPdf,
  onPrint,
  onCopyText,
  copied,
}) => {
  const [tab, setTab] = useState<'home' | 'layout' | 'review'>('home');

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl p-2.5 sm:p-3 space-y-2.5 shadow-xs">
      {/* Ribbon Header Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-1.5 flex-wrap gap-2">
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs mr-2">
            <FileText className="w-3.5 h-3.5" />
            <span>WORD STUDIO</span>
          </div>
          {(['home', 'layout', 'review'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                tab === t ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1.5">
          <button type="button" onClick={onCopyText} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] flex items-center space-x-1 transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button type="button" onClick={onPrint} className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] flex items-center space-x-1 transition-all">
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button type="button" onClick={onExportPdf} className="px-3 py-1 text-xs font-black rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 shadow-sm transition-all">
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {tab === 'home' && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
          <select value={formatting.fontFamily} onChange={(e) => onChangeFormatting({ fontFamily: e.target.value })} className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-xs">
            <option value="Calibri, sans-serif">Calibri</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier New</option>
          </select>
          <select value={formatting.fontSize} onChange={(e) => onChangeFormatting({ fontSize: Number(e.target.value) })} className="px-2 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-xs">
            {[11, 12, 14, 16, 18, 20, 24].map((sz) => <option key={sz} value={sz}>{sz} pt</option>)}
          </select>
          <div className="h-4 w-px bg-[var(--color-border)] mx-1" />
          <div className="flex items-center space-x-1">
            <button type="button" onClick={() => onChangeFormatting({ bold: !formatting.bold })} className={`p-1.5 rounded-lg border ${formatting.bold ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-[var(--bg-primary)] border-[var(--color-border)] text-[var(--color-text)]'}`} title="Bold"><Bold className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => onChangeFormatting({ italic: !formatting.italic })} className={`p-1.5 rounded-lg border ${formatting.italic ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-[var(--bg-primary)] border-[var(--color-border)] text-[var(--color-text)]'}`} title="Italic"><Italic className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => onChangeFormatting({ underline: !formatting.underline })} className={`p-1.5 rounded-lg border ${formatting.underline ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-[var(--bg-primary)] border-[var(--color-border)] text-[var(--color-text)]'}`} title="Underline"><Underline className="w-3.5 h-3.5" /></button>
          </div>
          <div className="h-4 w-px bg-[var(--color-border)] mx-1" />
          <div className="flex items-center space-x-1">
            {(['left', 'center', 'right'] as const).map((a) => {
              const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight;
              return (
                <button key={a} type="button" onClick={() => onChangeFormatting({ align: a })} className={`p-1.5 rounded-lg border ${formatting.align === a ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-[var(--bg-primary)] border-[var(--color-border)] text-[var(--color-text)]'}`} title={`Align ${a}`}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'layout' && (
        <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-[var(--color-text)]">
          <label className="flex items-center space-x-1.5">
            <span className="font-bold text-[var(--color-muted-text)]">Margins:</span>
            <select value={formatting.margins} onChange={(e: any) => onChangeFormatting({ margins: e.target.value })} className="px-2 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] text-xs font-semibold">
              <option value="normal">Normal (1 in)</option>
              <option value="narrow">Narrow (0.5 in)</option>
              <option value="wide">Wide (1.5 in)</option>
            </select>
          </label>
          <label className="flex items-center space-x-1.5">
            <span className="font-bold text-[var(--color-muted-text)]">Orientation:</span>
            <select value={formatting.orientation} onChange={(e: any) => onChangeFormatting({ orientation: e.target.value })} className="px-2 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] text-xs font-semibold">
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
          <label className="flex items-center space-x-1.5">
            <span className="font-bold text-[var(--color-muted-text)]">Spacing:</span>
            <select value={formatting.lineSpacing} onChange={(e) => onChangeFormatting({ lineSpacing: Number(e.target.value) })} className="px-2 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] text-xs font-semibold">
              <option value={1.0}>1.0 Single</option>
              <option value={1.5}>1.5 Spaced</option>
              <option value={2.0}>2.0 Double</option>
            </select>
          </label>
        </div>
      )}

      {tab === 'review' && (
        <div className="flex items-center space-x-4 pt-0.5 text-xs text-[var(--color-text)]">
          <div><strong className="text-blue-400">{wordCount}</strong> <span className="text-[var(--color-muted-text)]">Words</span></div>
          <div><strong className="text-blue-400">{charCount}</strong> <span className="text-[var(--color-muted-text)]">Characters</span></div>
          <div className="text-emerald-400 font-bold">● Proofing Active (English India)</div>
        </div>
      )}
    </div>
  );
};
