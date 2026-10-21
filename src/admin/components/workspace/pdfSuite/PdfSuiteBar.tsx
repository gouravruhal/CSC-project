import React from 'react';
import { 
  Files, 
  Split, 
  RotateCw, 
  Stamp, 
  ListOrdered, 
  Gauge 
} from 'lucide-react';
import { PdfToolTab } from '../workspaceTypes';

interface PdfSuiteBarProps {
  activeTab: PdfToolTab;
  onChangeTab: (tab: PdfToolTab) => void;
}

export const PdfSuiteBar: React.FC<PdfSuiteBarProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const tabs: Array<{ id: PdfToolTab; label: string; icon: React.ReactNode }> = [
    { id: 'merge', label: 'Merge PDF', icon: <Files className="w-3.5 h-3.5" /> },
    { id: 'split', label: 'Split PDF', icon: <Split className="w-3.5 h-3.5" /> },
    { id: 'rotate', label: 'Rotate PDF', icon: <RotateCw className="w-3.5 h-3.5" /> },
    { id: 'watermark', label: 'Watermark', icon: <Stamp className="w-3.5 h-3.5" /> },
    { id: 'pagenumbers', label: 'Page Numbers', icon: <ListOrdered className="w-3.5 h-3.5" /> },
    { id: 'compress', label: 'Compress PDF', icon: <Gauge className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-2.5 border-b border-[var(--color-border)]/70">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shrink-0 cursor-pointer transition-all ${
              isActive
                ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                : 'bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF]/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
