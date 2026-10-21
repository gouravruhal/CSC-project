import React from 'react';
import { Table, Printer, Download, Plus, Calculator, FileSpreadsheet } from 'lucide-react';

interface SpreadsheetRibbonBarProps {
  activeCell: string;
  formulaValue: string;
  onChangeFormula: (val: string) => void;
  stats: { count: number; sum: number; avg: number };
  onAddRow: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
}

export const SpreadsheetRibbonBar: React.FC<SpreadsheetRibbonBarProps> = ({
  activeCell,
  formulaValue,
  onChangeFormula,
  stats,
  onAddRow,
  onExportCsv,
  onPrint,
}) => {
  const [tab, setTab] = React.useState<'home' | 'formulas' | 'data'>('home');

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl p-2.5 sm:p-3 space-y-2.5 shadow-xs">
      {/* Ribbon Header Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-1.5 flex-wrap gap-2">
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs mr-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>EXCEL STUDIO</span>
          </div>

          {(['home', 'formulas', 'data'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                tab === t
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={onAddRow}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-emerald-500 text-[var(--color-text)] flex items-center space-x-1 transition-all"
            title="Append row to table"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Row</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] flex items-center space-x-1 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3 py-1 text-xs font-black rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* MS Excel Formula Bar */}
      <div className="flex items-center space-x-2 bg-[var(--bg-primary)] border border-[var(--color-border)] rounded-xl px-2.5 py-1.5 text-xs">
        {/* Cell Name Box */}
        <div className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--color-border)] font-mono font-bold text-emerald-400 min-w-[42px] text-center">
          {activeCell || 'A1'}
        </div>

        {/* fx symbol */}
        <div className="flex items-center text-slate-400 font-serif italic font-bold px-1 select-none">
          fx
        </div>

        {/* Formula / Cell Content Input */}
        <input
          type="text"
          value={formulaValue}
          onChange={(e) => onChangeFormula(e.target.value)}
          placeholder="Enter formula or cell value..."
          aria-label="Formula input"
          className="flex-1 bg-transparent border-none outline-none text-[var(--color-text)] font-sans text-xs px-1"
        />

        {/* Quick Calculation Pills */}
        <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-[var(--color-border)] text-[11px] font-mono text-[var(--color-muted-text)]">
          <span className="flex items-center space-x-1">
            <Calculator className="w-3 h-3 text-emerald-400" />
            <span>SUM:</span>
            <strong className="text-[var(--color-text)]">₹{stats.sum}</strong>
          </span>
          <span>•</span>
          <span>AVG: <strong className="text-[var(--color-text)]">₹{Math.round(stats.avg)}</strong></span>
          <span>•</span>
          <span>COUNT: <strong className="text-[var(--color-text)]">{stats.count}</strong></span>
        </div>
      </div>
    </div>
  );
};
