import React from 'react';
import { ArrowLeft, Save, CheckCircle2, Printer, FileText } from 'lucide-react';

interface WorkspaceTopBarProps {
  onBack: () => void;
  activeFileName?: string;
  isSaving: boolean;
  savedNotice: boolean;
  onSaveState: () => void;
  onPrint: () => void;
}

export const WorkspaceTopBar: React.FC<WorkspaceTopBarProps> = ({
  onBack,
  activeFileName,
  isSaving,
  savedNotice,
  onSaveState,
  onPrint,
}) => {
  return (
    <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--color-border)] shadow-xs print:hidden">
      {/* Left: Back button & Active Document Name */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 sm:p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--bg-primary)] hover:bg-[#30AFFF]/15 hover:border-[#30AFFF] text-[var(--color-text)] transition-colors cursor-pointer shrink-0"
          title="Back to Admin Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 min-w-0">
          <FileText className="w-4 h-4 text-[#30AFFF] shrink-0" />
          <span className="font-black text-sm text-[var(--color-text)] truncate max-w-[200px] sm:max-w-md">
            {activeFileName || 'Document Studio'}
          </span>
        </div>
      </div>

      {/* Right: Save Edits & Direct Print */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          type="button"
          onClick={onSaveState}
          disabled={isSaving}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all ${
            savedNotice
              ? 'bg-emerald-500 text-slate-950 shadow-xs'
              : 'bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)]'
          }`}
          title="Save all edits (crop, orientation, xerox) to server"
        >
          {savedNotice ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-[#30AFFF]" />
              <span>{isSaving ? 'Saving...' : 'Save Edits'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="px-4 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 text-xs font-black flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
          title="Direct print currently active view"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Document</span>
        </button>
      </div>
    </div>
  );
};
