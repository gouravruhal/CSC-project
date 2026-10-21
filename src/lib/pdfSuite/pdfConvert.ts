import { PDFDocument } from 'pdf-lib';

export interface ImageToPdfOptions {
  margin?: number;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Converts an image dataURL, Blob, or URL into an A4 PDF document.
 */
export async function convertImageToPdf(
  imageDataUrlOrUrl: string,
  fileName: string = 'document.pdf',
  options: ImageToPdfOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 dimensions in points: 595.28 x 841.89
  const isLandscape = options.orientation === 'landscape';
  const pageWidth = isLandscape ? 841.89 : 595.28;
  const pageHeight = isLandscape ? 595.28 : 841.89;
  const margin = options.margin ?? 36;

  let imageBytes: ArrayBuffer;
  let isPng = false;

  if (imageDataUrlOrUrl.startsWith('data:image/png')) {
    isPng = true;
    const base64 = imageDataUrlOrUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    imageBytes = bytes.buffer;
  } else if (imageDataUrlOrUrl.startsWith('data:image/')) {
    isPng = false;
    const base64 = imageDataUrlOrUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    imageBytes = bytes.buffer;
  } else {
    const res = await fetch(imageDataUrlOrUrl);
    const contentType = res.headers.get('content-type') || '';
    isPng = contentType.includes('png') || imageDataUrlOrUrl.toLowerCase().endsWith('.png');
    imageBytes = await res.arrayBuffer();
  }

  const embeddedImage = isPng
    ? await pdfDoc.embedPng(imageBytes)
    : await pdfDoc.embedJpg(imageBytes);

  const imgWidth = embeddedImage.width;
  const imgHeight = embeddedImage.height;

  const maxContentWidth = pageWidth - margin * 2;
  const maxContentHeight = pageHeight - margin * 2;

  const scale = Math.min(maxContentWidth / imgWidth, maxContentHeight / imgHeight, 1);
  const displayWidth = imgWidth * scale;
  const displayHeight = imgHeight * scale;

  const x = margin + (maxContentWidth - displayWidth) / 2;
  const y = margin + (maxContentHeight - displayHeight) / 2;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(embeddedImage, {
    x,
    y,
    width: displayWidth,
    height: displayHeight,
  });

  return await pdfDoc.save();
}
