import React, { RefObject } from 'react';
import { 
  downloadFile, 
  convertImageToPdf, 
  compressCanvasToTargetKb, 
  printImageDocument, 
  PrintSizeMode 
} from '../../../lib/pdfSuite';
import { createRenderedCanvas } from './canvasExportHelper';
import { SavedFileState } from './workspaceTypes';

interface UseImageExportsParams {
  imageRef: RefObject<HTMLImageElement | null>;
  getCurrentState: () => SavedFileState;
  customerName?: string;
  showToast: (msg: string) => void;
}

export function useImageExports({
  imageRef,
  getCurrentState,
  customerName = 'Document',
  showToast,
}: UseImageExportsParams) {
  const handleDownloadImage = async (format: 'jpeg' | 'png') => {
    if (!imageRef.current) return;
    try {
      showToast(`Generating high-quality ${format.toUpperCase()}...`);
      const canvas = await createRenderedCanvas(imageRef.current, getCurrentState());
      canvas.toBlob((blob) => {
        if (blob) downloadFile(blob, `${customerName}_edit.${format}`, `image/${format}`);
        showToast('Image downloaded successfully!');
      }, `image/${format}`, 0.95);
    } catch (e: any) {
      showToast('Export failed: ' + e.message);
    }
  };

  const handleConvertImageToPdf = async () => {
    if (!imageRef.current) return;
    try {
      showToast('Converting image to print-ready A4 PDF...');
      const canvas = await createRenderedCanvas(imageRef.current, getCurrentState());
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const pdfBytes = await convertImageToPdf(dataUrl);
      downloadFile(pdfBytes, `${customerName}_A4.pdf`);
      showToast('A4 PDF generated & downloaded!');
    } catch (e: any) {
      showToast('PDF convert failed: ' + e.message);
    }
  };

  const handleCompressImage = async (target: number) => {
    if (!imageRef.current) return;
    try {
      showToast(`Compressing image to <${target} KB...`);
      const canvas = await createRenderedCanvas(imageRef.current, getCurrentState());
      const { blob, finalKb } = await compressCanvasToTargetKb(canvas, target);
      downloadFile(blob, `${customerName}_${finalKb}KB.jpg`, 'image/jpeg');
      showToast(`Compressed to ${finalKb} KB (<${target} KB target) & downloaded!`);
    } catch (e: any) {
      showToast('Compression failed: ' + e.message);
    }
  };

  const handlePrintImage = async (mode: PrintSizeMode = 'fit-page') => {
    if (!imageRef.current) return;
    try {
      showToast('Preparing clean document print preview...');
      const canvas = await createRenderedCanvas(imageRef.current, getCurrentState());
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      await printImageDocument(dataUrl, { mode, title: `${customerName} - Print` });
      showToast('Print dialog launched!');
    } catch (e: any) {
      showToast('Print error: ' + e.message);
    }
  };

  const handlePrintCompressedImage = async (target: number, mode: PrintSizeMode = 'fit-page') => {
    if (!imageRef.current) return;
    try {
      showToast(`Compressing image to <${target} KB and preparing print...`);
      const canvas = await createRenderedCanvas(imageRef.current, getCurrentState());
      const { dataUrl, finalKb } = await compressCanvasToTargetKb(canvas, target);
      await printImageDocument(dataUrl, {
        mode,
        title: `${customerName} - Compressed ${finalKb}KB Print`,
      });
      showToast(`Print ready for ${finalKb} KB reduced image!`);
    } catch (e: any) {
      showToast('Print error: ' + e.message);
    }
  };

  return {
    handleDownloadImage,
    handleConvertImageToPdf,
    handleCompressImage,
    handlePrintImage,
    handlePrintCompressedImage,
  };
}
