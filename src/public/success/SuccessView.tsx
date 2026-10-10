import React from 'react';
import { CheckCircle2, QrCode, Copy, Printer, ArrowLeft, ShieldCheck, Calendar, Phone, User, FileText } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../lib/translations';

interface SuccessViewProps {
  submission: {
    id: string;
    name: string;
    phone: string;
    purpose: string;
    description?: string;
    files: { original_name: string; size: number; sha256_hash?: string }[];
    created_at: string;
    status: string;
  };
  onNewSubmission: () => void;
  language: Language;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  submission,
  onNewSubmission,
  language,
}) => {
  const t = translations[language];
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(submission.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const formattedDate = new Date(submission.created_at).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Glass Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 relative overflow-hidden print:shadow-none print:border-none">
          
          {/* Linear subtle accent line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />

          {/* Header */}
          <div className="text-center space-y-3 pb-8 border-b border-[var(--color-border)]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              Documents Received Successfully
            </h2>
            <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium max-w-md mx-auto">
              Delivered directly to the Maa Vaishno e-World CSC Centre counter queue.
            </p>
          </div>

          {/* Submission ID & QR Ticket Box */}
          <div className="my-8 p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            
            <div className="sm:col-span-2 space-y-2">
              <span className="text-[11px] font-semibold text-[var(--color-muted-text)] uppercase tracking-wider">
                Official Reference ID
              </span>
              
              <div className="flex items-center space-x-3">
                <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[var(--color-text)] tracking-wider">
                  {submission.id}
                </span>
                <button
                  onClick={handleCopyId}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-hover)] flex items-center space-x-1 transition-all cursor-pointer"
                  title="Copy Submission ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-xs text-[var(--color-muted-text)] font-medium">
                Show this ID or QR ticket at the counter for fast document retrieval.
              </p>
            </div>

            {/* QR Ticket Box */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <QrCode className="w-24 h-24 text-slate-900" />
              <span className="text-[10px] font-mono font-bold text-slate-600 mt-1">
                SCAN AT COUNTER
              </span>
            </div>

          </div>

          {/* Submission Details */}
          <div className="space-y-4 text-xs sm:text-sm">
            <h3 className="font-semibold text-[var(--color-text)] uppercase tracking-wider text-xs border-b border-[var(--color-border)] pb-2">
              Citizen Request Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 text-[var(--color-muted-text)]">
                <User className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-[var(--color-text)]">{submission.name}</span>
              </div>

              <div className="flex items-center space-x-2 text-[var(--color-muted-text)]">
                <Phone className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-[var(--color-text)]">+91 {submission.phone}</span>
              </div>

              <div className="flex items-center space-x-2 text-[var(--color-muted-text)]">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Purpose: <strong className="text-[var(--color-text)]">{submission.purpose}</strong></span>
              </div>

              <div className="flex items-center space-x-2 text-[var(--color-muted-text)]">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Submitted: <strong className="text-[var(--color-text)]">{formattedDate}</strong></span>
              </div>
            </div>

            {submission.description && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-[var(--color-text)]">
                <span className="font-bold">Instructions: </span>
                {submission.description}
              </div>
            )}

            {/* Files List */}
            <div className="pt-2">
              <p className="font-semibold text-[var(--color-text)] text-xs uppercase tracking-wider mb-2">
                Uploaded Documents ({submission.files.length})
              </p>
              <div className="space-y-2">
                {submission.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-[var(--color-border)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-[var(--color-text)] truncate">{file.original_name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      DELIVERED ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-8 mt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <button
              onClick={handlePrintSlip}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-[var(--color-border)] hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-[var(--color-text)] flex items-center justify-center space-x-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Counter Slip</span>
            </button>

            <button
              onClick={onNewSubmission}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Upload Another Document</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
