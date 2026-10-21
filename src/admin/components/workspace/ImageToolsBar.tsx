import React from 'react';
import { 
  Crop, 
  RotateCw, 
  Sparkles, 
  Gauge, 
  Download 
} from 'lucide-react';
import { ImageToolTab } from './workspaceTypes';

interface ImageToolsBarProps {
  activeTab: ImageToolTab;
  onChangeTab: (tab: ImageToolTab) => void;
}

export const ImageToolsBar: React.FC<ImageToolsBarProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const tabs: Array<{ id: ImageToolTab; label: string; icon: React.ReactNode }> = [
    { id: 'crop', label: 'Crop & Frame', icon: <Crop className="w-3.5 h-3.5" /> },
    { id: 'orient', label: 'Rotate & Flip', icon: <RotateCw className="w-3.5 h-3.5" /> },
    { id: 'enhance', label: 'Xerox & Clean', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'compress', label: 'KB Compressor', icon: <Gauge className="w-3.5 h-3.5" /> },
    { id: 'export', label: 'Export / Print', icon: <Download className="w-3.5 h-3.5" /> },
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
