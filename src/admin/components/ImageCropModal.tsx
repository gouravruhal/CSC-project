import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  RotateCw,
  Check,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sliders,
  Sparkles
} from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  originalFileName?: string;
  onCropComplete: (croppedBlob: Blob, croppedPreviewUrl: string, mimeType: string, extension: string) => void;
  onCancel: () => void;
  initialAspect?: number | null; // e.g. 16/9, 4/3, 1, or null for free
}

type AspectRatioType = 'free' | '16:9' | '4:3' | '1:1';

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  originalFileName = 'photo.jpg',
  onCropComplete,
  onCancel,
  initialAspect = 16 / 9,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [aspectType, setAspectType] = useState<AspectRatioType>('16:9');
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Dragging state
  const isDraggingRef = useRef<boolean>(false);
  const dragHandleRef = useRef<string | null>(null); // 'move' or handle position like 'nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'
  const dragStartRef = useRef<{ x: number; y: number; crop: CropRect }>({
    x: 0,
    y: 0,
    crop: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Calculate aspect numerical ratio
  const getAspectRatioNumber = (type: AspectRatioType): number | null => {
    switch (type) {
      case '16:9': return 16 / 9;
      case '4:3': return 4 / 3;
      case '1:1': return 1;
      case 'free': return null;
      default: return null;
    }
  };

  // Initialize crop rectangle when image is loaded or container is resized
  const initCropRect = useCallback(() => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const imgWidth = img.offsetWidth;
    const imgHeight = img.offsetHeight;

    if (imgWidth === 0 || imgHeight === 0) return;

    const ratio = getAspectRatioNumber(aspectType);
    let targetWidth = imgWidth * 0.85;
    let targetHeight = imgHeight * 0.85;

    if (ratio !== null) {
      if (targetWidth / targetHeight > ratio) {
        targetWidth = targetHeight * ratio;
      } else {
        targetHeight = targetWidth / ratio;
      }
    }

    const x = Math.max(0, (imgWidth - targetWidth) / 2);
    const y = Math.max(0, (imgHeight - targetHeight) / 2);

    setCrop({
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(targetWidth),
      height: Math.round(targetHeight),
    });
  }, [aspectType]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setTimeout(() => {
      initCropRect();
    }, 50);
  };

  // Re-adjust crop when aspect type changes
  useEffect(() => {
    if (imageLoaded) {
      initCropRect();
    }
  }, [aspectType, imageLoaded, initCropRect]);

  // Pointer drag start
  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    dragHandleRef.current = handle;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      crop: { ...crop },
    };

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  // Pointer drag move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !imageRef.current) return;
    e.preventDefault();

    const img = imageRef.current;
    const maxW = img.offsetWidth;
    const maxH = img.offsetHeight;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const startCrop = dragStartRef.current.crop;
    const handle = dragHandleRef.current;
    const ratio = getAspectRatioNumber(aspectType);

    if (handle === 'move') {
      let newX = startCrop.x + dx;
      let newY = startCrop.y + dy;

      newX = Math.max(0, Math.min(newX, maxW - startCrop.width));
      newY = Math.max(0, Math.min(newY, maxH - startCrop.height));

      setCrop({
        x: Math.round(newX),
        y: Math.round(newY),
        width: startCrop.width,
        height: startCrop.height,
      });
      return;
    }

    // Handle corner/edge resizing
    let newX = startCrop.x;
    let newY = startCrop.y;
    let newW = startCrop.width;
    let newH = startCrop.height;

    const minSize = 40;

    if (handle?.includes('e')) {
      newW = Math.max(minSize, Math.min(startCrop.width + dx, maxW - startCrop.x));
    }
    if (handle?.includes('s')) {
      newH = Math.max(minSize, Math.min(startCrop.height + dy, maxH - startCrop.y));
    }
    if (handle?.includes('w')) {
      const allowedDx = Math.min(dx, startCrop.width - minSize);
      newX = Math.max(0, startCrop.x + allowedDx);
      newW = startCrop.width - (newX - startCrop.x);
    }
    if (handle?.includes('n')) {
      const allowedDy = Math.min(dy, startCrop.height - minSize);
      newY = Math.max(0, startCrop.y + allowedDy);
      newH = startCrop.height - (newY - startCrop.y);
    }

    // Lock to ratio if constrained
    if (ratio !== null) {
      if (handle === 'e' || handle === 'w' || handle === 'se' || handle === 'sw') {
        newH = newW / ratio;
        if (newY + newH > maxH) {
          newH = maxH - newY;
          newW = newH * ratio;
        }
      } else {
        newW = newH * ratio;
        if (newX + newW > maxW) {
          newW = maxW - newX;
          newH = newW / ratio;
        }
      }
    }

    // Boundary containment
    newW = Math.max(minSize, Math.min(newW, maxW - newX));
    newH = Math.max(minSize, Math.min(newH, maxH - newY));

    setCrop({
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH),
    });
  };

  // Pointer drag end
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      dragHandleRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  // Rotate image by 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setTimeout(() => initCropRect(), 100);
  };

  // Perform final high-resolution crop export using HTML5 Canvas
  const handleApplyCrop = () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    const img = imageRef.current;
    const displayedWidth = img.offsetWidth;
    const displayedHeight = img.offsetHeight;

    if (displayedWidth === 0 || displayedHeight === 0) {
      setIsProcessing(false);
      return;
    }

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const scaleX = naturalWidth / displayedWidth;
    const scaleY = naturalHeight / displayedHeight;

    // Actual coordinates on the unscaled natural image
    const sourceX = Math.round(crop.x * scaleX);
    const sourceY = Math.round(crop.y * scaleY);
    const sourceWidth = Math.round(crop.width * scaleX);
    const sourceHeight = Math.round(crop.height * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Unable to process canvas crop in this browser.');
      setIsProcessing(false);
      return;
    }

    // Enable best quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Handle rotation if applied
    if (rotation !== 0) {
      // Create temporary canvas to hold rotated image
      const rotCanvas = document.createElement('canvas');
      const rotCtx = rotCanvas.getContext('2d')!;
      if (rotation === 90 || rotation === 270) {
        rotCanvas.width = naturalHeight;
        rotCanvas.height = naturalWidth;
      } else {
        rotCanvas.width = naturalWidth;
        rotCanvas.height = naturalHeight;
      }

      rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rotCtx.rotate((rotation * Math.PI) / 180);
      rotCtx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2);

      // Now crop from the rotated canvas
      ctx.drawImage(rotCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
    } else {
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
    }

    // Determine matching export format and extension
    const isPng = originalFileName.toLowerCase().endsWith('.png');
    const isWebp = originalFileName.toLowerCase().endsWith('.webp');
    const exportMime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
    const exportExt = isPng ? '.png' : isWebp ? '.webp' : '.jpg';

    // Export as format-matching Blob
    canvas.toBlob(
      (blob) => {
        setIsProcessing(false);
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          onCropComplete(blob, previewUrl, exportMime, exportExt);
        } else {
          alert('Failed to generate cropped image.');
        }
      },
      exportMime,
      exportMime === 'image/png' ? undefined : 0.92
    );
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none">
      
      {/* Top Controls Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between pb-3 border-b border-white/15 text-white">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-[#30AFFF]/20 text-[#30AFFF] flex items-center justify-center font-bold">
            <Crop className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
              Crop Announcement Photo
            </h3>
            <p className="text-[11px] text-white/60">
              Drag corners to choose the exact portion citizens will see
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          title="Cancel cropping"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Image Cropping Canvas Area */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative flex-1 w-full max-w-4xl my-3 flex items-center justify-center overflow-hidden touch-none"
      >
        <div className="relative inline-block max-h-[60vh] max-w-full">
          <img
            ref={imageRef}
            src={imageSrc}
            onLoad={handleImageLoad}
            alt="Source for crop"
            style={{
              transform: `rotate(${rotation}deg)`,
              maxHeight: '60vh',
              maxWidth: '100%',
              display: 'block',
            }}
            className="rounded-lg shadow-2xl object-contain pointer-events-none"
          />

          {/* Interactive Crop Rectangle Overlay */}
          {imageLoaded && crop.width > 0 && (
            <>
              {/* Darkened mask outside crop box */}
              <div
                className="absolute inset-0 bg-black/55 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0% 0%, 100% 0%, 100% 100%, 0% 100%,
                    0% 0%,
                    ${crop.x}px ${crop.y}px,
                    ${crop.x}px ${crop.y + crop.height}px,
                    ${crop.x + crop.width}px ${crop.y + crop.height}px,
                    ${crop.x + crop.width}px ${crop.y}px,
                    ${crop.x}px ${crop.y}px
                  )`,
                }}
              />

              {/* The Active Crop Box */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'move')}
                style={{
                  left: `${crop.x}px`,
                  top: `${crop.y}px`,
                  width: `${crop.width}px`,
                  height: `${crop.height}px`,
                }}
                className="absolute border-2 border-[#30AFFF] shadow-[0_0_0_1px_rgba(255,255,255,0.4)] cursor-move touch-none"
              >
                {/* 3x3 Rule of Thirds Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-white/60" />
                  <div className="border-r border-white/60" />
                  <div />
                </div>

                {/* Dimension Badge in Center */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono font-bold text-white pointer-events-none border border-white/20">
                  {Math.round(crop.width)} × {Math.round(crop.height)} px
                </div>

                {/* Corner Resize Handles */}
                {/* North-West Handle */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'nw')}
                  className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-[#30AFFF] rounded-full border-2 border-white shadow-md cursor-nwse-resize z-10 hover:scale-125 transition-transform"
                />
                {/* North-East Handle */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'ne')}
                  className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-[#30AFFF] rounded-full border-2 border-white shadow-md cursor-nesw-resize z-10 hover:scale-125 transition-transform"
                />
                {/* South-West Handle */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'sw')}
                  className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-[#30AFFF] rounded-full border-2 border-white shadow-md cursor-nesw-resize z-10 hover:scale-125 transition-transform"
                />
                {/* South-East Handle */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'se')}
                  className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-[#30AFFF] rounded-full border-2 border-white shadow-md cursor-nwse-resize z-10 hover:scale-125 transition-transform"
                />

                {/* Edge Center Resize Handles */}
                {/* North Handle */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'n')}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-[#30AFFF] rounded-full border border-white shadow-sm cursor-ns-resize z-10"
                />
                {/* South Handle */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 's')}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-[#30AFFF] rounded-full border border-white shadow-sm cursor-ns-resize z-10"
                />
                {/* West Handle */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'w')}
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-[#30AFFF] rounded-full border border-white shadow-sm cursor-ew-resize z-10"
                />
                {/* East Handle */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'e')}
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-[#30AFFF] rounded-full border border-white shadow-sm cursor-ew-resize z-10"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Tooling & Ratio Selection Bar */}
      <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/15 text-white">
        
        {/* Aspect Ratio Selector Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <span className="text-[11px] text-white/60 mr-1 hidden sm:inline">Ratio:</span>
          {(['16:9', '4:3', '1:1', 'free'] as AspectRatioType[]).map((type) => {
            const isSelected = aspectType === type;
            const labels: Record<AspectRatioType, string> = {
              '16:9': '16:9 (Banner)',
              '4:3': '4:3 (Standard)',
              '1:1': '1:1 (Square)',
              'free': 'Free (Custom)',
            };

            return (
              <button
                key={type}
                type="button"
                onClick={() => setAspectType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#30AFFF] text-slate-950 font-black shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                {labels[type]}
              </button>
            );
          })}

          {/* Rotate 90 deg Button */}
          <button
            type="button"
            onClick={handleRotate}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors ml-1"
            title="Rotate image 90 degrees"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span className="hidden sm:inline">Rotate 90°</span>
          </button>
        </div>

        {/* Action Buttons: Cancel vs Apply Crop */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing || !imageLoaded}
            className="px-5 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 text-xs font-black flex items-center space-x-1.5 cursor-pointer shadow-lg active:scale-98 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Cropping...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply Crop</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};

export default ImageCropModal;
