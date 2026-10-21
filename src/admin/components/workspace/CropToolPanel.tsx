import React from 'react';
import { Crop, Scissors, Grid3X3 } from 'lucide-react';
import { CropPreset } from './workspaceTypes';

interface CropToolPanelProps {
  cropPreset: CropPreset;
  cropViewMode: 'adjust' | 'preview';
  showCropGrid: boolean;
  onSetCropPreset: (preset: CropPreset) => void;
  onSetCropViewMode: (mode: 'adjust' | 'preview') => void;
  onToggleCropGrid: () => void;
  onSetQuickTrim: (percentage: number) => void;
  onResetCrop: () => void;
}

export const CropToolPanel: React.FC<CropToolPanelProps> = ({
  cropPreset,
  cropViewMode,
  showCropGrid,
  onSetCropPreset,
  onSetCropViewMode,
  onToggleCropGrid,
  onSetQuickTrim,
  onResetCrop,
}) => {
  const presets: Array<{ id: CropPreset; label: string }> = [
    { id: 'free', label: 'Free' },
    { id: 'a4', label: 'A4' },
    { id: 'passport', label: 'Passport (3.5×4.5)' },
    { id: 'aadhaar', label: 'Aadhaar / Voter' },
    { id: 'pancard', label: 'PAN Card' },
    { id: 'square', label: '1:1 Square' },
  ];

  return (
    <div className="space-y-2.5 pt-1">
      {/* Mode Switchers & Trims */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => onSetCropViewMode('adjust')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all ${
              cropViewMode === 'adjust'
                ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                : 'text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Adjust Frame</span>
          </button>

          <button
            type="button"
            onClick={() => onSetCropViewMode('preview')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all ${
              cropViewMode === 'preview'
                ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                : 'text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Preview Cut</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleCropGrid}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors flex items-center space-x-1 ${
              showCropGrid
                ? 'bg-[#30AFFF]/15 border-[#30AFFF] text-[#30AFFF]'
                : 'bg-[var(--bg-primary)] border-[var(--color-border)] text-[var(--color-muted-text)]'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={() => onSetQuickTrim(3)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] cursor-pointer"
          >
            Trim 3%
          </button>

          <button
            type="button"
            onClick={() => onSetQuickTrim(5)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] cursor-pointer"
          >
            Trim 5%
          </button>

          <button
            type="button"
            onClick={onResetCrop}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-amber-500 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Ratios row */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-black uppercase text-[var(--color-muted-text)] mr-0.5">
          Ratios:
        </span>
        {presets.map((p) => {
          const isSelected = cropPreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSetCropPreset(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                  : 'bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
