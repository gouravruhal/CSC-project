import React from 'react';
import { Files, FileText, Image as ImageIcon, FileSpreadsheet, CheckCircle, Upload, Layers } from 'lucide-react';
import { WorkspaceFile, SavedFileState } from './workspaceTypes';
import { formatFileSize, getDocumentType, getDocumentCategory } from './workspaceHelpers';

interface FileListSidebarProps {
  files: WorkspaceFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  savedFileStates: Record<string, SavedFileState>;
  selectedFileIds?: string[];
  onToggleSelectFile?: (fileId: string) => void;
  onMergeSelected?: () => void;
  onUploadExtraFile?: (file: File) => void;
}

export const FileListSidebar: React.FC<FileListSidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  savedFileStates,
  selectedFileIds = [],
  onToggleSelectFile,
  onMergeSelected,
  onUploadExtraFile,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadExtraFile) {
      onUploadExtraFile(e.target.files[0]);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'word': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-purple-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-amber-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full lg:w-64 shrink-0 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl p-3 sm:p-3.5 space-y-3 shadow-xs print:hidden">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
        <div className="flex items-center space-x-1.5">
          <Files className="w-4 h-4 text-[#30AFFF]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
            Documents ({files.length})
          </h3>
        </div>

        {onUploadExtraFile && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded-lg hover:bg-[var(--bg-primary)] border border-dashed border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-muted-text)] hover:text-[#30AFFF] cursor-pointer"
              title="Add document from computer"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {selectedFileIds.length > 1 && onMergeSelected && (
        <button
          type="button"
          onClick={onMergeSelected}
          className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-all active:scale-98 animate-fade-in"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Merge {selectedFileIds.length} Selected to PDF</span>
        </button>
      )}

      <div className="space-y-1.5 max-h-[380px] lg:max-h-[600px] overflow-y-auto pr-0.5">
        {files.map((file, index) => {
          const fid = file.id || (file as any).filename || String(index);
          const isActive = fid === activeFileId;
          const isChecked = selectedFileIds.includes(fid);
          const cat = getDocumentCategory(file);
          const hasEdits = !!savedFileStates[fid];

          return (
            <div
              key={fid}
              className={`p-2 rounded-xl border transition-all text-left flex items-center space-x-2.5 ${
                isActive
                  ? 'bg-[#30AFFF]/15 border-[#30AFFF] shadow-xs'
                  : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-[#30AFFF]/60'
              }`}
            >
              {onToggleSelectFile && (
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSelectFile(fid)}
                  aria-label={`Select ${file.original_name}`}
                  className="rounded border-[var(--color-border)] text-[#30AFFF] focus:ring-0 cursor-pointer w-3.5 h-3.5 shrink-0"
                />
              )}

              <div
                onClick={() => onSelectFile(fid)}
                className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isActive
                      ? 'bg-[var(--bg-card)]'
                      : 'bg-[var(--bg-card)]'
                  }`}
                >
                  {getCategoryIcon(cat)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-[var(--color-text)] truncate">
                      {file.original_name}
                    </p>
                    {hasEdits && (
                      <span title="Edited & Saved" className="shrink-0 text-emerald-500">
                        <CheckCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-[var(--color-muted-text)] mt-0.5">
                    <span className="font-mono">{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span className="truncate">{getDocumentType(file)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
