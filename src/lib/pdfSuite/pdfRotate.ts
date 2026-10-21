import { PDFDocument, degrees } from 'pdf-lib';

export interface RotatePdfOptions {
  angle: 90 | 180 | 270;
  pages?: number[]; // 0-indexed page list; if empty or undefined, rotates all pages
}

/**
 * Rotates pages in a PDF document by 90, 180, or 270 degrees.
 */
export async function rotatePdfPages(
  pdfUrlOrBytes: string | Uint8Array,
  options: RotatePdfOptions
): Promise<Uint8Array> {
  let arrayBuffer: ArrayBuffer;
  if (typeof pdfUrlOrBytes === 'string') {
    const res = await fetch(pdfUrlOrBytes);
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = pdfUrlOrBytes.buffer;
  }

  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const targetIndices = new Set(
    options.pages && options.pages.length > 0
      ? options.pages
      : pages.map((_, i) => i)
  );

  pages.forEach((page, idx) => {
    if (targetIndices.has(idx)) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + options.angle) % 360));
    }
  });

  return await pdfDoc.save();
}
