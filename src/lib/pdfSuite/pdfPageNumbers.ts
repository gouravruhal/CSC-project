import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type PageNumberPosition = 'bottom-center' | 'bottom-right' | 'top-right';
export type PageNumberFormat = 'page-of-total' | 'simple-number' | 'dash-number';

export interface PageNumberOptions {
  position?: PageNumberPosition;
  format?: PageNumberFormat;
  fontSize?: number;
  startFromPage?: number; // 1-indexed, default 1
}

/**
 * Automatically stamps formatted page numbers on PDF pages.
 */
export async function addPageNumbersToPdf(
  pdfUrlOrBytes: string | Uint8Array,
  options: PageNumberOptions = {}
): Promise<Uint8Array> {
  let arrayBuffer: ArrayBuffer;
  if (typeof pdfUrlOrBytes === 'string') {
    const res = await fetch(pdfUrlOrBytes);
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = pdfUrlOrBytes.buffer;
  }

  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  const position = options.position ?? 'bottom-center';
  const format = options.format ?? 'page-of-total';
  const fontSize = options.fontSize ?? 10;
  const startFrom = options.startFromPage ?? 1;

  for (let i = 0; i < total; i++) {
    const pageNum = i + 1;
    if (pageNum < startFrom) continue;

    const page = pages[i];
    const { width, height } = page.getSize();

    let text = `Page ${pageNum} of ${total}`;
    if (format === 'simple-number') {
      text = `${pageNum}`;
    } else if (format === 'dash-number') {
      text = `- ${pageNum} -`;
    }

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    let x = (width - textWidth) / 2;
    let y = 24;

    if (position === 'bottom-right') {
      x = width - textWidth - 36;
      y = 24;
    } else if (position === 'top-right') {
      x = width - textWidth - 36;
      y = height - 30;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await pdfDoc.save();
}
