import { PDFDocument } from 'pdf-lib';

export interface MergeableItem {
  url: string;
  isImage: boolean;
  name: string;
}

/**
 * Merges multiple PDF files and images into a single consolidated PDF document.
 */
export async function mergeDocuments(files: MergeableItem[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  for (const file of files) {
    try {
      const res = await fetch(file.url);
      const arrayBuffer = await res.arrayBuffer();

      if (!file.isImage) {
        const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const indices = srcPdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(srcPdf, indices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } else {
        const isPng = file.name.toLowerCase().endsWith('.png');
        let embeddedImage;
        try {
          embeddedImage = isPng
            ? await mergedPdf.embedPng(arrayBuffer)
            : await mergedPdf.embedJpg(arrayBuffer);
        } catch {
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
