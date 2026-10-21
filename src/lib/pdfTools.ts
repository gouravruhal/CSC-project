import { PDFDocument } from 'pdf-lib';

/**
 * Downloads a Blob or Uint8Array as a file in the user's browser.
 */
export function downloadFile(data: Uint8Array | Blob | string, filename: string, mimeType = 'application/pdf'): void {
  let blob: Blob;
  if (typeof data === 'string') {
    // Data URL
    const a = document.createElement('a');
    a.href = data;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  } else if (data instanceof Blob) {
    blob = data;
  } else {
    blob = new Blob([data as any], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Converts an image dataURL or image URL into an A4 format PDF document.
 */
export async function convertImageToPdf(
  imageDataUrlOrUrl: string,
  fileName: string = 'converted_document.pdf'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 dimensions in points (72 DPI): 595.28 x 841.89
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

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

  // Scale image to fit A4 page with margins
  const margin = 36; // 0.5 inch margins
  const maxContentWidth = A4_WIDTH - margin * 2;
  const maxContentHeight = A4_HEIGHT - margin * 2;

  const scale = Math.min(maxContentWidth / imgWidth, maxContentHeight / imgHeight, 1);
  const displayWidth = imgWidth * scale;
  const displayHeight = imgHeight * scale;

  const x = margin + (maxContentWidth - displayWidth) / 2;
  const y = margin + (maxContentHeight - displayHeight) / 2;

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  page.drawImage(embeddedImage, {
    x,
    y,
    width: displayWidth,
    height: displayHeight,
  });

  return await pdfDoc.save();
}

/**
 * Merges multiple PDF files and images into a single consolidated PDF document.
 */
export async function mergeDocuments(
  files: Array<{ url: string; isImage: boolean; name: string }>
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  for (const file of files) {
    try {
      const res = await fetch(file.url);
      const arrayBuffer = await res.arrayBuffer();

      if (!file.isImage) {
        // Load source PDF and copy its pages
        const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const indices = srcPdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(srcPdf, indices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } else {
        // Embed image onto an A4 page
        let embeddedImage;
        const isPng = file.name.toLowerCase().endsWith('.png');
        try {
          embeddedImage = isPng
            ? await mergedPdf.embedPng(arrayBuffer)
            : await mergedPdf.embedJpg(arrayBuffer);
        } catch {
          // If jpg embed fails, try png or vice-versa
          try {
            embeddedImage = await mergedPdf.embedPng(arrayBuffer);
          } catch {
            embeddedImage = await mergedPdf.embedJpg(arrayBuffer);
          }
        }

        const margin = 36;
        const maxContentWidth = A4_WIDTH - margin * 2;
        const maxContentHeight = A4_HEIGHT - margin * 2;
        const scale = Math.min(
          maxContentWidth / embeddedImage.width,
          maxContentHeight / embeddedImage.height,
          1
        );
        const displayWidth = embeddedImage.width * scale;
        const displayHeight = embeddedImage.height * scale;
        const x = margin + (maxContentWidth - displayWidth) / 2;
        const y = margin + (maxContentHeight - displayHeight) / 2;

        const page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
        page.drawImage(embeddedImage, {
          x,
          y,
          width: displayWidth,
          height: displayHeight,
        });
      }
    } catch (err) {
      console.warn(`Failed to process file ${file.name} for merge:`, err);
    }
  }

  return await mergedPdf.save();
}

/**
 * Extracts specific pages from a PDF and creates a new PDF document.
 * @param pdfUrl URL of the source PDF
 * @param pageIndices 0-indexed list of pages to extract
 */
export async function splitPdfPages(pdfUrl: string, pageIndices: number[]): Promise<Uint8Array> {
  const res = await fetch(pdfUrl);
  const arrayBuffer = await res.arrayBuffer();

  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const splitPdf = await PDFDocument.create();

  const validIndices = pageIndices.filter((idx) => idx >= 0 && idx < srcPdf.getPageCount());
  if (validIndices.length === 0) {
    throw new Error('No valid pages selected for split');
  }

  const copiedPages = await splitPdf.copyPages(srcPdf, validIndices);
  copiedPages.forEach((page) => splitPdf.addPage(page));

  return await splitPdf.save();
}

/**
 * Compresses an HTML Canvas to a target KB size using JPEG quality reduction.
 */
export async function compressCanvasToTargetKb(
  canvas: HTMLCanvasElement,
  targetMaxKb: number
): Promise<{ blob: Blob; dataUrl: string; finalKb: number }> {
  let minQuality = 0.05;
  let maxQuality = 0.95;
  let bestBlob: Blob | null = null;
  let bestDataUrl = '';

  const getBlobAtQuality = (q: number): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve) => {
      const dataUrl = canvas.toDataURL('image/jpeg', q);
      canvas.toBlob(
        (blob) => {
          resolve({ blob: blob || new Blob(), dataUrl });
        },
        'image/jpeg',
        q
      );
    });
  };

  // Binary search for target quality
  for (let i = 0; i < 6; i++) {
    const midQuality = (minQuality + maxQuality) / 2;
    const { blob, dataUrl } = await getBlobAtQuality(midQuality);
    const kb = blob.size / 1024;

    bestBlob = blob;
    bestDataUrl = dataUrl;

    if (kb > targetMaxKb) {
      maxQuality = midQuality;
    } else {
      minQuality = midQuality;
    }
  }

  const finalBlob = bestBlob || (await getBlobAtQuality(0.5)).blob;
  const finalKb = Math.round(finalBlob.size / 1024);

  return {
    blob: finalBlob,
    dataUrl: bestDataUrl,
    finalKb,
  };
}
