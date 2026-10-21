import React from 'react';
import { ImageToolTab } from './workspaceTypes';
import { ImageToolsBar } from './ImageToolsBar';
import { CropToolPanel } from './CropToolPanel';
import { RotateToolPanel } from './RotateToolPanel';
import { XeroxToolPanel } from './XeroxToolPanel';
import { CompressToolPanel } from './CompressToolPanel';
import { ExportToolPanel } from './ExportToolPanel';

interface ImageToolsDeckProps {
  imageTab: ImageToolTab;
  setImageTab: (t: ImageToolTab) => void;
  imageEditor: any;
  targetKb: number;
  setTargetKb: (kb: number) => void;
  customKbInput: string;
  setCustomKbInput: (val: string) => void;
  onDownloadImage: (format: 'jpeg' | 'png') => void;
  onConvertImageToPdf: () => void;
  onCompressImage: (target: number) => void;
  onPrintCompressedImage?: (target: number, mode: any) => void;
  onPrint: () => void;
}

export const ImageToolsDeck: React.FC<ImageToolsDeckProps> = ({
  imageTab,
  setImageTab,
  imageEditor,
  targetKb,
  setTargetKb,
  customKbInput,
  setCustomKbInput,
  onDownloadImage,
  onConvertImageToPdf,
  onCompressImage,
  onPrintCompressedImage,
  onPrint,
}) => {
  return (
    <>
      <ImageToolsBar activeTab={imageTab} onChangeTab={setImageTab} />
      {imageTab === 'crop' && (
        <CropToolPanel
          cropPreset={imageEditor.cropPreset}
          cropViewMode={imageEditor.cropViewMode}
          showCropGrid={imageEditor.showCropGrid}
          onSetCropPreset={imageEditor.setCropPreset}
          onSetCropViewMode={imageEditor.setCropViewMode}
          onToggleCropGrid={() => imageEditor.setShowCropGrid(!imageEditor.showCropGrid)}
          onSetQuickTrim={(pct) => {
            imageEditor.setCropInsetTop(pct);
            imageEditor.setCropInsetBottom(pct);
            imageEditor.setCropInsetLeft(pct);
            imageEditor.setCropInsetRight(pct);
          }}
          onResetCrop={() => {
            imageEditor.setCropInsetTop(0);
            imageEditor.setCropInsetBottom(0);
            imageEditor.setCropInsetLeft(0);
            imageEditor.setCropInsetRight(0);
          }}
        />
      )}
      {imageTab === 'orient' && (
        <RotateToolPanel
          rotation={imageEditor.rotation}
          fineAngle={imageEditor.fineAngle}
          flipH={imageEditor.flipH}
          flipV={imageEditor.flipV}
          showStraightenGrid={imageEditor.showStraightenGrid}
          onRotateStep={(deg) => imageEditor.setRotation((r: number) => (r + deg) % 360)}
          onSetFineAngle={imageEditor.setFineAngle}
          onToggleFlipH={() => imageEditor.setFlipH(!imageEditor.flipH)}
          onToggleFlipV={() => imageEditor.setFlipV(!imageEditor.flipV)}
          onToggleStraightenGrid={() => imageEditor.setShowStraightenGrid(!imageEditor.showStraightenGrid)}
          onResetOrientation={() => {
            imageEditor.setRotation(0);
            imageEditor.setFineAngle(0);
            imageEditor.setFlipH(false);
            imageEditor.setFlipV(false);
          }}
        />
      )}
      {imageTab === 'enhance' && (
        <XeroxToolPanel
          bwMode={imageEditor.bwMode}
          inverted={imageEditor.inverted}
          brightness={imageEditor.brightness}
          contrast={imageEditor.contrast}
          saturation={imageEditor.saturation}
          xeroxThreshold={imageEditor.xeroxThreshold}
          onToggleBwMode={() => imageEditor.setBwMode(!imageEditor.bwMode)}
          onToggleInvert={() => imageEditor.setInverted(!imageEditor.inverted)}
          onAutoClean={() => {
            imageEditor.setBrightness(115);
            imageEditor.setContrast(125);
            imageEditor.setSaturation(105);
          }}
          onResetEnhance={() => {
            imageEditor.setBwMode(false);
            imageEditor.setBrightness(100);
            imageEditor.setContrast(100);
            imageEditor.setSaturation(100);
            imageEditor.setXeroxThreshold(0);
            imageEditor.setInverted(false);
          }}
          onSetBrightness={imageEditor.setBrightness}
          onSetContrast={imageEditor.setContrast}
          onSetSaturation={imageEditor.setSaturation}
          onSetXeroxThreshold={imageEditor.setXeroxThreshold}
        />
      )}
      {imageTab === 'compress' && (
        <CompressToolPanel
          targetKb={targetKb}
          customKbInput={customKbInput}
          isProcessing={false}
          onSelectPresetKb={(kb) => {
            setTargetKb(kb);
            setCustomKbInput(String(kb));
            onCompressImage(kb);
          }}
          onChangeCustomKbInput={setCustomKbInput}
          onExecuteCompress={onCompressImage}
          onPrintCompressed={onPrintCompressedImage}
        />
      )}
      {imageTab === 'export' && (
        <ExportToolPanel
          isProcessing={false}
          onDownloadJpg={() => onDownloadImage('jpeg')}
          onDownloadPng={() => onDownloadImage('png')}
          onConvertToPdf={onConvertImageToPdf}
          onPrint={onPrint}
        />
      )}
    </>
  );
};
