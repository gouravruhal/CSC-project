import React from 'react';
import { DocumentCategory } from './workspaceHelpers';
import { ImageStage } from './ImageStage';
import { PdfViewerStage } from './pdfSuite/PdfViewerStage';
import { WordViewerStage } from './office/WordViewerStage';
import { SpreadsheetViewerStage } from './office/SpreadsheetViewerStage';
import { ImageToolTab } from './workspaceTypes';

interface StudioStageContainerProps {
  category: DocumentCategory;
  imageEditor: any;
  imageRef: React.RefObject<HTMLImageElement | null>;
  printAreaRef: React.RefObject<HTMLDivElement | null>;
  imageTab: ImageToolTab;
  pdfProps: {
    pdfUrl: string;
    fileName: string;
    isModified?: boolean;
    onSaveChanges?: () => void;
    onRevert?: () => void;
    onPrint?: () => void;
  };
  wordProps: {
    content: string;
    onChangeContent: (val: string) => void;
    formatting: any;
    fileName: string;
  };
  spreadsheetProps: {
    data: Record<string, string>;
    onChangeCell: (cellKey: string, val: string) => void;
    activeCell: string;
    onSelectCell: (cellKey: string) => void;
    fileName: string;
    rowCount: number;
  };
  fileViewUrl: string;
  activeFileName?: string;
}

export const StudioStageContainer: React.FC<StudioStageContainerProps> = ({
  category,
  imageEditor,
  imageRef,
  printAreaRef,
  imageTab,
  pdfProps,
  wordProps,
  spreadsheetProps,
  fileViewUrl,
  activeFileName,
}) => {
  if (category === 'image') {
    return (
      <ImageStage
        imageSrc={fileViewUrl}
        imageAlt={activeFileName}
        imageRef={imageRef}
        printAreaRef={printAreaRef}
        zoom={imageEditor.zoom}
        rotation={imageEditor.rotation}
        fineAngle={imageEditor.fineAngle}
        flipH={imageEditor.flipH}
        flipV={imageEditor.flipV}
        activeToolTab={imageTab}
        cropViewMode={imageEditor.cropViewMode}
        cropInsetTop={imageEditor.cropInsetTop}
        cropInsetBottom={imageEditor.cropInsetBottom}
        cropInsetLeft={imageEditor.cropInsetLeft}
        cropInsetRight={imageEditor.cropInsetRight}
        showCropGrid={imageEditor.showCropGrid}
        showStraightenGrid={imageEditor.showStraightenGrid}
        previewFilter={imageEditor.previewFilter}
        dragHandle={imageEditor.dragHandle}
        onStartCropDrag={imageEditor.handleStartCropDrag}
        onSetZoom={imageEditor.setZoom}
        onResetZoom={() => imageEditor.setZoom(100)}
      />
    );
  }

  if (category === 'pdf') {
    return <PdfViewerStage {...pdfProps} />;
  }

  if (category === 'word') {
    return <WordViewerStage {...wordProps} />;
  }

  if (category === 'spreadsheet') {
    return <SpreadsheetViewerStage {...spreadsheetProps} />;
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-[var(--bg-card)] rounded-2xl border border-[var(--color-border)] p-12 text-center min-h-[500px] space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-[#30AFFF]/10 border border-[#30AFFF]/30 flex items-center justify-center text-[#30AFFF] text-xl font-black">
        DOC
      </div>
      <div>
        <h4 className="text-base font-bold text-[var(--color-text)]">{activeFileName || 'Document File'}</h4>
        <p className="text-xs text-[var(--color-muted-text)] mt-1">Generic binary or archive file preview.</p>
      </div>
      <div className="flex items-center space-x-3">
        <a href={fileViewUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-xs font-bold text-[var(--color-text)]">
          Open File
        </a>
        <a href={fileViewUrl} download={activeFileName || 'document'} className="px-4 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 text-xs font-black">
          Download File
        </a>
      </div>
    </div>
  );
};
