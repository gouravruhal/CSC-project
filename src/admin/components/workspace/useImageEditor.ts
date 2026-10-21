import React, { useState, useCallback, RefObject } from 'react';
import { CropPreset, SavedFileState } from './workspaceTypes';
import { useCropDrag } from './useCropDrag';

export function useImageEditor(imageRef: RefObject<HTMLImageElement | null>) {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [fineAngle, setFineAngle] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [showStraightenGrid, setShowStraightenGrid] = useState<boolean>(false);

  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [bwMode, setBwMode] = useState<boolean>(false);
  const [xeroxThreshold, setXeroxThreshold] = useState<number>(0);
  const [inverted, setInverted] = useState<boolean>(false);

  const [cropPreset, setCropPreset] = useState<CropPreset>('free');
  const [cropInsetTop, setCropInsetTop] = useState<number>(0);
  const [cropInsetBottom, setCropInsetBottom] = useState<number>(0);
  const [cropInsetLeft, setCropInsetLeft] = useState<number>(0);
  const [cropInsetRight, setCropInsetRight] = useState<number>(0);
  const [showCropGrid, setShowCropGrid] = useState<boolean>(true);
  const [cropViewMode, setCropViewMode] = useState<'adjust' | 'preview'>('adjust');

  const setInsets = useCallback((top: number, bottom: number, left: number, right: number) => {
    setCropInsetTop(top);
    setCropInsetBottom(bottom);
    setCropInsetLeft(left);
    setCropInsetRight(right);
    setCropPreset('free');
  }, []);

  const { dragHandle, handleStartCropDrag } = useCropDrag({
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
  });

  const resetAll = useCallback(() => {
    setZoom(100);
    setRotation(0);
    setFineAngle(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBwMode(false);
    setXeroxThreshold(0);
    setInverted(false);
    setCropPreset('free');
    setCropInsetTop(0);
    setCropInsetBottom(0);
    setCropInsetLeft(0);
    setCropInsetRight(0);
  }, []);

  const loadSavedState = useCallback((st: SavedFileState) => {
    setZoom(st.zoom ?? 100);
    setRotation(st.rotation ?? 0);
    setFineAngle(st.fineAngle ?? 0);
    setFlipH(st.flipH ?? false);
    setFlipV(st.flipV ?? false);
    setBrightness(st.brightness ?? 100);
    setContrast(st.contrast ?? 100);
    setSaturation(st.saturation ?? 100);
    setBwMode(st.bwMode ?? false);
    setXeroxThreshold(st.xeroxThreshold ?? 0);
    setInverted(st.inverted ?? false);
    setCropPreset(st.cropPreset ?? 'free');
    setCropInsetTop(st.cropInsetTop ?? 0);
    setCropInsetBottom(st.cropInsetBottom ?? 0);
    setCropInsetLeft(st.cropInsetLeft ?? 0);
    setCropInsetRight(st.cropInsetRight ?? 0);
  }, []);

  const getCurrentState = useCallback((): SavedFileState => ({
    zoom,
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
    cropPreset,
    cropInsetTop,
    cropInsetBottom,
    cropInsetLeft,
    cropInsetRight,
    savedAt: new Date().toISOString(),
  }), [zoom, rotation, fineAngle, flipH, flipV, brightness, contrast, saturation, bwMode, xeroxThreshold, inverted, cropPreset, cropInsetTop, cropInsetBottom, cropInsetLeft, cropInsetRight]);

  const previewFilter = bwMode
    ? `grayscale(100%) contrast(${160 + xeroxThreshold}%) brightness(${brightness}%)`
    : [
        brightness !== 100 ? `brightness(${brightness}%)` : '',
        contrast !== 100 ? `contrast(${contrast}%)` : '',
        saturation !== 100 ? `saturate(${saturation}%)` : '',
        inverted ? 'invert(100%)' : '',
      ].filter(Boolean).join(' ') || 'none';

  return {
    zoom, setZoom,
    rotation, setRotation,
    fineAngle, setFineAngle,
    flipH, setFlipH,
    flipV, setFlipV,
    showStraightenGrid, setShowStraightenGrid,
    brightness, setBrightness,
    contrast, setContrast,
    saturation, setSaturation,
    bwMode, setBwMode,
    xeroxThreshold, setXeroxThreshold,
    inverted, setInverted,
    cropPreset, setCropPreset,
    cropInsetTop, setCropInsetTop,
    cropInsetBottom, setCropInsetBottom,
    cropInsetLeft, setCropInsetLeft,
    cropInsetRight, setCropInsetRight,
    showCropGrid, setShowCropGrid,
    cropViewMode, setCropViewMode,
    dragHandle, handleStartCropDrag,
    previewFilter,
    resetAll,
    loadSavedState,
    getCurrentState,
  };
}
