import { useState } from 'react';
import { 
  downloadFile, 
  mergeDocuments, 
  splitPdfPages, 
  rotatePdfPages, 
  watermarkPdf, 
  addPageNumbersToPdf, 
  compressPdfDocument 
} from '../../../../lib/pdfSuite';
import { parsePageRangeString, getPdfPageCount } from '../../../../lib/pdfSuite/pdfSplit';
import { PageNumberPosition, PageNumberFormat } from '../../../../lib/pdfSuite/pdfPageNumbers';

export function usePdfSuiteActions(
  showToast: (msg: string) => void,
  onApplyModifiedPdf?: (bytes: Uint8Array, fileName: string) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);

  const executeMerge = async (files: Array<{ url: string; isImage: boolean; name: string }>, outputName = 'Consolidated_Document') => {
    try {
      setIsProcessing(true);
      showToast('Merging documents into consolidated PDF...');
      const bytes = await mergeDocuments(files);
      const outName = `${outputName}_${Date.now()}.pdf`;
      if (onApplyModifiedPdf) onApplyModifiedPdf(bytes, outName);
      downloadFile(bytes, outName, 'application/pdf');
      showToast(`Merged ${files.length} items & applied to studio!`);
    } catch (e: any) {
      showToast('Merge error: ' + (e.message || 'Failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const executeSplit = async (pdfUrl: string, rangeStr: string, fileName = 'Document') => {
    try {
      setIsProcessing(true);
      showToast('Extracting selected pages from PDF...');
      const total = await getPdfPageCount(pdfUrl);
      const indices = parsePageRangeString(rangeStr, total);
      if (indices.length === 0) {
        showToast('Please specify valid page numbers (e.g. 1, 2-3)');
        return;
      }
      const bytes = await splitPdfPages(pdfUrl, indices);
      const outName = `${fileName}_Pages_${rangeStr.replace(/\s+/g, '')}_${Date.now()}.pdf`;
      if (onApplyModifiedPdf) onApplyModifiedPdf(bytes, outName);
      downloadFile(bytes, outName, 'application/pdf');
      showToast(`Extracted ${indices.length} pages & updated studio!`);
    } catch (e: any) {
      showToast('Split error: ' + (e.message || 'Failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const executeRotate = async (pdfUrl: string, angle: 90 | 180 | 270, pageRange?: string, fileName = 'Document') => {
    try {
      setIsProcessing(true);
      showToast(`Rotating PDF pages by ${angle}°...`);
      let pages: number[] | undefined;
      if (pageRange) {
        const total = await getPdfPageCount(pdfUrl);
        pages = parsePageRangeString(pageRange, total);
      }
      const bytes = await rotatePdfPages(pdfUrl, { angle, pages });
      const outName = `${fileName}_Rotated_${angle}deg.pdf`;
      if (onApplyModifiedPdf) onApplyModifiedPdf(bytes, outName);
      downloadFile(bytes, outName, 'application/pdf');
      showToast(`PDF rotated ${angle}° & updated in studio!`);
    } catch (e: any) {
      showToast('Rotate error: ' + (e.message || 'Failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const executeWatermark = async (pdfUrl: string, text: string, opacity: number, angle: number, fileName = 'Document') => {
    try {
      setIsProcessing(true);
      showToast(`Stamping watermark "${text}" onto PDF...`);
      const bytes = await watermarkPdf(pdfUrl, { text, opacity, angle });
      const outName = `${fileName}_Watermarked.pdf`;
      if (onApplyModifiedPdf) onApplyModifiedPdf(bytes, outName);
      downloadFile(bytes, outName, 'application/pdf');
      showToast('Watermark stamped & updated in studio!');
    } catch (e: any) {
      showToast('Watermark error: ' + (e.message || 'Failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const executePageNumbers = async (pdfUrl: string, position: PageNumberPosition, format: PageNumberFormat, fileName = 'Document') => {
    try {
      setIsProcessing(true);
      showToast('Adding page numbers to PDF...');
      const bytes = await addPageNumbersToPdf(pdfUrl, { position, format });
      const outName = `${fileName}_Numbered.pdf`;
      if (onApplyModifiedPdf) onApplyModifiedPdf(bytes, outName);
      downloadFile(bytes, outName, 'application/pdf');
      showToast('Page numbers added & updated in studio!');
    } catch (e: any) {
      showToast('Page numbers error: ' + (e.message || 'Failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCompress = async (pdfUrl: string, level: 'extreme' | 'recommended' | 'less', fileName = 'Document') => {
    try {
      setIsProcessing(true);
      showToast(`Compressing PDF with ${level} profile...`);
      const bytes = await compressPdfDocument(pdfUrl);
      const outName = `${fileName}_Compressed.pdf`;
      if (onApplyModifiedPdf) onApplyModifiedPdf(bytes, outName);
      downloadFile(bytes, outName, 'application/pdf');
      showToast('PDF compressed & updated in studio!');
    } catch (e: any) {
      showToast('Compression error: ' + (e.message || 'Failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    executeMerge,
    executeSplit,
    executeRotate,
    executeWatermark,
    executePageNumbers,
    executeCompress,
  };
}
