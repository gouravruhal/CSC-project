import React from 'react';
import { Submission } from '../../../types';
import { DocumentCategory } from './workspaceHelpers';
import { ImageToolTab, PdfToolTab } from './workspaceTypes';
import { ImageToolsDeck } from './ImageToolsDeck';
import { PdfSuiteDeck } from './pdfSuite/PdfSuiteDeck';
import { WordRibbonBar } from './office/WordRibbonBar';
import { SpreadsheetRibbonBar } from './office/SpreadsheetRibbonBar';
import { WordDocFormatting, defaultFormatting } from './office/wordDocumentHelper';

interface WorkspaceToolDeckProps {
  category: DocumentCategory;
  imageTab: ImageToolTab;
  setImageTab: (t: ImageToolTab) => void;
  pdfTab: PdfToolTab;
  setPdfTab: (t: PdfToolTab) => void;
  imageEditor: any;
  pdfActions: any;
  submission: Submission;
  fileViewUrl: string;
  activeFileName?: string;
  targetKb: number;
  setTargetKb: (kb: number) => void;
  customKbInput: string;
  setCustomKbInput: (val: string) => void;
  onDownloadImage: (format: 'jpeg' | 'png') => void;
  onConvertImageToPdf: () => void;
  onCompressImage: (target: number) => void;
  onPrintCompressedImage?: (target: number, mode: any) => void;
  onPrint: () => void;
  // Word props
  wordFormatting?: WordDocFormatting;
  onChangeWordFormatting?: (patch: Partial<WordDocFormatting>) => void;
  wordStats?: { words: number; characters: number };
  onExportWordPdf?: () => void;
  onCopyWordText?: () => void;
  wordCopied?: boolean;
  // Spreadsheet props
  activeCell?: string;
  formulaValue?: string;
  onChangeFormula?: (val: string) => void;
  spreadsheetStats?: { count: number; sum: number; avg: number };
  onAddSpreadsheetRow?: () => void;
  onExportSpreadsheetCsv?: () => void;
}

export const WorkspaceToolDeck: React.FC<WorkspaceToolDeckProps> = ({
  category,
  imageTab,
  setImageTab,
  pdfTab,
  setPdfTab,
  imageEditor,
  pdfActions,
  submission,
  fileViewUrl,
  activeFileName,
  targetKb,
  setTargetKb,
  customKbInput,
  setCustomKbInput,
  onDownloadImage,
  onConvertImageToPdf,
  onCompressImage,
  onPrintCompressedImage,
  onPrint,
  wordFormatting = defaultFormatting,
  onChangeWordFormatting = () => {},
  wordStats = { words: 0, characters: 0 },
  onExportWordPdf = () => {},
  onCopyWordText = () => {},
  wordCopied = false,
  activeCell = 'A1',
  formulaValue = '',
  onChangeFormula = () => {},
  spreadsheetStats = { count: 0, sum: 0, avg: 0 },
  onAddSpreadsheetRow = () => {},
  onExportSpreadsheetCsv = () => {},
}) => {
  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--color-border)] shadow-xs space-y-3 print:hidden">
      {category === 'image' && (
        <ImageToolsDeck
          imageTab={imageTab}
          setImageTab={setImageTab}
          imageEditor={imageEditor}
          targetKb={targetKb}
          setTargetKb={setTargetKb}
          customKbInput={customKbInput}
          setCustomKbInput={setCustomKbInput}
          onDownloadImage={onDownloadImage}
          onConvertImageToPdf={onConvertImageToPdf}
          onCompressImage={onCompressImage}
          onPrintCompressedImage={onPrintCompressedImage}
          onPrint={onPrint}
        />
      )}

      {category === 'pdf' && (
        <PdfSuiteDeck
          pdfTab={pdfTab}
          setPdfTab={setPdfTab}
          pdfActions={pdfActions}
          submission={submission}
          fileViewUrl={fileViewUrl}
          activeFileName={activeFileName}
        />
      )}

      {category === 'word' && (
        <WordRibbonBar
          formatting={wordFormatting}
          onChangeFormatting={onChangeWordFormatting}
          wordCount={wordStats.words}
          charCount={wordStats.characters}
          onExportPdf={onExportWordPdf}
          onPrint={onPrint}
          onCopyText={onCopyWordText}
          copied={wordCopied}
        />
      )}

      {category === 'spreadsheet' && (
        <SpreadsheetRibbonBar
          activeCell={activeCell}
          formulaValue={formulaValue}
          onChangeFormula={onChangeFormula}
          stats={spreadsheetStats}
          onAddRow={onAddSpreadsheetRow}
          onExportCsv={onExportSpreadsheetCsv}
          onPrint={onPrint}
        />
      )}

      {category === 'generic' && (
        <div className="flex items-center justify-between p-2 text-xs text-[var(--color-muted-text)]">
          <span>Generic Document File Preview</span>
          <button
            type="button"
            onClick={onPrint}
            className="px-3 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] font-bold cursor-pointer"
          >
            Print File
          </button>
        </div>
      )}
    </div>
  );
};
