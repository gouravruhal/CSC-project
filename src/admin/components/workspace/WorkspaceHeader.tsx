import React from 'react';
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Printer, 
  Save, 
  CheckCircle2, 
  User, 
  Clock 
} from 'lucide-react';
import { Submission } from '../../../types';

interface WorkspaceHeaderProps {
  submission: Submission | null;
  onBack: () => void;
  isSaving: boolean;
  savedNotice: boolean;
  onSaveState: () => void;
  onPrint: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  submission,
  onBack,
  isSaving,
  savedNotice,
  onSaveState,
  onPrint,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--color-border)] shadow-xs print:hidden">
      {/* Left: Back button & Customer summary */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 sm:p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--bg-primary)] hover:bg-[#30AFFF]/15 hover:border-[#30AFFF] text-[var(--color-text)] transition-colors cursor-pointer"
          title="Back to Admin Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div>
          <div className="flex items-center space-x-2">
            <User className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span className="font-black text-sm text-[var(--color-text)] truncate max-w-[200px] sm:max-w-[260px]">
              {submission?.customer_name || 'Customer'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30AFFF]/15 text-[#30AFFF] border border-[#30AFFF]/30">
              {submission?.service_name || 'Document Work'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-[var(--color-muted-text)] mt-0.5">
            <span className="font-mono text-[11px]">{submission?.phone}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{submission?.created_at ? new Date(submission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick actions: Call, WhatsApp, Save State, Print */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {submission?.phone && (
          <>
            <a
              href={`tel:${submission.phone}`}
              className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--bg-primary)] hover:border-emerald-500 text-emerald-500 transition-colors"
              title="Call Customer"
            >
              <Phone className="w-4 h-4" />
            </a>
            <a
              href={`https://wa.me/91${submission.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${submission.customer_name}, this is Maa Vaishno e-World regarding your document submission.`)}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--bg-primary)] hover:border-emerald-500 text-emerald-500 transition-colors"
              title="WhatsApp Customer"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
          </>
        )}

        <button
          type="button"
          onClick={onSaveState}
          disabled={isSaving}
          className={`px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all ${
            savedNotice
              ? 'bg-emerald-500 text-slate-950 shadow-xs'
              : 'bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)]'
          }`}
          title="Save crop, rotation, xerox & edits to memory & server"
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
          className="px-3 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 text-xs font-black flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Direct Print</span>
        </button>
      </div>
    </div>
  );
};
