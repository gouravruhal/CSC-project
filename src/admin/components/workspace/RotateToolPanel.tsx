import React from 'react';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Grid3X3 } from 'lucide-react';

interface RotateToolPanelProps {
  rotation: number;
  fineAngle: number;
  flipH: boolean;
  flipV: boolean;
  showStraightenGrid: boolean;
  onRotateStep: (deg: number) => void;
  onSetFineAngle: (angle: number | ((prev: number) => number)) => void;
  onToggleFlipH: () => void;
  onToggleFlipV: () => void;
  onToggleStraightenGrid: () => void;
  onResetOrientation: () => void;
}

export const RotateToolPanel: React.FC<RotateToolPanelProps> = ({
  rotation,
  fineAngle,
  flipH,
  flipV,
  showStraightenGrid,
  onRotateStep,
  onSetFineAngle,
  onToggleFlipH,
  onToggleFlipV,
  onToggleStraightenGrid,
  onResetOrientation,
}) => {
  return (
    <div className="space-y-2.5 pt-1">
      {/* 90° Rotations & Flips */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRotateStep(90)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span>Rotate 90° CW</span>
          </button>

          <button
            type="button"
            onClick={() => onRotateStep(-90)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span>90° CCW</span>
          </button>

          <button
            type="button"
            onClick={() => onRotateStep(180)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <span>180° Flip</span>
          </button>

          <button
            type="button"
            onClick={onToggleFlipH}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors flex items-center space-x-1.5 ${
              flipH
                ? 'bg-[#30AFFF] text-slate-950 border-[#30AFFF]'
                : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)]'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Flip H</span>
          </button>

          <button
            type="button"
            onClick={onToggleFlipV}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors flex items-center space-x-1.5 ${
              flipV
                ? 'bg-[#30AFFF] text-slate-950 border-[#30AFFF]'
                : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)]'
            }`}
          >
            <FlipVertical className="w-3.5 h-3.5" />
            <span>Flip V</span>
          </button>

          <button
            type="button"
            onClick={onToggleStraightenGrid}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors flex items-center space-x-1.5 ${
              showStraightenGrid
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400'
                : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-cyan-400 text-[var(--color-muted-text)]'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Level Grid</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onResetOrientation}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-amber-500 cursor-pointer"
        >
          Reset Orientation
        </button>
      </div>

      {/* Deskew Straightener */}
      <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-black text-[var(--color-text)]">Deskew & Tilt Straightener:</span>
            <span className="px-2 py-0.5 rounded-md bg-[#30AFFF]/15 border border-[#30AFFF]/30 font-mono text-xs font-black text-[#30AFFF]">
              {fineAngle > 0 ? `+${fineAngle.toFixed(1)}` : fineAngle.toFixed(1)}°
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {[-5, -2, -1, 0, 1, 2, 5].map((ang) => (
              <button
                key={ang}
                type="button"
                onClick={() => onSetFineAngle(ang)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                  fineAngle === ang
                    ? 'bg-[#30AFFF] text-slate-950 font-black'
                    : 'bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
                }`}
              >
                {ang === 0 ? '0°' : ang > 0 ? `+${ang}°` : `${ang}°`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSetFineAngle((prev) => Math.max(-45, Math.round((prev - 0.2) * 10) / 10))}
            className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-bold text-xs cursor-pointer shrink-0"
          >
            -0.2°
          </button>

          <input
            type="range"
            min="-45"
            max="45"
            step="0.1"
            value={fineAngle}
            onChange={(e) => onSetFineAngle(Number(e.target.value))}
            className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
          />

          <button
            type="button"
            onClick={() => onSetFineAngle((prev) => Math.min(45, Math.round((prev + 0.2) * 10) / 10))}
            className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-bold text-xs cursor-pointer shrink-0"
          >
            +0.2°
          </button>

          <button
            type="button"
            onClick={() => onSetFineAngle(0)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] cursor-pointer shrink-0"
          >
            Reset 0°
          </button>
        </div>
      </div>
    </div>
  );
};
