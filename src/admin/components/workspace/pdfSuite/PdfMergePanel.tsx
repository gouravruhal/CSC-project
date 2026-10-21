import React, { useState } from 'react';
import { Files, ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { WorkspaceFile } from '../workspaceTypes';
import { isImageFile, formatFileSize } from '../workspaceHelpers';

interface PdfMergePanelProps {
  files: WorkspaceFile[];
  submissionId: string;
  isProcessing: boolean;
  onExecuteMerge: (selectedFiles: Array<{ url: string; isImage: boolean; name: string }>) => void;
}

export const PdfMergePanel: React.FC<PdfMergePanelProps> = ({
  files,
  submissionId,
  isProcessing,
  onExecuteMerge,
}) => {
  const [items, setItems] = useState<Array<{ id: string; name: string; url: string; isImage: boolean }>>(() =>
    files.map((f) => ({
      id: f.id,
      name: f.original_name,
      url: `/api/admin/view/${submissionId}/${f.id}`,
      isImage: isImageFile(f),
    }))
  );

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setItems(next);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleMerge = () => {
    if (items.length === 0) return;
    onExecuteMerge(items);
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
        <div className="flex items-center space-x-2">
          <Files className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-[var(--color-text)]">
            Merge Order ({items.length} files selected):
          </span>
        </div>

        <button
          type="button"
          disabled={isProcessing || items.length < 1}
          onClick={handleMerge}
          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
        >
          <Files className="w-3.5 h-3.5" />
          <span>{isProcessing ? 'Merging...' : `Merge & Download (${items.length} Items)`}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div
            key={item.id + idx}
            className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-xs"
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className="w-4 h-4 rounded-full bg-[#30AFFF]/15 text-[#30AFFF] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="font-bold text-[var(--color-text)] truncate">{item.name}</span>
            </div>

            <div className="flex items-center space-x-1 shrink-0 ml-2">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => moveItem(idx, 'up')}
                className="p-1 rounded hover:bg-[var(--bg-card)] disabled:opacity-30 cursor-pointer"
                title="Move Up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={idx === items.length - 1}
                onClick={() => moveItem(idx, 'down')}
                className="p-1 rounded hover:bg-[var(--bg-card)] disabled:opacity-30 cursor-pointer"
                title="Move Down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="p-1 rounded hover:bg-red-500/10 text-red-500 cursor-pointer"
                title="Remove from Merge"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
