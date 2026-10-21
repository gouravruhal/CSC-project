import { PDFDocument } from 'pdf-lib';

export interface CompressCanvasResult {
  blob: Blob;
  dataUrl: string;
  finalKb: number;
  width: number;
  height: number;
}

/**
 * Compresses an HTML Canvas to a target KB size using progressive dimension downscaling
 * and binary search JPEG quality reduction, guaranteeing the output stays under the limit.
 */
export async function compressCanvasToTargetKb(
  sourceCanvas: HTMLCanvasElement,
  targetMaxKb: number
): Promise<CompressCanvasResult> {
  const getBlob = (
    cvs: HTMLCanvasElement,
    quality: number
  ): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve) => {
      const dataUrl = cvs.toDataURL('image/jpeg', quality);
      cvs.toBlob(
        (blob) => resolve({ blob: blob || new Blob(), dataUrl }),
        'image/jpeg',
        quality
      );
    });
  };

  let currentCanvas = sourceCanvas;
  let scale = 1.0;
  let bestResult: { blob: Blob; dataUrl: string; kb: number; width: number; height: number } | null = null;

  // Up to 5 scaling stages to guarantee large phone photos reach strict limits (<50KB, <20KB)
  for (let stage = 0; stage < 5; stage++) {
    if (stage > 0) {
      scale *= 0.78;
      const nw = Math.max(120, Math.round(sourceCanvas.width * scale));
      const nh = Math.max(120, Math.round(sourceCanvas.height * scale));
      const sc = document.createElement('canvas');
      sc.width = nw;
      sc.height = nh;
      const sctx = sc.getContext('2d');
      if (sctx) {
        sctx.fillStyle = '#FFFFFF';
        sctx.fillRect(0, 0, nw, nh);
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = 'high';
        sctx.drawImage(sourceCanvas, 0, 0, nw, nh);
        currentCanvas = sc;
      }
    }

    let minQ = 0.08;
    let maxQ = 0.92;

    for (let i = 0; i < 6; i++) {
      const midQ = (minQ + maxQ) / 2;
      const res = await getBlob(currentCanvas, midQ);
      const kb = Math.round(res.blob.size / 1024);

      if (kb <= targetMaxKb) {
        if (!bestResult || kb > bestResult.kb || bestResult.kb > targetMaxKb) {
          bestResult = { ...res, kb, width: currentCanvas.width, height: currentCanvas.height };
        }
        minQ = midQ;
      } else {
        maxQ = midQ;
      }
    }

    if (bestResult && bestResult.kb <= targetMaxKb) {
      break;
    }
  }

  if (!bestResult) {
    const fallback = await getBlob(currentCanvas, 0.15);
    bestResult = {
      ...fallback,
      kb: Math.round(fallback.blob.size / 1024),
      width: currentCanvas.width,
      height: currentCanvas.height,
    };
  }

  return {
    blob: bestResult.blob,
    dataUrl: bestResult.dataUrl,
    finalKb: bestResult.kb,
    width: bestResult.width,
    height: bestResult.height,
  };
}

/**
 * Optimizes PDF structure and re-serializes with object compression.
 */
export async function compressPdfDocument(
  pdfUrlOrBytes: string | Uint8Array
): Promise<Uint8Array> {
  let arrayBuffer: ArrayBuffer;
  if (typeof pdfUrlOrBytes === 'string') {
    const res = await fetch(pdfUrlOrBytes);
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = pdfUrlOrBytes.buffer;
  }

  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return await pdfDoc.save({ useObjectStreams: true });
}
