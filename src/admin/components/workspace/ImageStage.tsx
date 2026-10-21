import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { CropPreset, ImageToolTab } from './workspaceTypes';

interface ImageStageProps {
  imageSrc: string;
  imageAlt?: string;
  imageRef: React.RefObject<HTMLImageElement | null>;
  printAreaRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  rotation: number;
  fineAngle: number;
  flipH: boolean;
  flipV: boolean;
  activeToolTab: ImageToolTab;
  cropViewMode: 'adjust' | 'preview';
  cropInsetTop: number;
  cropInsetBottom: number;
  cropInsetLeft: number;
  cropInsetRight: number;
  showCropGrid: boolean;
  showStraightenGrid: boolean;
  previewFilter: string;
  dragHandle: string | null;
  onStartCropDrag: (clientX: number, clientY: number, handle: string) => void;
  onSetZoom: (updater: (z: number) => number) => void;
  onResetZoom: () => void;
}

export const ImageStage: React.FC<ImageStageProps> = ({
  imageSrc,
  imageAlt,
  imageRef,
  printAreaRef,
  zoom,
  rotation,
  fineAngle,
  flipH,
  flipV,
  activeToolTab,
  cropViewMode,
  cropInsetTop,
  cropInsetBottom,
  cropInsetLeft,
  cropInsetRight,
  showCropGrid,
  showStraightenGrid,
  previewFilter,
  dragHandle,
  onStartCropDrag,
  onSetZoom,
  onResetZoom,
}) => {
  const isAdjustingCrop = activeToolTab === 'crop' && cropViewMode === 'adjust';

  return (
    <div className="flex-1 w-full flex flex-col bg-[var(--bg-primary)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs">
      {/* Zoom Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] text-xs text-[var(--color-muted-text)] print:hidden">
        <div className="flex items-center space-x-1.5 font-bold">
          <span>Studio Canvas</span>
          <span className="font-mono text-[10px] text-[#30AFFF] px-1.5 py-0.5 rounded bg-[#30AFFF]/10">
            {zoom}%
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onSetZoom((z) => Math.max(25, z - 15))}
            className="p-1 rounded-lg hover:bg-[var(--bg-card)] border border-[var(--color-border)] cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="px-2 py-0.5 rounded-lg hover:bg-[var(--bg-card)] border border-[var(--color-border)] text-[10px] font-bold cursor-pointer"
          >
            Fit (100%)
          </button>
          <button
            type="button"
            onClick={() => onSetZoom((z) => Math.min(300, z + 15))}
            className="p-1 rounded-lg hover:bg-[var(--bg-card)] border border-[var(--color-border)] cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stage viewport */}
      <div ref={printAreaRef} className="flex-1 w-full flex items-center justify-center p-4 overflow-auto min-h-[460px]">
        <div
          className="relative inline-block"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            transition: dragHandle ? 'none' : 'transform 0.15s ease',
          }}
        >
          <div
            className="relative inline-block select-none"
            style={{
              transform: `rotate(${rotation + fineAngle}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
              transformOrigin: 'center center',
              transition: dragHandle ? 'none' : 'transform 0.15s ease',
            }}
          >
            <img
              ref={imageRef}
              crossOrigin="anonymous"
              src={imageSrc}
              alt={imageAlt || 'Document Preview'}
              style={{
                clipPath: !isAdjustingCrop
                  ? `inset(${cropInsetTop}% ${cropInsetRight}% ${cropInsetBottom}% ${cropInsetLeft}%)`
                  : 'none',
                filter: previewFilter,
                transition: 'filter 0.15s ease',
                maxHeight: '620px',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
              className="rounded shadow-2xl block select-none pointer-events-none"
            />

            {/* Crop Overlay */}
            {isAdjustingCrop && (
              <div
                className="absolute border-2 border-[#30AFFF] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] z-10 cursor-move select-none"
                style={{
                  top: `${cropInsetTop}%`,
                  bottom: `${cropInsetBottom}%`,
                  left: `${cropInsetLeft}%`,
                  right: `${cropInsetRight}%`,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onStartCropDrag(e.clientX, e.clientY, 'move');
                }}
                onTouchStart={(e) => {
                  if (e.touches.length > 0) onStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'move');
                }}
              >
                {showCropGrid && (
                  <>
                    <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-white/60 pointer-events-none" />
                    <div className="absolute top-2/3 left-0 right-0 border-t border-dashed border-white/60 pointer-events-none" />
                    <div className="absolute left-1/3 top-0 bottom-0 border-l border-dashed border-white/60 pointer-events-none" />
                    <div className="absolute left-2/3 top-0 bottom-0 border-l border-dashed border-white/60 pointer-events-none" />
                  </>
                )}
                {/* 4 Corner handles */}
                <div onMouseDown={(e) => { e.stopPropagation(); onStartCropDrag(e.clientX, e.clientY, 'tl'); }} className="absolute -top-2 -left-2 w-4 h-4 bg-[#30AFFF] border-2 border-white rounded-xs shadow cursor-nwse-resize z-20" />
                <div onMouseDown={(e) => { e.stopPropagation(); onStartCropDrag(e.clientX, e.clientY, 'tr'); }} className="absolute -top-2 -right-2 w-4 h-4 bg-[#30AFFF] border-2 border-white rounded-xs shadow cursor-nesw-resize z-20" />
                <div onMouseDown={(e) => { e.stopPropagation(); onStartCropDrag(e.clientX, e.clientY, 'bl'); }} className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#30AFFF] border-2 border-white rounded-xs shadow cursor-nesw-resize z-20" />
                <div onMouseDown={(e) => { e.stopPropagation(); onStartCropDrag(e.clientX, e.clientY, 'br'); }} className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#30AFFF] border-2 border-white rounded-xs shadow cursor-nwse-resize z-20" />
                {/* 4 Edge handles */}
                <div onMouseDown={(e) => { e.stopPropagation(); onStartCropDrag(e.clientX, e.clientY, 'top'); }} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-[#30AFFF] border border-white rounded-sm shadow cursor-ns-resize z-20" />
                <div onMouseDown={(e) => { e.stopPropagation(); onStartCropDrag(e.clientX, e.clientY, 'bottom'); }} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-[#30AFFF] border border-white rounded-sm shadow cursor-ns-resize z-20" />
                <div onMouseDown={(e) => { e.stopPropagation(); onStartCropDrag(e.clientX, e.clientY, 'left'); }} className="absolute top-1/2 -translate-y-1/2 -left-1.5 h-8 w-2.5 bg-[#30AFFF] border border-white rounded-sm shadow cursor-ew-resize z-20" />
                <div onMouseDown={(e) => { e.stopPropagation(); onStartCropDrag(e.clientX, e.clientY, 'right'); }} className="absolute top-1/2 -translate-y-1/2 -right-1.5 h-8 w-2.5 bg-[#30AFFF] border border-white rounded-sm shadow cursor-ew-resize z-20" />
              </div>
            )}

            {/* Straighten Gridlines */}
            {activeToolTab === 'orient' && showStraightenGrid && (
              <div className="absolute inset-0 pointer-events-none z-10 border-2 border-cyan-400/40 rounded">
                <div className="absolute top-1/4 left-0 right-0 border-t border-cyan-400/40" />
                <div className="absolute top-1/2 left-0 right-0 border-t border-cyan-400/60" />
                <div className="absolute top-3/4 left-0 right-0 border-t border-cyan-400/40" />
                <div className="absolute left-1/4 top-0 bottom-0 border-l border-cyan-400/40" />
                <div className="absolute left-1/2 top-0 bottom-0 border-l border-cyan-400/60" />
                <div className="absolute left-3/4 top-0 bottom-0 border-l border-cyan-400/40" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
