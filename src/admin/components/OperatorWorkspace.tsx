import React, { useState, useRef } from 'react';
import { CustomerDetailCard } from './workspace/CustomerDetailCard';
import { FileListSidebar } from './workspace/FileListSidebar';
import { WorkspaceTopBar } from './workspace/WorkspaceTopBar';
import { WorkspaceToolDeck } from './workspace/WorkspaceToolDeck';
import { StudioStageContainer } from './workspace/StudioStageContainer';
import { useWorkspaceSubmission } from './workspace/useWorkspaceSubmission';
import { useImageEditor } from './workspace/useImageEditor';
import { useImageExports } from './workspace/useImageExports';
import { usePdfSuiteActions } from './workspace/pdfSuite/usePdfSuiteActions';
import { useWordStudioState } from './workspace/office/useWordStudioState';
import { useSpreadsheetStudioState } from './workspace/office/useSpreadsheetStudioState';
import { getDocumentCategory, isImageFile } from './workspace/workspaceHelpers';
import { ImageToolTab, PdfToolTab, OperatorWorkspaceProps } from './workspace/workspaceTypes';
import { downloadFile } from '../../lib/pdfSuite';

export const OperatorWorkspace: React.FC<OperatorWorkspaceProps> = ({ submissionId, onBack }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<ImageToolTab>('crop');
  const [pdfTab, setPdfTab] = useState<PdfToolTab>('merge');
  const [customKbInput, setCustomKbInput] = useState('200');
  const [targetKb, setTargetKb] = useState(200);
  const [modifiedPdfBlobs, setModifiedPdfBlobs] = useState<Record<string, { blobUrl: string; bytes: Uint8Array; fileName: string }>>({});

  const imageRef = useRef<HTMLImageElement | null>(null);
  const printAreaRef = useRef<HTMLDivElement | null>(null);
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3500); };
  const imageEditor = useImageEditor(imageRef);

  const {
    submission, loading, error, activeFileId, selectedFileIds, savedFileStates,
    savedNotice, isSaving, handleSelectFile, handleToggleSelectFile, handleSaveState,
  } = useWorkspaceSubmission(submissionId, imageEditor, showToast);

  const handleApplyModifiedPdf = (bytes: Uint8Array, fileName: string) => {
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    setModifiedPdfBlobs((prev) => ({ ...prev, [activeFileId]: { blobUrl, bytes, fileName } }));
    showToast('Changes saved to current PDF studio!');
  };

  const pdfActions = usePdfSuiteActions(showToast, handleApplyModifiedPdf);
  const activeFile = submission?.files?.find((f: any) => (f.id || f.filename) === activeFileId) || submission?.files?.[0];
  const category = activeFile ? getDocumentCategory(activeFile) : 'image';
  const modifiedPdf = modifiedPdfBlobs[activeFileId];
  const rawFileUrl = submission && activeFile ? `/api/admin/view/${submission.id}/${activeFile.id || (activeFile as any).filename}` : '';
  const fileViewUrl = modifiedPdf?.blobUrl || rawFileUrl;

  const imageExports = useImageExports({
    imageRef,
    getCurrentState: imageEditor.getCurrentState,
    customerName: submission?.name || (submission as any)?.customer_name || 'Document',
    showToast,
  });
  const wordStudio = useWordStudioState(submission, activeFile?.original_name, showToast);
  const spreadsheetStudio = useSpreadsheetStudioState(submission, activeFile?.original_name, showToast);

  const handleMergeSelected = () => {
    const targetFiles = (submission?.files || []).filter((f: any) => selectedFileIds.includes(f.id || f.filename));
    if (targetFiles.length < 2) return showToast('Please select at least 2 files to merge.');
    const items = targetFiles.map((f: any) => ({
      url: `/api/admin/view/${submission?.id}/${f.id || f.filename}`,
      isImage: isImageFile(f),
      name: f.original_name,
    }));
    pdfActions.executeMerge(items, `${submission?.name || 'Citizen'}_Consolidated`);
  };

  const handleSavePdfChanges = () => {
    if (modifiedPdf) {
      downloadFile(modifiedPdf.bytes, modifiedPdf.fileName, 'application/pdf');
      showToast('Saved modified PDF document!');
    } else showToast('No pending changes on current PDF.');
  };

  const handleRevertPdf = () => {
    if (modifiedPdf) {
      URL.revokeObjectURL(modifiedPdf.blobUrl);
      setModifiedPdfBlobs((prev) => { const cp = { ...prev }; delete cp[activeFileId]; return cp; });
      showToast('Reverted to original PDF file.');
    }
  };

  const handleTopBarPrint = () => {
    if (category === 'image') imageExports.handlePrintImage('fit-page');
    else if (category === 'word') wordStudio.handlePrint();
    else if (category === 'spreadsheet') spreadsheetStudio.handlePrint();
    else window.open(fileViewUrl, '_blank')?.print();
  };

  if (loading) return <div className="p-12 text-center text-sm font-bold text-[var(--color-muted-text)]">Loading Operator Workspace...</div>;
  if (error || !submission) return <div className="p-8 text-center text-sm font-bold text-red-500">{error || 'No submission'}</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-5">
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 print:hidden">
          <CustomerDetailCard submission={submission} />
          <FileListSidebar
            files={submission.files as any}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            savedFileStates={savedFileStates}
            selectedFileIds={selectedFileIds}
            onToggleSelectFile={handleToggleSelectFile}
            onMergeSelected={handleMergeSelected}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-3.5 w-full">
          <WorkspaceTopBar
            onBack={onBack}
            activeFileName={activeFile?.original_name}
            isSaving={isSaving}
            savedNotice={savedNotice}
            onSaveState={handleSaveState}
            onPrint={handleTopBarPrint}
          />

          <WorkspaceToolDeck
            category={category}
            imageTab={imageTab}
            setImageTab={setImageTab}
            pdfTab={pdfTab}
            setPdfTab={setPdfTab}
            imageEditor={imageEditor}
            pdfActions={pdfActions}
            submission={submission}
            fileViewUrl={fileViewUrl}
            activeFileName={activeFile?.original_name}
            targetKb={targetKb}
            setTargetKb={setTargetKb}
            customKbInput={customKbInput}
            setCustomKbInput={setCustomKbInput}
            onDownloadImage={imageExports.handleDownloadImage}
            onConvertImageToPdf={imageExports.handleConvertImageToPdf}
            onCompressImage={imageExports.handleCompressImage}
            onPrintCompressedImage={imageExports.handlePrintCompressedImage}
            onPrint={handleTopBarPrint}
            wordFormatting={wordStudio.formatting}
            onChangeWordFormatting={wordStudio.updateFormatting}
            wordStats={wordStudio.stats}
            onExportWordPdf={wordStudio.handleExportPdf}
            onCopyWordText={wordStudio.handleCopyText}
            wordCopied={wordStudio.copied}
            activeCell={spreadsheetStudio.activeCell}
            formulaValue={spreadsheetStudio.formulaValue}
            onChangeFormula={spreadsheetStudio.handleChangeFormula}
            spreadsheetStats={spreadsheetStudio.stats}
            onAddSpreadsheetRow={spreadsheetStudio.handleAddRow}
            onExportSpreadsheetCsv={spreadsheetStudio.handleExportCsv}
          />

          <StudioStageContainer
            category={category}
            imageEditor={imageEditor}
            imageRef={imageRef}
            printAreaRef={printAreaRef}
            imageTab={imageTab}
            pdfProps={{
              pdfUrl: fileViewUrl,
              fileName: activeFile?.original_name || 'document.pdf',
              isModified: !!modifiedPdf,
              onSaveChanges: handleSavePdfChanges,
              onRevert: handleRevertPdf,
              onPrint: handleTopBarPrint,
            }}
            wordProps={{
              content: wordStudio.content,
              onChangeContent: wordStudio.setContent,
              formatting: wordStudio.formatting,
              fileName: activeFile?.original_name || 'document.docx',
            }}
            spreadsheetProps={{
              data: spreadsheetStudio.data,
              onChangeCell: spreadsheetStudio.handleChangeCell,
              activeCell: spreadsheetStudio.activeCell,
              onSelectCell: spreadsheetStudio.setActiveCell,
              fileName: activeFile?.original_name || 'sheet.xlsx',
              rowCount: spreadsheetStudio.rowCount,
            }}
            fileViewUrl={fileViewUrl}
            activeFileName={activeFile?.original_name}
          />
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white border border-[#30AFFF]/40 shadow-2xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#30AFFF] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
