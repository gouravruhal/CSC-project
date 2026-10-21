import { Submission, Language } from '../../../types';

export type ImageToolTab = 'crop' | 'orient' | 'enhance' | 'compress' | 'export';
export type PdfToolTab = 'merge' | 'split' | 'rotate' | 'watermark' | 'pagenumbers' | 'compress';
export type CropPreset = 'free' | 'a4' | 'passport' | 'aadhaar' | 'pancard' | 'square';

export interface SavedFileState {
  zoom: number;
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
  cropPreset: CropPreset;
  cropInsetTop: number;
  cropInsetBottom: number;
  cropInsetLeft: number;
  cropInsetRight: number;
  savedAt?: string;
}

export interface WorkspaceFile {
  id: string;
  original_name: string;
  mime_type: string;
  file_path: string;
  size: number;
}

export interface OperatorWorkspaceProps {
  submissionId: string;
  adminToken: string;
  onBack: () => void;
  language: Language;
}

export type WordRibbonTab = 'home' | 'layout' | 'review';
export type SpreadsheetRibbonTab = 'home' | 'formulas' | 'data';

export interface ModifiedPdfState {
  blobUrl: string;
  bytes: Uint8Array;
  fileName: string;
  hasUnsavedChanges: boolean;
  timestamp: number;
}
