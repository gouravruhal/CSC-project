import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface WatermarkOptions {
  text: string;
  opacity?: number; // 0.1 to 1.0 (default 0.25)
  size?: number; // font size (default 42)
  color?: { r: number; g: number; b: number };
  angle?: number; // degrees, default -45
}

/**
 * Stamps a semi-transparent text watermark across every page of a PDF document.
 */
export async function watermarkPdf(
  pdfUrlOrBytes: string | Uint8Array,
  options: WatermarkOptions
): Promise<Uint8Array> {
  let arrayBuffer: ArrayBuffer;
  if (typeof pdfUrlOrBytes === 'string') {
    const res = await fetch(pdfUrlOrBytes);
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = pdfUrlOrBytes.buffer;
  }

  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  const text = options.text.trim();
  if (!text) return await pdfDoc.save();

  const opacity = options.opacity ?? 0.25;
  const size = options.size ?? 40;
  const angle = options.angle ?? -45;
  const color = options.color
    ? rgb(options.color.r, options.color.g, options.color.b)
    : rgb(0.2, 0.2, 0.2);

  const textWidth = helveticaFont.widthOfTextAtSize(text, size);
  const textHeight = helveticaFont.heightAtSize(size);

  for (const page of pages) {
    const { width, height } = page.getSize();
    // Center watermark on page
    const x = (width - textWidth) / 2;
    const y = (height - textHeight) / 2;

    page.drawText(text, {
      x,
      y,
      size,
      font: helveticaFont,
      color,
      opacity,
      rotate: degrees(angle),
    });
  }

  return await pdfDoc.save();
}
