export interface CanvasRenderParams {
  rotation: number;
  fineAngle: number;
  flipH: boolean;
  flipV: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  bwMode: boolean;
  xeroxThreshold: number;
  inverted: boolean;
  cropInsetTop: number;
  cropInsetBottom: number;
  cropInsetLeft: number;
  cropInsetRight: number;
}

/**
 * Creates an in-memory HTMLCanvasElement with all transformations, crops, and filters applied.
 */
export async function createRenderedCanvas(
  sourceImage: HTMLImageElement | string,
  params: CanvasRenderParams
): Promise<HTMLCanvasElement> {
  const {
    rotation,
    fineAngle,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    bwMode,
    xeroxThreshold,
    inverted,
    cropInsetTop,
    cropInsetBottom,
    cropInsetLeft,
    cropInsetRight,
  } = params;

  let imgElement: HTMLImageElement;

  if (typeof sourceImage === 'string') {
    imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = sourceImage;
    });
  } else {
    imgElement = sourceImage;
  }

  const natW = imgElement.naturalWidth || imgElement.width || 800;
  const natH = imgElement.naturalHeight || imgElement.height || 600;

  const clipX = Math.round((cropInsetLeft / 100) * natW);
  const clipY = Math.round((cropInsetTop / 100) * natH);
  const clipW = Math.max(10, Math.round(((100 - cropInsetLeft - cropInsetRight) / 100) * natW));
  const clipH = Math.max(10, Math.round(((100 - cropInsetTop - cropInsetBottom) / 100) * natH));

  const totalAngleDeg = (rotation + fineAngle) % 360;
  const rad = (totalAngleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const destW = Math.round(clipW * cos + clipH * sin);
  const destH = Math.round(clipW * sin + clipH * cos);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, destW);
  canvas.height = Math.max(1, destH);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (bwMode) {
    ctx.filter = `grayscale(100%) contrast(${160 + xeroxThreshold}%) brightness(${brightness}%)`;
  } else {
    const filters: string[] = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (inverted) filters.push(`invert(100%)`);
    ctx.filter = filters.join(' ') || 'none';
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(imgElement, clipX, clipY, clipW, clipH, -clipW / 2, -clipH / 2, clipW, clipH);
  ctx.restore();

  return canvas;
}
