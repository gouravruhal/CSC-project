import { PDFDocument } from 'pdf-lib';

/**
 * Parses user page range input such as "1, 3-5, 8" into 0-indexed page numbers.
 */
export function parsePageRangeString(rangeStr: string, totalPages: number): number[] {
  const selected = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          selected.add(p - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        selected.add(pageNum - 1);
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b);
}

/**
 * Extracts specific pages from a PDF and returns the new consolidated PDF.
 */
export async function splitPdfPages(
  pdfUrlOrBytes: string | Uint8Array | ArrayBuffer,
  pageIndices: number[]
): Promise<Uint8Array> {
  let arrayBuffer: ArrayBuffer;
  if (typeof pdfUrlOrBytes === 'string') {
    const res = await fetch(pdfUrlOrBytes);
    arrayBuffer = await res.arrayBuffer();
  } else if (pdfUrlOrBytes instanceof Uint8Array) {
    arrayBuffer = pdfUrlOrBytes.buffer;
  } else {
    arrayBuffer = pdfUrlOrBytes;
  }

  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const splitPdf = await PDFDocument.create();

  const total = srcPdf.getPageCount();
  const validIndices = pageIndices.filter((idx) => idx >= 0 && idx < total);

  if (validIndices.length === 0) {
    throw new Error('No valid pages selected for split');
  }

  const copiedPages = await splitPdf.copyPages(srcPdf, validIndices);
  copiedPages.forEach((page) => splitPdf.addPage(page));

  return await splitPdf.save();
}

/**
 * Gets the total number of pages in a PDF document.
 */
export async function getPdfPageCount(pdfUrl: string): Promise<number> {
  const res = await fetch(pdfUrl);
  const arrayBuffer = await res.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}
