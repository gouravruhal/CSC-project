import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Tag, 
  FileText, 
  Check, 
  Copy, 
  ShieldCheck 
} from 'lucide-react';
import { Submission } from '../../../types';

interface CustomerDetailCardProps {
  submission: Submission | null;
}

export const CustomerDetailCard: React.FC<CustomerDetailCardProps> = ({ submission }) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!submission) return null;

  const customerName = (submission as any).customer_name || submission.name || 'Customer';
  const serviceName = (submission as any).service_name || submission.purpose || 'Document Service';
  const cleanPhone = (submission.phone || '').replace(/\D/g, '');

  const handleCopyId = () => {
    if (submission.id) {
      navigator.clipboard.writeText(submission.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'processing':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default:
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    }
  };

  const initials = customerName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('') || 'C';

  return (
    <div className="w-full bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs space-y-3.5 print:hidden">
      {/* Header with Avatar and Name */}
      <div className="flex items-center space-x-3 pb-3 border-b border-[var(--color-border)]">
        <div className="w-11 h-11 rounded-xl bg-linear-to-br from-[#30AFFF] to-blue-600 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-black text-[var(--color-text)] truncate">
              {customerName}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusBadge(
                submission.status
              )}`}
            >
              {submission.status || 'Pending'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-[var(--color-muted-text)] mt-0.5">
            <Tag className="w-3 h-3 text-[#30AFFF]" />
            <span className="truncate font-semibold text-[var(--color-text)]">{serviceName}</span>
          </div>
        </div>
      </div>

      {/* Contact Quick Action Bar */}
      <div className="flex items-center gap-2">
        {cleanPhone && (
          <>
            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-emerald-500 text-emerald-500 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              title="Call Customer Directly"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>

            <a
              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                `Namaste ${customerName}, this is Maa Vaishno e-World regarding your application for ${serviceName}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/40 text-emerald-500 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              title="Send WhatsApp Message"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </>
        )}
      </div>

      {/* Detailed Meta Items */}
      <div className="space-y-2 text-xs bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-muted-text)] flex items-center space-x-1">
            <Phone className="w-3 h-3" />
            <span>Mobile:</span>
          </span>
          <span className="font-mono font-bold text-[var(--color-text)]">
            +91 {cleanPhone || submission.phone || 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[var(--color-muted-text)] flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Submitted:</span>
          </span>
          <span className="font-mono font-bold text-[var(--color-text)]">
            {submission.created_at
              ? new Date(submission.created_at).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]/50">
          <span className="text-[var(--color-muted-text)] text-[10px] uppercase font-bold">
            App ID:
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center space-x-1 font-mono text-[10px] text-[#30AFFF] hover:underline cursor-pointer"
            title="Copy ID"
          >
            <span className="truncate max-w-[120px]">{submission.id}</span>
            {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Customer Instructions / Note (if any) */}
      {submission.description && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
          <div className="flex items-center space-x-1 text-[11px] font-bold text-amber-500">
            <FileText className="w-3 h-3" />
            <span>Customer Instructions:</span>
          </div>
          <p className="text-xs text-[var(--color-text)] italic line-clamp-3">
            "{submission.description}"
          </p>
        </div>
      )}
    </div>
  );
};
