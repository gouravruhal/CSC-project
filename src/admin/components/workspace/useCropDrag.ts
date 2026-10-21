import React, { useState, useRef, useEffect, RefObject } from 'react';

interface UseCropDragParams {
  zoom: number;
  rotation: number;
  fineAngle: number;
  flipH: boolean;
  flipV: boolean;
  cropInsetTop: number;
  cropInsetBottom: number;
  cropInsetLeft: number;
  cropInsetRight: number;
  imageRef: RefObject<HTMLImageElement | null>;
  setInsets: (top: number, bottom: number, left: number, right: number) => void;
}

export function useCropDrag({
  zoom,
  rotation,
  fineAngle,
  flipH,
  flipV,
  cropInsetTop,
  cropInsetBottom,
  cropInsetLeft,
  cropInsetRight,
  imageRef,
  setInsets,
}: UseCropDragParams) {
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initTop: number;
    initBottom: number;
    initLeft: number;
    initRight: number;
  } | null>(null);

  const handleStartCropDrag = (clientX: number, clientY: number, handle: string) => {
    setDragHandle(handle);
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initTop: cropInsetTop,
      initBottom: cropInsetBottom,
      initLeft: cropInsetLeft,
      initRight: cropInsetRight,
    };
  };

  useEffect(() => {
    if (!dragHandle) return;

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!dragStartRef.current || !imageRef.current) return;
      const { startX, startY, initTop, initBottom, initLeft, initRight } = dragStartRef.current;
      const scale = (zoom || 100) / 100;
      const screenDx = (clientX - startX) / scale;
      const screenDy = (clientY - startY) / scale;

      const rad = ((rotation + fineAngle) * Math.PI) / 180;
      let localDx = screenDx * Math.cos(rad) + screenDy * Math.sin(rad);
      let localDy = -screenDx * Math.sin(rad) + screenDy * Math.cos(rad);
      if (flipH) localDx = -localDx;
      if (flipV) localDy = -localDy;

      const imgW = imageRef.current.offsetWidth || 1;
      const imgH = imageRef.current.offsetHeight || 1;
      const dPctX = (localDx / imgW) * 100;
      const dPctY = (localDy / imgH) * 100;

      let newTop = initTop;
      let newBottom = initBottom;
      let newLeft = initLeft;
      let newRight = initRight;

      if (['top', 'tl', 'tr'].includes(dragHandle)) {
        newTop = Math.max(0, Math.min(45, Math.round(initTop + dPctY)));
        if (newTop + newBottom > 92) newTop = 92 - newBottom;
      }
      if (['bottom', 'bl', 'br'].includes(dragHandle)) {
        newBottom = Math.max(0, Math.min(45, Math.round(initBottom - dPctY)));
        if (newTop + newBottom > 92) newBottom = 92 - newTop;
      }
      if (['left', 'tl', 'bl'].includes(dragHandle)) {
        newLeft = Math.max(0, Math.min(45, Math.round(initLeft + dPctX)));
        if (newLeft + newRight > 92) newLeft = 92 - newRight;
      }
      if (['right', 'tr', 'br'].includes(dragHandle)) {
        newRight = Math.max(0, Math.min(45, Math.round(initRight - dPctX)));
        if (newLeft + newRight > 92) newRight = 92 - newLeft;
      }
      if (dragHandle === 'move') {
        const widthPct = 100 - initLeft - initRight;
        const heightPct = 100 - initTop - initBottom;
        const candLeft = Math.max(0, Math.min(100 - widthPct, initLeft + dPctX));
        const candTop = Math.max(0, Math.min(100 - heightPct, initTop + dPctY));
        newLeft = Math.round(candLeft);
        newRight = Math.round(100 - candLeft - widthPct);
        newTop = Math.round(candTop);
        newBottom = Math.round(100 - candTop - heightPct);
      }

      setInsets(newTop, newBottom, newLeft, newRight);
    };

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onPointerEnd = () => {
      setDragHandle(null);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onPointerEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onPointerEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onPointerEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onPointerEnd);
    };
  }, [dragHandle, zoom, rotation, fineAngle, flipH, flipV]);

  return { dragHandle, handleStartCropDrag };
}
