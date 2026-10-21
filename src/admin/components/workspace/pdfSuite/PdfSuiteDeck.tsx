import React from 'react';
import { Submission } from '../../../../types';
import { PdfToolTab } from '../workspaceTypes';
import { PdfSuiteBar } from './PdfSuiteBar';
import { PdfMergePanel } from './PdfMergePanel';
import { PdfSplitPanel } from './PdfSplitPanel';
import { PdfRotatePanel } from './PdfRotatePanel';
import { PdfWatermarkPanel } from './PdfWatermarkPanel';
import { PdfPageNumbersPanel } from './PdfPageNumbersPanel';
import { PdfCompressPanel } from './PdfCompressPanel';

interface PdfSuiteDeckProps {
  pdfTab: PdfToolTab;
  setPdfTab: (t: PdfToolTab) => void;
  pdfActions: any;
  submission: Submission;
  fileViewUrl: string;
  activeFileName?: string;
}

export const PdfSuiteDeck: React.FC<PdfSuiteDeckProps> = ({
  pdfTab,
  setPdfTab,
  pdfActions,
  submission,
  fileViewUrl,
  activeFileName,
}) => {
  return (
    <>
      <PdfSuiteBar activeTab={pdfTab} onChangeTab={setPdfTab} />
      {pdfTab === 'merge' && (
        <PdfMergePanel
          files={submission.files as any}
          submissionId={submission.id}
          isProcessing={pdfActions.isProcessing}
          onExecuteMerge={(items) => pdfActions.executeMerge(items, submission.name)}
        />
      )}
      {pdfTab === 'split' && (
        <PdfSplitPanel
          isProcessing={pdfActions.isProcessing}
          onExecuteSplit={(range) => pdfActions.executeSplit(fileViewUrl, range, activeFileName)}
        />
      )}
      {pdfTab === 'rotate' && (
        <PdfRotatePanel
          isProcessing={pdfActions.isProcessing}
          onExecuteRotate={(angle, range) => pdfActions.executeRotate(fileViewUrl, angle, range, activeFileName)}
        />
      )}
      {pdfTab === 'watermark' && (
        <PdfWatermarkPanel
          isProcessing={pdfActions.isProcessing}
          onExecuteWatermark={(text, opacity, angle) => pdfActions.executeWatermark(fileViewUrl, text, opacity, angle, activeFileName)}
        />
      )}
      {pdfTab === 'pagenumbers' && (
        <PdfPageNumbersPanel
          isProcessing={pdfActions.isProcessing}
          onExecutePageNumbers={(pos, fmt) => pdfActions.executePageNumbers(fileViewUrl, pos, fmt, activeFileName)}
        />
      )}
      {pdfTab === 'compress' && (
        <PdfCompressPanel
          isProcessing={pdfActions.isProcessing}
          onExecuteCompress={(level) => pdfActions.executeCompress(fileViewUrl, level, activeFileName)}
        />
      )}
    </>
  );
};
