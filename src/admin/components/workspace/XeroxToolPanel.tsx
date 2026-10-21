import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface XeroxToolPanelProps {
  bwMode: boolean;
  inverted: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  xeroxThreshold: number;
  onToggleBwMode: () => void;
  onToggleInvert: () => void;
  onAutoClean: () => void;
  onResetEnhance: () => void;
  onSetBrightness: (val: number | ((prev: number) => number)) => void;
  onSetContrast: (val: number | ((prev: number) => number)) => void;
  onSetSaturation: (val: number | ((prev: number) => number)) => void;
  onSetXeroxThreshold: (val: number | ((prev: number) => number)) => void;
}

export const XeroxToolPanel: React.FC<XeroxToolPanelProps> = ({
  bwMode,
  inverted,
  brightness,
  contrast,
  saturation,
  xeroxThreshold,
  onToggleBwMode,
  onToggleInvert,
  onAutoClean,
  onResetEnhance,
  onSetBrightness,
  onSetContrast,
  onSetSaturation,
  onSetXeroxThreshold,
}) => {
  return (
    <div className="space-y-2.5 pt-1">
      {/* Top Toggle Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleBwMode}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center space-x-1.5 ${
              bwMode
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-[var(--bg-primary)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-emerald-500'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{bwMode ? 'B/W Xerox (Active)' : 'Enable B/W Xerox'}</span>
          </button>

          <button
            type="button"
            onClick={onAutoClean}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span>Auto-Clean Shadows</span>
          </button>

          <button
            type="button"
            onClick={onToggleInvert}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer transition-colors ${
              inverted
                ? 'bg-[#30AFFF] text-slate-950 border-[#30AFFF]'
                : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-[#30AFFF]'
            }`}
          >
            Invert (Negative)
          </button>
        </div>

        <button
          type="button"
          onClick={onResetEnhance}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-amber-500 cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Sliders Grid: Brightness, Contrast, Saturation/Ink */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)]">
        {/* Brightness */}
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1.5">
            <span>Brightness</span>
            <span className="font-mono text-[#30AFFF]">{brightness}%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => onSetBrightness((b) => Math.max(50, b - 5))}
              className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer shrink-0"
            >
              -
            </button>
            <input
              type="range"
              min="50"
              max="200"
              value={brightness}
              onChange={(e) => onSetBrightness(Number(e.target.value))}
              className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => onSetBrightness((b) => Math.min(200, b + 5))}
              className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer shrink-0"
            >
              +
            </button>
          </div>
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1.5">
            <span>Contrast</span>
            <span className="font-mono text-[#30AFFF]">{contrast}%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => onSetContrast((c) => Math.max(50, c - 5))}
              className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer shrink-0"
            >
              -
            </button>
            <input
              type="range"
              min="50"
              max="200"
              value={contrast}
              onChange={(e) => onSetContrast(Number(e.target.value))}
              className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => onSetContrast((c) => Math.min(200, c + 5))}
              className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer shrink-0"
            >
              +
            </button>
          </div>
        </div>

        {/* Saturation or Xerox Threshold */}
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1.5">
            <span>{bwMode ? 'Xerox Ink Density' : 'Color Saturation'}</span>
            <span className="font-mono text-[#30AFFF]">{bwMode ? xeroxThreshold : saturation}%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => {
                if (bwMode) onSetXeroxThreshold((t) => Math.max(-50, t - 5));
                else onSetSaturation((s) => Math.max(0, s - 5));
              }}
              className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer shrink-0"
            >
              -
            </button>
            <input
              type="range"
              min={bwMode ? -50 : 0}
              max={bwMode ? 60 : 200}
              value={bwMode ? xeroxThreshold : saturation}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (bwMode) onSetXeroxThreshold(val);
                else onSetSaturation(val);
              }}
              className={`flex-1 min-w-0 cursor-pointer ${bwMode ? 'accent-emerald-500' : 'accent-[#30AFFF]'}`}
            />
            <button
              type="button"
              onClick={() => {
                if (bwMode) onSetXeroxThreshold((t) => Math.min(60, t + 5));
                else onSetSaturation((s) => Math.min(200, s + 5));
              }}
              className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer shrink-0"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
