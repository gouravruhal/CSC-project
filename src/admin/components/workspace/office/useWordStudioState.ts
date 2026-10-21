import { useState, useEffect } from 'react';
import { Submission } from '../../../../types';
import { WordDocFormatting, defaultFormatting, calculateDocStats, generateSampleDocContent } from './wordDocumentHelper';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { downloadFile } from '../../../../lib/pdfSuite/pdfDownload';

export function useWordStudioState(
  submission: Submission | null,
  activeFileName?: string,
  showToast?: (msg: string) => void
) {
  const [formatting, setFormatting] = useState<WordDocFormatting>(defaultFormatting);
  const [content, setContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setContent(generateSampleDocContent(submission, activeFileName));
  }, [submission?.id, activeFileName]);

  const stats = calculateDocStats(content);

  const updateFormatting = (patch: Partial<WordDocFormatting>) => {
    setFormatting((prev) => ({ ...prev, ...patch }));
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (showToast) showToast('Document text copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (showToast) showToast('Failed to copy text.');
    }
  };

  const handleExportPdf = async () => {
    try {
      if (showToast) showToast('Generating PDF from document content...');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const lines = content.split('\n');
      let y = 800;
      page.drawText('ATAL SEVA KENDRA - OFFICIAL CITIZEN RECORD', {
        x: 50,
        y,
        size: 13,
        font: fontBold,
        color: rgb(0.1, 0.2, 0.4),
      });
      y -= 25;

      for (const line of lines.slice(0, 42)) {
        if (y < 40) break;
        const isHeader = line.startsWith('SUBJECT:') || line.match(/^[0-9]\./);
        page.drawText(line.slice(0, 85), {
          x: 50,
          y,
          size: isHeader ? 10 : 9,
          font: isHeader ? fontBold : font,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= 16;
      }

      const bytes = await pdfDoc.save();
      const name = `${activeFileName || 'Document'}_Export.pdf`;
      downloadFile(bytes, name, 'application/pdf');
      if (showToast) showToast('Exported Word document to PDF successfully!');
    } catch (e: any) {
      if (showToast) showToast('Export PDF error: ' + (e.message || 'Failed'));
    }
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>${activeFileName || 'Document'}</title>
          <style>
            @page { size: A4 portrait; margin: 20mm; }
            body { font-family: ${formatting.fontFamily}; font-size: ${formatting.fontSize}px; line-height: ${formatting.lineSpacing}; text-align: ${formatting.align}; white-space: pre-wrap; color: #111; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  };

  return {
    content,
    setContent,
    formatting,
    updateFormatting,
    stats,
    copied,
    handleCopyText,
    handleExportPdf,
    handlePrint,
  };
}
