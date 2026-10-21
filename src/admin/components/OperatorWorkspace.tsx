import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Printer, 
  RotateCw, 
  RotateCcw, 
  Sun, 
  Contrast, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  ShieldCheck, 
  Layers, 
  Copy, 
  Clock,
  User,
  RefreshCcw,
  CheckCircle2,
  Save,
  FileType,
  HardDrive,
  Crop,
  Scissors,
  Grid3X3,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Download,
  Sparkles,
  Files,
  Split,
  Gauge,
  X,
  Maximize2,
  Check,
  FileDown
} from 'lucide-react';
import { Submission, Language } from '../../types';
import { authFetch } from '../../lib/apiCache';
import { 
  downloadFile, 
  convertImageToPdf, 
  mergeDocuments, 
  splitPdfPages, 
  compressCanvasToTargetKb 
} from '../../lib/pdfTools';

interface OperatorWorkspaceProps {
  submissionId: string;
  adminToken: string;
  onBack: () => void;
  language: Language;
}

type ToolTab = 'crop' | 'orient' | 'enhance' | 'pdf' | 'compress' | 'export';
type CropPreset = 'free' | 'a4' | 'passport' | 'aadhaar' | 'pancard' | 'square';

interface SavedFileState {
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

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getDocumentType = (file: { original_name?: string; mime_type?: string }): string => {
  const mime = (file.mime_type || '').toLowerCase();
  const ext = (file.original_name || '').split('.').pop()?.toUpperCase() || '';

  if (mime.includes('pdf') || ext === 'PDF') return 'PDF Document';
  if (mime.includes('jpeg') || mime.includes('jpg') || ext === 'JPG' || ext === 'JPEG') return 'JPG Image';
  if (mime.includes('png') || ext === 'PNG') return 'PNG Image';
  if (mime.includes('webp') || ext === 'WEBP') return 'WebP Image';
  if (mime.startsWith('image/')) return 'Image File';
  if (ext) return `${ext} Document`;
  return 'Document';
};

export const OperatorWorkspace: React.FC<OperatorWorkspaceProps> = ({
  submissionId,
  adminToken,
  onBack,
  language,
}) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [activeFileId, setActiveFileId] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Per-file state memory cache
  const [savedFileStates, setSavedFileStates] = useState<Record<string, SavedFileState>>({});

  // Active Tool Category
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>('crop');

  // Studio Display State
  const [zoom, setZoom] = useState<number>(100);

  // 1. Crop & Frame State (Phone editor style)
  const [cropPreset, setCropPreset] = useState<CropPreset>('free');
  const [cropInsetTop, setCropInsetTop] = useState<number>(0);
  const [cropInsetBottom, setCropInsetBottom] = useState<number>(0);
  const [cropInsetLeft, setCropInsetLeft] = useState<number>(0);
  const [cropInsetRight, setCropInsetRight] = useState<number>(0);
  const [showCropGrid, setShowCropGrid] = useState<boolean>(true);
  const [cropViewMode, setCropViewMode] = useState<'adjust' | 'preview'>('adjust');
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initTop: number;
    initBottom: number;
    initLeft: number;
    initRight: number;
  } | null>(null);

  // 2. Rotate & Orient in Every Direction State
  const [rotation, setRotation] = useState<number>(0);
  const [fineAngle, setFineAngle] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [showStraightenGrid, setShowStraightenGrid] = useState<boolean>(false);

  // 3. Xerox & Image Quality State
  const [bwMode, setBwMode] = useState<boolean>(false);
  const [xeroxThreshold, setXeroxThreshold] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [inverted, setInverted] = useState<boolean>(false);

  // 4. PDF Suite State (Merge & Split Modals)
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [mergeSelectedFiles, setMergeSelectedFiles] = useState<string[]>([]);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [splitPageRange, setSplitPageRange] = useState<string>('1');

  // 5. Target KB Compressor State
  const [targetKb, setTargetKb] = useState<number>(200);
  const [customKbInput, setCustomKbInput] = useState<string>('200');

  const printAreaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  useEffect(() => {
    fetchSubmissionDetails();
  }, [submissionId]);

  useEffect(() => {
    if (activeFileId && savedFileStates[activeFileId]) {
      const st = savedFileStates[activeFileId];
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
      if (st.savedAt) {
        try {
          const d = new Date(st.savedAt);
          setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch {}
      }
    } else {
      resetEditor();
    }
  }, [activeFileId]);

  const fetchSubmissionDetails = async () => {
    setLoading(true);
    setError('');

    try {
      let targetId = submissionId;
      if (!targetId) {
        const listRes = await authFetch('/api/admin/submissions');
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.submissions && listData.submissions.length > 0) {
            targetId = listData.submissions[0].id;
          }
        }
      }

      if (!targetId) {
        setError('No customer submissions available in queue.');
        return;
      }

      const res = await authFetch(`/api/admin/submissions/${targetId}`);
      if (res.status === 401) return;

      if (res.ok) {
        const data = await res.json();
        setSubmission(data.submission);

        // Restore Workspace Edit States: Server DB first, fallback to browser LocalStorage
        let states: Record<string, SavedFileState> = {};
        if (data.submission.workspace_state && typeof data.submission.workspace_state === 'object') {
          states = data.submission.workspace_state;
        } else {
          try {
            const cached = localStorage.getItem(`atalseva_workspace_state_${targetId}`);
            if (cached) {
              states = JSON.parse(cached);
            }
          } catch {}
        }
        setSavedFileStates(states);

        if (data.submission.files && data.submission.files.length > 0) {
          const firstId = data.submission.files[0].id || data.submission.files[0].filename;
          setActiveFileId(firstId);
          setMergeSelectedFiles(data.submission.files.map((f: any) => f.id || f.filename));

          // Immediately hydrate initial active file if saved state exists
          if (states[firstId]) {
            const st = states[firstId];
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
            if (st.savedAt) {
              try {
                const d = new Date(st.savedAt);
                setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              } catch {}
            }
          }
        }
      } else {
        setError(`Submission record ${targetId} not found in database.`);
      }
    } catch (e: any) {
      console.error('Failed to load submission details:', e);
      setError(`Failed to load submission details from server.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(submissionId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Determine if active document currently has unsaved modifications
  const activeSavedState = activeFileId ? savedFileStates[activeFileId] : undefined;
  const hasUnsavedChanges = Boolean(
    activeSavedState
      ? (
          rotation !== (activeSavedState.rotation ?? 0) ||
          fineAngle !== (activeSavedState.fineAngle ?? 0) ||
          flipH !== (activeSavedState.flipH ?? false) ||
          flipV !== (activeSavedState.flipV ?? false) ||
          brightness !== (activeSavedState.brightness ?? 100) ||
          contrast !== (activeSavedState.contrast ?? 100) ||
          saturation !== (activeSavedState.saturation ?? 100) ||
          bwMode !== (activeSavedState.bwMode ?? false) ||
          xeroxThreshold !== (activeSavedState.xeroxThreshold ?? 0) ||
          inverted !== (activeSavedState.inverted ?? false) ||
          cropInsetTop !== (activeSavedState.cropInsetTop ?? 0) ||
          cropInsetBottom !== (activeSavedState.cropInsetBottom ?? 0) ||
          cropInsetLeft !== (activeSavedState.cropInsetLeft ?? 0) ||
          cropInsetRight !== (activeSavedState.cropInsetRight ?? 0)
        )
      : (
          rotation !== 0 ||
          fineAngle !== 0 ||
          flipH ||
          flipV ||
          brightness !== 100 ||
          contrast !== 100 ||
          saturation !== 100 ||
          bwMode ||
          xeroxThreshold !== 0 ||
          inverted ||
          cropInsetTop !== 0 ||
          cropInsetBottom !== 0 ||
          cropInsetLeft !== 0 ||
          cropInsetRight !== 0
        )
  );

  // Professional Multi-Tier State Saver (React Memory + LocalStorage + Backend Database)
  const handleSaveState = async () => {
    if (!activeFileId || !submission) return;
    setIsSaving(true);

    const nowIso = new Date().toISOString();
    const nowReadable = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const currentDocState: SavedFileState = {
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
      savedAt: nowIso,
    };

    const nextStates: Record<string, SavedFileState> = {
      ...savedFileStates,
      [activeFileId]: currentDocState,
    };

    // 1. Instant local state update
    setSavedFileStates(nextStates);

    // 2. Browser LocalStorage backup
    try {
      localStorage.setItem(`atalseva_workspace_state_${submission.id}`, JSON.stringify(nextStates));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    // 3. Persistent sync to backend server database
    try {
      const res = await authFetch(`/api/admin/submissions/${submission.id}/workspace-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceState: nextStates }),
      });

      if (res.ok) {
        setLastSavedTime(nowReadable);
        setSavedNotice(true);
        showToast(`✓ State permanently saved to database (${nowReadable})`);
      } else {
        setLastSavedTime(nowReadable);
        setSavedNotice(true);
        showToast('Saved to browser storage');
      }
    } catch (err) {
      console.error('Server sync failed, persisted locally:', err);
      setLastSavedTime(nowReadable);
      setSavedNotice(true);
      showToast('Saved to browser storage');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSavedNotice(false), 2400);
    }
  };

  // Revert active document to original unedited state
  const handleRevertToOriginal = async () => {
    if (!activeFileId || !submission) return;
    resetEditor();

    const nextStates = { ...savedFileStates };
    delete nextStates[activeFileId];
    setSavedFileStates(nextStates);

    try {
      localStorage.setItem(`atalseva_workspace_state_${submission.id}`, JSON.stringify(nextStates));
      await authFetch(`/api/admin/submissions/${submission.id}/workspace-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceState: nextStates }),
      });
    } catch {}

    setLastSavedTime('');
    showToast(`Reverted ${activeFile?.original_name || 'document'} to original state`);
  };

  // Professional Keyboard Shortcut: Ctrl+S / Cmd+S to Save State
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveState();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeFileId,
    submission,
    savedFileStates,
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
  ]);

  const resetEditor = () => {
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
  };

  // Compute true geometric centered crop insets for natural image aspect ratios
  const computeCenteredRatio = (targetRatio: number) => {
    const img = imageRef.current;
    const natW = img?.naturalWidth || img?.offsetWidth || 1000;
    const natH = img?.naturalHeight || img?.offsetHeight || 1000;
    const imgRatio = natW / natH;

    let newTop = 5;
    let newBottom = 5;
    let newLeft = 5;
    let newRight = 5;

    if (imgRatio > targetRatio) {
      // Image is wider than target ratio: crop left and right
      const targetHeightPct = 90;
      newTop = 5;
      newBottom = 5;
      const targetWidthPx = (natH * (targetHeightPct / 100)) * targetRatio;
      const targetWidthPct = (targetWidthPx / natW) * 100;
      const remainingWidthPct = Math.max(0, 100 - targetWidthPct);
      newLeft = Math.round((remainingWidthPct / 2) * 10) / 10;
      newRight = newLeft;
    } else {
      // Image is taller than target ratio: crop top and bottom
      const targetWidthPct = 90;
      newLeft = 5;
      newRight = 5;
      const targetHeightPx = (natW * (targetWidthPct / 100)) / targetRatio;
      const targetHeightPct = (targetHeightPx / natH) * 100;
      const remainingHeightPct = Math.max(0, 100 - targetHeightPct);
      newTop = Math.round((remainingHeightPct / 2) * 10) / 10;
      newBottom = newTop;
    }

    setCropInsetTop(Math.max(0, Math.min(45, newTop)));
    setCropInsetBottom(Math.max(0, Math.min(45, newBottom)));
    setCropInsetLeft(Math.max(0, Math.min(45, newLeft)));
    setCropInsetRight(Math.max(0, Math.min(45, newRight)));
  };

  // Crop Preset handler with true geometric ratios
  const handleApplyCropPreset = (preset: CropPreset) => {
    setCropPreset(preset);
    switch (preset) {
      case 'free':
        break;
      case 'a4':
        // Standard A4 aspect (1 : 1.4142 = 0.7071)
        computeCenteredRatio(0.7071);
        break;
      case 'passport':
        // Passport photo 3.5 x 4.5 cm (0.7778)
        computeCenteredRatio(0.7778);
        break;
      case 'aadhaar':
        // Aadhaar / Voter ID (8.6 x 5.4 cm = 1.5926)
        computeCenteredRatio(1.5926);
        break;
      case 'pancard':
        // PAN Card (8.5 x 5.5 cm = 1.5455)
        computeCenteredRatio(1.5455);
        break;
      case 'square':
        // 1:1 Square
        computeCenteredRatio(1.0);
        break;
    }
  };

  // Start dragging a crop handle or repositioning the crop window
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

  // Window pointer listeners for smooth, responsive drag handling
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

      if (dragHandle === 'top' || dragHandle === 'tl' || dragHandle === 'tr') {
        newTop = Math.max(0, Math.min(45, Math.round(initTop + dPctY)));
        if (newTop + newBottom > 92) newTop = 92 - newBottom;
      }
      if (dragHandle === 'bottom' || dragHandle === 'bl' || dragHandle === 'br') {
        newBottom = Math.max(0, Math.min(45, Math.round(initBottom - dPctY)));
        if (newTop + newBottom > 92) newBottom = 92 - newTop;
      }
      if (dragHandle === 'left' || dragHandle === 'tl' || dragHandle === 'bl') {
        newLeft = Math.max(0, Math.min(45, Math.round(initLeft + dPctX)));
        if (newLeft + newRight > 92) newLeft = 92 - newRight;
      }
      if (dragHandle === 'right' || dragHandle === 'tr' || dragHandle === 'br') {
        newRight = Math.max(0, Math.min(45, Math.round(initRight - dPctX)));
        if (newLeft + newRight > 92) newRight = 92 - newLeft;
      }
      if (dragHandle === 'move') {
        const widthPct = 100 - initLeft - initRight;
        const heightPct = 100 - initTop - initBottom;

        let candidateLeft = initLeft + dPctX;
        let candidateTop = initTop + dPctY;

        candidateLeft = Math.max(0, Math.min(100 - widthPct, candidateLeft));
        candidateTop = Math.max(0, Math.min(100 - heightPct, candidateTop));

        newLeft = Math.round(candidateLeft);
        newRight = Math.round(100 - candidateLeft - widthPct);
        newTop = Math.round(candidateTop);
        newBottom = Math.round(100 - candidateTop - heightPct);
      }

      setCropInsetTop(newTop);
      setCropInsetBottom(newBottom);
      setCropInsetLeft(newLeft);
      setCropInsetRight(newRight);
      setCropPreset('free');
    };

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onPointerEnd = () => {
      setDragHandle(null);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onPointerEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onPointerEnd);
    window.addEventListener('touchcancel', onPointerEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onPointerEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onPointerEnd);
      window.removeEventListener('touchcancel', onPointerEnd);
    };
  }, [dragHandle, zoom, rotation, fineAngle, flipH, flipV]);

  // Auto clean document (Removes camera phone dark shadows and boosts contrast)
  const handleAutoCleanDocument = () => {
    setBwMode(false);
    setBrightness(115);
    setContrast(140);
    setSaturation(85);
    setInverted(false);
    showToast('Applied Magic Auto-Clean Document Filter');
  };

  const activeFile = submission?.files.find(f => (f.id || f.filename) === activeFileId) || submission?.files[0];
  const fileViewUrl = submission && activeFile ? `/api/admin/view/${submission.id}/${activeFile?.id || activeFile?.filename}` : '';
  const isImage = activeFile?.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(activeFile?.original_name || '');

  // Render high-res offscreen canvas with crops, transforms, and filters
  const getRenderedCanvas = async (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      if (!isImage || !fileViewUrl) {
        reject(new Error('Active document is not an image'));
        return;
      }

      const processImage = (img: HTMLImageElement) => {
        try {
          const natW = img.naturalWidth || img.width;
          const natH = img.naturalHeight || img.height;

          // Crop pixel coordinates
          const clipX = (cropInsetLeft / 100) * natW;
          const clipY = (cropInsetTop / 100) * natH;
          const clipW = Math.max(10, natW * (1 - (cropInsetLeft + cropInsetRight) / 100));
          const clipH = Math.max(10, natH * (1 - (cropInsetTop + cropInsetBottom) / 100));

          // Total rotation angle in radians
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
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          // Fill background with white paper
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Enable high-quality smoothing for sharp text during rotation & deskew
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Apply filters
          let filterStr = '';
          if (bwMode) {
            filterStr = `grayscale(100%) contrast(${160 + xeroxThreshold}%) brightness(${brightness}%)`;
          } else {
            const filters: string[] = [];
            if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
            if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
            if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
            if (inverted) filters.push(`invert(100%)`);
            filterStr = filters.join(' ') || 'none';
          }
          ctx.filter = filterStr;

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(rad);
          ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
          ctx.drawImage(img, clipX, clipY, clipW, clipH, -clipW / 2, -clipH / 2, clipW, clipH);
          ctx.restore();

          resolve(canvas);
        } catch (err) {
          reject(err);
        }
      };

      // Fast-path: If image is already rendered on the page, use it directly (0ms latency)
      if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
        processImage(imageRef.current);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => processImage(img);
        img.onerror = () => reject(new Error('Failed to load image for processing'));
        img.src = fileViewUrl;
      }
    });
  };

  // Convert currently edited document to A4 PDF
  const handleConvertToPdf = async () => {
    try {
      setIsProcessing(true);
      showToast('Converting document to professional A4 PDF...');

      if (isImage) {
        const canvas = await getRenderedCanvas();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const pdfBytes = await convertImageToPdf(dataUrl, `${activeFile?.original_name || 'document'}.pdf`);
        downloadFile(pdfBytes, `${submission?.name || 'Customer'}_A4_Print_${Date.now()}.pdf`, 'application/pdf');
        showToast('A4 PDF generated & downloaded successfully!');
      } else {
        // Direct download of PDF
        const a = document.createElement('a');
        a.href = fileViewUrl;
        a.download = activeFile?.original_name || 'document.pdf';
        a.click();
        showToast('PDF downloaded successfully!');
      }
    } catch (err: any) {
      console.error('PDF Conversion error:', err);
      showToast('Failed to convert to PDF: ' + (err.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Merge selected documents into a single consolidated PDF
  const handleMergeDocuments = async () => {
    try {
      if (!submission || mergeSelectedFiles.length === 0) {
        showToast('Please select at least 1 file to merge');
        return;
      }
      setIsProcessing(true);
      showToast('Merging selected documents into single consolidated PDF...');

      const filesToMerge = submission.files
        .filter(f => mergeSelectedFiles.includes(f.id || f.filename))
        .map(f => ({
          url: `/api/admin/view/${submission.id}/${f.id || f.filename}`,
          isImage: f.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(f.original_name || ''),
          name: f.original_name || 'file'
        }));

      const mergedPdfBytes = await mergeDocuments(filesToMerge);
      downloadFile(mergedPdfBytes, `${submission.name}_Consolidated_Document_${Date.now()}.pdf`, 'application/pdf');
      setIsMergeModalOpen(false);
      showToast(`Merged ${filesToMerge.length} documents into one PDF!`);
    } catch (err: any) {
      console.error('Merge error:', err);
      showToast('Failed to merge documents: ' + (err.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Split PDF pages
  const handleSplitPdf = async () => {
    try {
      if (!splitPageRange.trim()) {
        showToast('Please enter page numbers to extract (e.g. 1, 2-3)');
        return;
      }
      setIsProcessing(true);
      showToast('Extracting selected pages from PDF...');

      const pages: number[] = [];
      const parts = splitPageRange.split(',').map(p => p.trim());
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
              if (p > 0) pages.push(p - 1);
            }
          }
        } else {
          const p = parseInt(part, 10);
          if (!isNaN(p) && p > 0) pages.push(p - 1);
        }
      }

      const uniquePages = Array.from(new Set(pages));
      if (uniquePages.length === 0) {
        showToast('No valid pages entered');
        setIsProcessing(false);
        return;
      }

      const splitPdfBytes = await splitPdfPages(fileViewUrl, uniquePages);
      downloadFile(splitPdfBytes, `${activeFile?.original_name || 'document'}_pages_${splitPageRange.replace(/[\s,]+/g, '_')}.pdf`, 'application/pdf');
      setIsSplitModalOpen(false);
      showToast(`Extracted pages ${splitPageRange} downloaded!`);
    } catch (err: any) {
      console.error('Split error:', err);
      showToast('Failed to split PDF: ' + (err.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Compress to target KB for Govt Portals
  const handleCompressTargetKb = async (targetLimitKb: number) => {
    try {
      if (!isImage) {
        showToast('KB compressor applies to image files');
        return;
      }
      setIsProcessing(true);
      showToast(`Compressing document under ${targetLimitKb} KB...`);

      const canvas = await getRenderedCanvas();
      const { blob, finalKb } = await compressCanvasToTargetKb(canvas, targetLimitKb);
      downloadFile(blob, `${submission?.name || 'Customer'}_${finalKb}KB_compressed.jpg`, 'image/jpeg');
      showToast(`Compressed to ${finalKb} KB (under ${targetLimitKb} KB govt limit)!`);
    } catch (err: any) {
      console.error('Compression error:', err);
      showToast('Compression failed: ' + (err.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Download High-Res Edited Image
  const handleDownloadImage = async (format: 'jpeg' | 'png') => {
    try {
      if (!isImage) {
        showToast('Active document is already a PDF');
        return;
      }
      setIsProcessing(true);
      showToast(`Exporting High-Res ${format.toUpperCase()}...`);

      const canvas = await getRenderedCanvas();
      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mime, 0.95);
      downloadFile(dataUrl, `${submission?.name || 'Customer'}_Edited_${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`, mime);
      showToast(`Downloaded High-Res ${format.toUpperCase()}!`);
    } catch (err: any) {
      console.error('Download error:', err);
      showToast('Download failed: ' + (err.message || 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Print High-Res Canvas: Passes all crops, rotations, flips & Xerox photocopy filters
  const handlePrintCanvas = async () => {
    try {
      showToast('Preparing document for high-res print...');

      if (isImage) {
        // 1. Render high-res canvas with ALL edits applied (crop, rotation, deskew, mirror flips, B/W Xerox, etc.)
        const canvas = await getRenderedCanvas();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.98);

        // Determine orientation
        const isLandscape = canvas.width > canvas.height;

        // 2. Remove any previous print iframe
        const prevFrame = document.getElementById('csc-print-iframe');
        if (prevFrame) prevFrame.remove();

        // 3. Create isolated hidden print iframe
        const printFrame = document.createElement('iframe');
        printFrame.id = 'csc-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.style.opacity = '0';
        printFrame.style.pointerEvents = 'none';
        document.body.appendChild(printFrame);

        const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
        if (!frameDoc) throw new Error('Could not access print frame document');

        const printHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Print - ${activeFile?.original_name || 'Document'}</title>
              <style>
                @page {
                  size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
                  margin: 6mm;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  width: 100%;
                  height: 100%;
                  background: #FFFFFF !important;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  overflow: hidden;
                }
                img {
                  max-width: 100%;
                  max-height: 100%;
                  width: auto;
                  height: auto;
                  object-fit: contain;
                  display: block;
                  margin: auto;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              </style>
            </head>
            <body>
              <img id="print-doc-img" src="${dataUrl}" alt="Document" />
            </body>
          </html>
        `;

        frameDoc.open();
        frameDoc.write(printHtml);
        frameDoc.close();

        const printImg = frameDoc.getElementById('print-doc-img') as HTMLImageElement;
        const doPrint = () => {
          setTimeout(() => {
            try {
              printFrame.contentWindow?.focus();
              printFrame.contentWindow?.print();
            } catch (err) {
              console.error('Print trigger error:', err);
            }
            setTimeout(() => {
              try { printFrame.remove(); } catch {}
            }, 3000);
          }, 150);
        };

        if (printImg && !printImg.complete) {
          printImg.onload = doPrint;
        } else {
          doPrint();
        }
      } else {
        // Native PDF documents: print via isolated iframe
        const prevFrame = document.getElementById('csc-print-iframe');
        if (prevFrame) prevFrame.remove();

        const printFrame = document.createElement('iframe');
        printFrame.id = 'csc-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.style.opacity = '0';
        printFrame.style.pointerEvents = 'none';
        printFrame.src = fileViewUrl;
        document.body.appendChild(printFrame);

        printFrame.onload = () => {
          setTimeout(() => {
            try {
              printFrame.contentWindow?.focus();
              printFrame.contentWindow?.print();
            } catch {
              window.open(fileViewUrl, '_blank');
            }
            setTimeout(() => {
              try { printFrame.remove(); } catch {}
            }, 3000);
          }, 250);
        };
      }
    } catch (err: any) {
      console.error('Print error:', err);
      showToast('Print failed: ' + (err.message || 'Error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 text-xs font-bold text-[var(--color-muted-text)]">
        Opening Operator Studio Workspace...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-6 space-y-4">
        <button onClick={onBack} className="flex items-center space-x-2 text-xs font-bold text-[var(--color-text)]">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <div className="container-box p-8 text-center text-red-500 font-bold text-sm">
          {error || `Submission record not found (${submissionId}).`}
        </div>
      </div>
    );
  }

  // Live CSS Filter String for studio preview
  const previewFilter = bwMode
    ? `grayscale(100%) contrast(${160 + xeroxThreshold}%) brightness(${brightness}%)`
    : `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${inverted ? 'invert(100%)' : ''}`;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-primary)] text-[var(--color-text)] flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/95 border border-[#30AFFF]/50 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#30AFFF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main 3-Zone Layout */}
      <div className="flex-1 w-full max-w-[1850px] mx-auto p-2.5 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-3.5 lg:gap-4.5 items-start">
        
        {/* =========================================================================
            ZONE 1. LEFT PANEL: Customer Profile, Actions & Attached Documents List
        ========================================================================= */}
        <div className="w-full lg:w-76 xl:w-84 shrink-0 space-y-3 print:hidden">
          
          {/* Customer Profile & Quick Action Card */}
          <div className="container-box p-3.5 rounded-2xl space-y-3 shadow-2xs border border-[var(--color-border)]">
            {/* Top row: Back button & Order ID badge */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={onBack}
                title="Back to Document Queue"
                className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:bg-[var(--bg-card)] hover:border-[#30AFFF] text-[var(--color-text)] cursor-pointer transition-colors flex items-center space-x-1.5 text-xs font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                onClick={handleCopyId}
                title="Click to copy Order ID"
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[10px] font-mono font-bold text-[#30AFFF] cursor-pointer transition-colors flex items-center space-x-1"
              >
                <Copy className="w-2.5 h-2.5" />
                <span>{copiedId ? 'Copied!' : submission.id}</span>
              </button>
            </div>

            {/* Client Info: Avatar, Name, Service, Phone */}
            <div className="flex items-center space-x-2.5 pt-2 border-t border-[var(--color-border)]">
              <div className="w-9 h-9 rounded-xl bg-[#30AFFF]/15 border border-[#30AFFF]/30 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[#30AFFF]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[var(--color-text)] truncate" title={submission.name}>
                  {submission.name}
                </p>
                <p className="text-[11px] text-[var(--color-muted-text)] font-medium truncate mt-0.5">
                  <span className="text-[#30AFFF] font-bold">{submission.purpose}</span>
                  <span> • </span>
                  <span className="font-mono font-bold text-[var(--color-text)]">+91 {submission.phone}</span>
                </p>
              </div>
            </div>

            {/* Direct Communication Buttons (Call & WhatsApp) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:+91${submission.phone.replace(/\D/g, '')}`}
                title={`Call ${submission.name}`}
                className="px-2 sm:px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-[11px] sm:text-xs flex items-center justify-center space-x-1 transition-colors whitespace-nowrap min-w-0"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Call Client</span>
              </a>

              <a
                href={`https://wa.me/91${submission.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`Chat with ${submission.name} on WhatsApp`}
                className="px-2 sm:px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center space-x-1 shadow-2xs transition-colors whitespace-nowrap min-w-0"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </a>
            </div>

            {/* Utility & Print Buttons (Save State & Print Document) */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--color-border)]">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSaveState}
                  disabled={isSaving}
                  title={hasUnsavedChanges ? "You have unsaved modifications! Click to save to database (or press Ctrl+S)" : "Current modifications saved (Ctrl+S)"}
                  className={`px-2 sm:px-2.5 py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center space-x-1 cursor-pointer border transition-all whitespace-nowrap min-w-0 ${
                    savedNotice
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : isSaving
                      ? 'bg-[var(--bg-primary)] text-[var(--color-muted-text)] border-[var(--color-border)] cursor-wait'
                      : hasUnsavedChanges
                      ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-black shadow-xs ring-1 ring-amber-500/30'
                      : 'bg-[var(--bg-primary)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[#30AFFF]'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin text-[#30AFFF] shrink-0" />
                      <span className="truncate">Saving...</span>
                    </>
                  ) : savedNotice ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span className="truncate">Saved!</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <Save className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                      <span className="truncate">Save State *</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-[#30AFFF] shrink-0" />
                      <span className="truncate">Saved State</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrintCanvas}
                  className="px-2 sm:px-2.5 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-[11px] sm:text-xs shadow-xs flex items-center justify-center space-x-1 cursor-pointer transition-colors whitespace-nowrap min-w-0"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                  <span className="truncate">Print Document</span>
                </button>
              </div>

              {/* Status and Last Saved Feedback */}
              <div className="flex items-center justify-between px-1 text-[10px] text-[var(--color-muted-text)] font-mono">
                <span>{hasUnsavedChanges ? '● Unsaved changes' : ''}</span>
                <span>{lastSavedTime ? `Saved: ${lastSavedTime}` : ''}</span>
              </div>
            </div>
          </div>

          {/* Client Instructions Note (if provided) */}
          {submission.description && (
            <div className="container-box p-3.5 space-y-1.5 shadow-2xs rounded-2xl border-l-4 border-amber-500">
              <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black uppercase tracking-wider">Client Instructions</span>
              </div>
              <p className="text-xs text-[var(--color-text)] leading-relaxed italic bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--color-border)]">
                "{submission.description}"
              </p>
            </div>
          )}

          {/* Attached Files List (Document Queue) */}
          <div className="container-box p-3.5 space-y-2.5 shadow-2xs rounded-2xl border border-[var(--color-border)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <h3 className="text-xs font-black text-[var(--color-text)] uppercase tracking-wider">
                Attached Files ({submission.files?.length || 0})
              </h3>
              {submission.files?.length > 1 && (
                <button
                  onClick={() => setIsMergeModalOpen(true)}
                  className="text-[10px] text-[#30AFFF] hover:underline font-bold flex items-center space-x-1"
                >
                  <Files className="w-3 h-3" />
                  <span>Merge All</span>
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5">
              {submission.files.map((file) => {
                const fId = file.id || file.filename;
                const isSelected = fId === activeFileId;
                const isFileSaved = Boolean(savedFileStates[fId]);
                const isFileUnsaved = isSelected && hasUnsavedChanges;

                return (
                  <div
                    key={fId}
                    onClick={() => setActiveFileId(fId)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#30AFFF] bg-[#30AFFF]/10 shadow-xs ring-1 ring-[#30AFFF]'
                        : 'border-[var(--color-border)] bg-[var(--bg-primary)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-black text-[var(--color-text)] truncate" title={file.original_name}>
                          {file.original_name}
                        </p>
                        {isFileUnsaved ? (
                          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold border border-amber-500/40">
                            ● Unsaved
                          </span>
                        ) : isFileSaved ? (
                          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/40 flex items-center space-x-0.5">
                            <Check className="w-2.5 h-2.5" />
                            <span>Saved</span>
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-[var(--color-muted-text)] font-semibold mt-1 truncate">
                        {formatFileSize(file.size)} • {getDocumentType(file)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            ZONE 2 & 3. RIGHT AREA: Tool Machine Bar (Above) & Studio Stage (Below)
        ========================================================================= */}
        <div className="flex-1 min-w-0 space-y-3.5 w-full">
          
          {/* =====================================================================
              ZONE 2. RIGHT ABOVE: THE TOOL MACHINE BAR (Paid-Tool Grade CSC Deck)
          ===================================================================== */}
          <div className="container-box p-3.5 sm:p-4 rounded-2xl print:hidden border border-[var(--color-border)] shadow-xs space-y-3">
            
            {/* Tool Machine Tabs Selector */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-2.5 border-b border-[var(--color-border)]/70">
              <button
                type="button"
                onClick={() => setActiveToolTab('crop')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shrink-0 cursor-pointer transition-all ${
                  activeToolTab === 'crop'
                    ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                    : 'bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF]/50'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Crop & Frame</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('orient')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shrink-0 cursor-pointer transition-all ${
                  activeToolTab === 'orient'
                    ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                    : 'bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF]/50'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate & Flip</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('enhance')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shrink-0 cursor-pointer transition-all ${
                  activeToolTab === 'enhance'
                    ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                    : 'bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF]/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xerox & Clean</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('pdf')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shrink-0 cursor-pointer transition-all ${
                  activeToolTab === 'pdf'
                    ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                    : 'bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF]/50'
                }`}
              >
                <Files className="w-3.5 h-3.5" />
                <span>PDF Suite</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('compress')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shrink-0 cursor-pointer transition-all ${
                  activeToolTab === 'compress'
                    ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                    : 'bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF]/50'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Govt KB Compressor</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('export')}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shrink-0 cursor-pointer transition-all ${
                  activeToolTab === 'export'
                    ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                    : 'bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF]/50'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export & Print</span>
              </button>
            </div>

            {/* Active Tool Sub-Deck Panels */}
            
            {/* 1. Crop & Frame Sub-Deck */}
            {activeToolTab === 'crop' && (
              <div className="space-y-2.5 pt-1">
                {/* Row 1: Mode Selector Toggle on Left, Quick Borders & Grid on Right */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
                  {/* Mode Selector Toggle: Adjust Frame vs Preview Cut */}
                  <div className="flex items-center gap-1 p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--color-border)] shrink-0">
                    <button
                      type="button"
                      onClick={() => setCropViewMode('adjust')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all ${
                        cropViewMode === 'adjust'
                          ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                          : 'text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
                      }`}
                      title="Adjust Frame: Move crop handles directly on image"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>Adjust Frame</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCropViewMode('preview')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all ${
                        cropViewMode === 'preview'
                          ? 'bg-[#30AFFF] text-slate-950 shadow-xs'
                          : 'text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
                      }`}
                      title="Preview Cut: Inspect trimmed document before printing"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Preview Cut</span>
                    </button>
                  </div>

                  {/* Quick Borders Trims & Grid Toggle */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCropGrid(!showCropGrid)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors flex items-center space-x-1 ${
                        showCropGrid 
                          ? 'bg-[#30AFFF]/15 border-[#30AFFF] text-[#30AFFF]' 
                          : 'bg-[var(--bg-primary)] border-[var(--color-border)] text-[var(--color-muted-text)]'
                      }`}
                      title="Toggle Rule-of-Thirds Gridlines"
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                      <span>Grid</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCropInsetTop(3);
                        setCropInsetBottom(3);
                        setCropInsetLeft(3);
                        setCropInsetRight(3);
                        setCropPreset('free');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] cursor-pointer"
                      title="Trim Scanner Edge Shadows"
                    >
                      Trim 3%
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCropInsetTop(5);
                        setCropInsetBottom(5);
                        setCropInsetLeft(5);
                        setCropInsetRight(5);
                        setCropPreset('free');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] cursor-pointer"
                    >
                      Trim 5%
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCropInsetTop(0);
                        setCropInsetBottom(0);
                        setCropInsetLeft(0);
                        setCropInsetRight(0);
                        setCropPreset('free');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-amber-500 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Row 2: Standard Document Aspect Ratio Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-black uppercase text-[var(--color-muted-text)] mr-0.5">Ratios:</span>
                  {[
                    { id: 'free', label: 'Free' },
                    { id: 'a4', label: 'A4' },
                    { id: 'passport', label: 'Passport (3.5×4.5)' },
                    { id: 'aadhaar', label: 'Aadhaar / Voter' },
                    { id: 'pancard', label: 'PAN Card' },
                    { id: 'square', label: '1:1 Square' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyCropPreset(p.id as CropPreset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        cropPreset === p.id
                          ? 'bg-[#30AFFF] text-slate-950 font-black ring-1 ring-[#30AFFF]'
                          : 'bg-[var(--bg-primary)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Row 3: 4 Edge Precision Sliders (Responsive 2 or 4 Columns) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)]">
                  {/* Top Edge */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span>Top Edge</span>
                      <span className="font-mono text-[#30AFFF]">{cropInsetTop}%</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCropInsetTop((prev) => Math.max(0, prev - 1));
                          setCropPreset('free');
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step -1%"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={cropInsetTop}
                        onChange={(e) => {
                          setCropInsetTop(Number(e.target.value));
                          setCropPreset('free');
                        }}
                        className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCropInsetTop((prev) => Math.min(45, prev + 1));
                          setCropPreset('free');
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step +1%"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Bottom Edge */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span>Bottom Edge</span>
                      <span className="font-mono text-[#30AFFF]">{cropInsetBottom}%</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCropInsetBottom((prev) => Math.max(0, prev - 1));
                          setCropPreset('free');
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step -1%"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={cropInsetBottom}
                        onChange={(e) => {
                          setCropInsetBottom(Number(e.target.value));
                          setCropPreset('free');
                        }}
                        className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCropInsetBottom((prev) => Math.min(45, prev + 1));
                          setCropPreset('free');
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step +1%"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Left Edge */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span>Left Edge</span>
                      <span className="font-mono text-[#30AFFF]">{cropInsetLeft}%</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCropInsetLeft((prev) => Math.max(0, prev - 1));
                          setCropPreset('free');
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step -1%"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={cropInsetLeft}
                        onChange={(e) => {
                          setCropInsetLeft(Number(e.target.value));
                          setCropPreset('free');
                        }}
                        className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCropInsetLeft((prev) => Math.min(45, prev + 1));
                          setCropPreset('free');
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step +1%"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Right Edge */}
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span>Right Edge</span>
                      <span className="font-mono text-[#30AFFF]">{cropInsetRight}%</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCropInsetRight((prev) => Math.max(0, prev - 1));
                          setCropPreset('free');
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step -1%"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={cropInsetRight}
                        onChange={(e) => {
                          setCropInsetRight(Number(e.target.value));
                          setCropPreset('free');
                        }}
                        className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCropInsetRight((prev) => Math.min(45, prev + 1));
                          setCropPreset('free');
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step +1%"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Rotate, Flip & Straighten Sub-Deck */}
            {activeToolTab === 'orient' && (
              <div className="space-y-2.5 pt-1">
                {/* Row 1: 90° Quadrant Controls on Left, Reset Orientation on Right */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
                  {/* Cardinal Quadrant Rotation Buttons */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <span className="text-[10px] font-black uppercase text-[var(--color-muted-text)] mr-0.5">Rotate:</span>
                    
                    <button
                      type="button"
                      onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
                      className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Turn 90° Counter-Clockwise"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>90° Left</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Turn 90° Clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>90° Right</span>
                    </button>

                    {/* Direct Angle Indicators */}
                    {[
                      { angle: 0, label: '0° Normal' },
                      { angle: 90, label: '90°' },
                      { angle: 180, label: '180°' },
                      { angle: 270, label: '270°' },
                    ].map((item) => (
                      <button
                        key={item.angle}
                        type="button"
                        onClick={() => setRotation(item.angle)}
                        className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          rotation === item.angle
                            ? 'bg-[#30AFFF] text-slate-950 font-black shadow-xs ring-1 ring-[#30AFFF]'
                            : 'bg-[var(--bg-primary)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setRotation(0);
                      setFineAngle(0);
                      setFlipH(false);
                      setFlipV(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-amber-500 cursor-pointer transition-colors shrink-0"
                    title="Reset all rotation, straighten and flip adjustments"
                  >
                    Reset Orientation
                  </button>
                </div>

                {/* Row 2: Mirroring Tools & Leveling Grid Toggle */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-[10px] font-black uppercase text-[var(--color-muted-text)] mr-1">Flips & Level:</span>

                  <button
                    type="button"
                    onClick={() => setFlipH(!flipH)}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors ${
                      flipH
                        ? 'bg-[#30AFFF] text-slate-950 border-[#30AFFF] font-black shadow-xs ring-1 ring-[#30AFFF]'
                        : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)]'
                    }`}
                    title="Fix backwards/mirrored selfie camera photos"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip Horizontal {flipH ? '(Active)' : ''}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlipV(!flipV)}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors ${
                      flipV
                        ? 'bg-[#30AFFF] text-slate-950 border-[#30AFFF] font-black shadow-xs ring-1 ring-[#30AFFF]'
                        : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)]'
                    }`}
                    title="Invert vertically"
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip Vertical {flipV ? '(Active)' : ''}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowStraightenGrid(!showStraightenGrid)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors flex items-center space-x-1 ${
                      showStraightenGrid
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 font-black'
                        : 'bg-[var(--bg-primary)] border-[var(--color-border)] text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
                    }`}
                    title="Toggle Leveling Grid to check straightness of document text"
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                    <span>Leveling Grid</span>
                  </button>
                </div>

                {/* Row 3: Fine Straighten / Deskew Precision Deck */}
                <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-[var(--color-text)]">Deskew & Tilt Straightener:</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#30AFFF]/15 border border-[#30AFFF]/30 font-mono text-xs font-black text-[#30AFFF]">
                        {fineAngle > 0 ? `+${fineAngle.toFixed(1)}` : fineAngle.toFixed(1)}°
                      </span>
                      {fineAngle === 0 && (
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                          ✓ Level
                        </span>
                      )}
                    </div>

                    {/* Preset angle chips */}
                    <div className="flex flex-wrap items-center gap-1">
                      {[-5, -2, -1, 0, 1, 2, 5].map((ang) => (
                        <button
                          key={ang}
                          type="button"
                          onClick={() => setFineAngle(ang)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                            fineAngle === ang
                              ? 'bg-[#30AFFF] text-slate-950 font-black'
                              : 'bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
                          }`}
                        >
                          {ang === 0 ? '0°' : ang > 0 ? `+${ang}°` : `${ang}°`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stepper + Slider + Reset */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFineAngle((prev) => Math.max(-45, Math.round((prev - 1) * 10) / 10))}
                      className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs cursor-pointer transition-colors shrink-0"
                      title="Step -1.0°"
                    >
                      -1°
                    </button>
                    <button
                      type="button"
                      onClick={() => setFineAngle((prev) => Math.max(-45, Math.round((prev - 0.2) * 10) / 10))}
                      className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-bold text-xs cursor-pointer transition-colors shrink-0"
                      title="Step -0.2°"
                    >
                      -0.2°
                    </button>

                    {/* Continuous Range Slider */}
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      step="0.1"
                      value={fineAngle}
                      onChange={(e) => setFineAngle(Number(e.target.value))}
                      className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() => setFineAngle((prev) => Math.min(45, Math.round((prev + 0.2) * 10) / 10))}
                      className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-bold text-xs cursor-pointer transition-colors shrink-0"
                      title="Step +0.2°"
                    >
                      +0.2°
                    </button>
                    <button
                      type="button"
                      onClick={() => setFineAngle((prev) => Math.min(45, Math.round((prev + 1) * 10) / 10))}
                      className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs cursor-pointer transition-colors shrink-0"
                      title="Step +1.0°"
                    >
                      +1°
                    </button>

                    <button
                      type="button"
                      onClick={() => setFineAngle(0)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] cursor-pointer transition-colors shrink-0"
                    >
                      Reset 0°
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Xerox & Image Quality Sub-Deck */}
            {activeToolTab === 'enhance' && (
              <div className="space-y-2.5 pt-1">
                {/* Row 1: Core Mode Toggles on Left, Reset on Right */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* B/W Xerox Photocopy Mode Button */}
                    <button
                      type="button"
                      onClick={() => setBwMode(!bwMode)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center space-x-1.5 ${
                        bwMode
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : 'bg-[var(--bg-primary)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-emerald-500'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{bwMode ? 'B/W Xerox (Active)' : 'Enable B/W Xerox'}</span>
                    </button>

                    {/* Auto-Clean Document Button */}
                    <button
                      type="button"
                      onClick={handleAutoCleanDocument}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] flex items-center space-x-1.5 cursor-pointer transition-colors"
                      title="Auto-Clean phone camera shadows and enhance page brightness"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>Auto-Clean Shadows</span>
                    </button>

                    {/* Invert Colors Button */}
                    <button
                      type="button"
                      onClick={() => setInverted(!inverted)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer transition-colors ${
                        inverted
                          ? 'bg-[#30AFFF] text-slate-950 border-[#30AFFF]'
                          : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-[#30AFFF]'
                      }`}
                    >
                      Invert (Negative)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBwMode(false);
                      setXeroxThreshold(0);
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                      setInverted(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-amber-500 cursor-pointer shrink-0 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>

                {/* Row 2: Instant CSC Photocopy Quality Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-black uppercase text-[var(--color-muted-text)] mr-0.5">Presets:</span>
                  {[
                    {
                      label: 'Original (100%)',
                      apply: () => {
                        setBwMode(false);
                        setXeroxThreshold(0);
                        setBrightness(100);
                        setContrast(100);
                        setSaturation(100);
                        setInverted(false);
                      }
                    },
                    {
                      label: 'Crisp B/W Xerox',
                      apply: () => {
                        setBwMode(true);
                        setXeroxThreshold(10);
                        setBrightness(105);
                        setContrast(135);
                        setSaturation(0);
                        setInverted(false);
                      }
                    },
                    {
                      label: 'Clear Phone Shadows',
                      apply: () => {
                        handleAutoCleanDocument();
                      }
                    },
                    {
                      label: 'Deep Black Ink (Govt Forms)',
                      apply: () => {
                        setBwMode(true);
                        setXeroxThreshold(25);
                        setBrightness(110);
                        setContrast(150);
                        setSaturation(0);
                        setInverted(false);
                      }
                    },
                    {
                      label: 'Vibrant Color',
                      apply: () => {
                        setBwMode(false);
                        setBrightness(105);
                        setContrast(115);
                        setSaturation(135);
                        setInverted(false);
                      }
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={preset.apply}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--bg-primary)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[#30AFFF] hover:text-[#30AFFF] cursor-pointer transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Row 3: Brightness, Contrast & Xerox Ink Density Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)]">
                  {/* Brightness */}
                  <div className="min-w-0">
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span>Brightness</span>
                      <span className="font-mono text-[#30AFFF]">{brightness}%</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setBrightness((b) => Math.max(50, b - 5))}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step -5%"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setBrightness((b) => Math.min(180, b + 5))}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step +5%"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Contrast */}
                  <div className="min-w-0">
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span>Contrast</span>
                      <span className="font-mono text-[#30AFFF]">{contrast}%</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setContrast((c) => Math.max(50, c - 5))}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step -5%"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setContrast((c) => Math.min(200, c + 5))}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step +5%"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Saturation or Xerox Ink Density */}
                  <div className="min-w-0">
                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                      <span>{bwMode ? 'Xerox Ink Density' : 'Color Saturation'}</span>
                      <span className="font-mono text-[#30AFFF]">{bwMode ? xeroxThreshold : saturation}%</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (bwMode) setXeroxThreshold((t) => Math.max(-50, t - 5));
                          else setSaturation((s) => Math.max(0, s - 5));
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step -5%"
                      >
                        -
                      </button>
                      {bwMode ? (
                        <input
                          type="range"
                          min="-50"
                          max="60"
                          value={xeroxThreshold}
                          onChange={(e) => setXeroxThreshold(Number(e.target.value))}
                          className="flex-1 min-w-0 accent-emerald-500 cursor-pointer"
                        />
                      ) : (
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={saturation}
                          onChange={(e) => setSaturation(Number(e.target.value))}
                          className="flex-1 min-w-0 accent-[#30AFFF] cursor-pointer"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (bwMode) setXeroxThreshold((t) => Math.min(60, t + 5));
                          else setSaturation((s) => Math.min(200, s + 5));
                        }}
                        className="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] font-mono font-black text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Step +5%"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PDF Suite Sub-Deck (Merge, Split, Convert) */}
            {activeToolTab === 'pdf' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
                  {/* Convert to A4 PDF Button */}
                  <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs font-black text-[var(--color-text)]">
                        <FileText className="w-3.5 h-3.5 text-[#30AFFF] shrink-0" />
                        <span className="truncate">Convert to A4 PDF</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-muted-text)] mt-1 line-clamp-2">
                        Converts current cropped & enhanced view into a print-ready A4 PDF document.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleConvertToPdf}
                      className="w-full py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      Convert & Download PDF
                    </button>
                  </div>

                  {/* Merge Multiple Files Button */}
                  <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs font-black text-[var(--color-text)]">
                        <Files className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">Merge Documents</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-muted-text)] mt-1 line-clamp-2">
                        Combines multiple customer attachments (PDFs + images) into a single PDF.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMergeModalOpen(true)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      Merge Tool ({submission.files?.length || 0} Files)
                    </button>
                  </div>

                  {/* Split PDF Pages Button */}
                  <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs font-black text-[var(--color-text)]">
                        <Split className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">Split / Extract Pages</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-muted-text)] mt-1 line-clamp-2">
                        Extract specific page ranges (e.g. 1, 2-3) from multi-page PDF documents.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSplitModalOpen(true)}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      Extract PDF Pages
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Govt Portal KB Compressor Sub-Deck */}
            {activeToolTab === 'compress' && (
              <div className="space-y-2.5 pt-1">
                {/* Row 1: Govt Portal Standard Limit Chips */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/50">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-[var(--color-muted-text)] mr-0.5">Govt Limits:</span>
                    {[
                      { kb: 50, label: '< 50 KB (Sign / Photo)' },
                      { kb: 100, label: '< 100 KB (Passport)' },
                      { kb: 200, label: '< 200 KB (Aadhaar / Caste)' },
                      { kb: 500, label: '< 500 KB (Marksheets)' },
                    ].map((item) => (
                      <button
                        key={item.kb}
                        type="button"
                        onClick={() => {
                          setTargetKb(item.kb);
                          setCustomKbInput(String(item.kb));
                          handleCompressTargetKb(item.kb);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          targetKb === item.kb
                            ? 'bg-[#30AFFF] text-slate-950 font-black shadow-xs ring-1 ring-[#30AFFF]'
                            : 'bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] hover:text-[#30AFFF]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] font-mono text-[var(--color-muted-text)] shrink-0 hidden sm:inline">
                    Target: <span className="font-bold text-[#30AFFF]">{targetKb} KB</span>
                  </span>
                </div>

                {/* Row 2: Custom KB Input & Direct Compress Action Card */}
                <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--color-border)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-xs font-bold text-[var(--color-muted-text)] shrink-0">Custom Target:</span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="10"
                        max="5000"
                        value={customKbInput}
                        onChange={(e) => setCustomKbInput(e.target.value)}
                        className="w-24 px-2.5 py-1.5 pr-8 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] text-xs font-mono font-bold text-[var(--color-text)] focus:border-[#30AFFF] focus:outline-hidden"
                        placeholder="200"
                      />
                      <span className="absolute right-2 text-[10px] font-bold text-[var(--color-muted-text)] pointer-events-none">
                        KB
                      </span>
                    </div>

                    <span className="text-[11px] text-[var(--color-muted-text)] hidden md:inline truncate">
                      (Optimal compression for online government uploads)
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      const val = parseInt(customKbInput, 10);
                      if (!isNaN(val) && val > 0) {
                        setTargetKb(val);
                        handleCompressTargetKb(val);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs cursor-pointer shadow-xs transition-colors shrink-0 flex items-center justify-center space-x-1.5"
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Compress & Download ({customKbInput || targetKb} KB)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. Export & Print Sub-Deck */}
            {activeToolTab === 'export' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-1 w-full">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDownloadImage('jpeg')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] font-black text-xs text-[var(--color-text)] flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#30AFFF] shrink-0" />
                  <span className="truncate">Download JPG</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleDownloadImage('png')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:border-[#30AFFF] font-black text-xs text-[var(--color-text)] flex items-center justify-center space-x-2 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Download PNG</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConvertToPdf}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] font-black text-xs text-slate-950 flex items-center justify-center space-x-2 cursor-pointer shadow-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Download A4 PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintCanvas}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-xs text-white flex items-center justify-center space-x-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Direct Print High-Res</span>
                </button>
              </div>
            )}

          </div>

          {/* =====================================================================
              ZONE 3. RIGHT BELOW: COMPLETE STUDIO CANVAS STAGE
          ===================================================================== */}
          <div className="container-box p-3.5 sm:p-5 rounded-2xl min-h-[620px] flex flex-col justify-between bg-slate-100 dark:bg-slate-950 border border-[var(--color-border)] relative shadow-2xs overflow-hidden">
            
            {/* Studio Floating Quick Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 z-20 pb-2.5 border-b border-[var(--color-border)]/40 print:hidden">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(250, prev + 25))}
                  className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] font-bold cursor-pointer hover:border-[#30AFFF] transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-[#30AFFF]" />
                </button>

                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(25, prev - 25))}
                  className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] font-bold cursor-pointer hover:border-[#30AFFF] transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-[#30AFFF]" />
                </button>

                <span className="font-mono text-xs font-bold text-[var(--color-text)] px-1">{zoom}%</span>

                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-muted-text)] hover:text-[var(--color-text)] cursor-pointer"
                >
                  Fit 100%
                </button>
              </div>

              {/* Status / Active Tool Indicator */}
              <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
                {bwMode && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/40 shrink-0">
                    B/W XEROX
                  </span>
                )}
                {rotation !== 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-[#30AFFF]/20 text-[#30AFFF] text-[10px] font-black border border-[#30AFFF]/40 shrink-0">
                    ROTATED {rotation}°
                  </span>
                )}
                {fineAngle !== 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-black border border-purple-500/40 shrink-0">
                    DESKEW {fineAngle > 0 ? `+${fineAngle.toFixed(1)}` : fineAngle.toFixed(1)}°
                  </span>
                )}
                {(flipH || flipV) && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 text-[10px] font-black border border-sky-500/40 shrink-0">
                    FLIPPED {flipH ? 'H' : ''}{flipH && flipV ? '+' : ''}{flipV ? 'V' : ''}
                  </span>
                )}
                {(cropInsetTop > 0 || cropInsetBottom > 0 || cropInsetLeft > 0 || cropInsetRight > 0) && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/40 shrink-0">
                    CROPPED
                  </span>
                )}
                {activeSavedState && (
                  <button
                    type="button"
                    onClick={handleRevertToOriginal}
                    title="Clear saved edits for this document and return to original"
                    className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] text-[10px] font-bold text-red-500 hover:border-red-500 cursor-pointer shrink-0"
                  >
                    Revert to Original
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetEditor}
                  className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] text-[10px] font-bold text-amber-500 hover:border-amber-500 cursor-pointer shrink-0"
                >
                  Reset All
                </button>
              </div>
            </div>

            {/* Document / Canvas Stage Center */}
            <div ref={printAreaRef} className="flex-1 w-full flex items-center justify-center p-4 overflow-auto min-h-[500px]">
              {isImage ? (
                <div 
                  className="relative inline-block"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center center',
                    transition: dragHandle ? 'none' : 'transform 0.15s ease',
                  }}
                >
                  {/* Unified Transformed Wrapper: Rotations and Flips are locked together for image & crop box */}
                  <div
                    className="relative inline-block select-none"
                    style={{
                      transform: `rotate(${rotation + fineAngle}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                      transformOrigin: 'center center',
                      transition: dragHandle ? 'none' : 'transform 0.15s ease',
                    }}
                  >
                    {/* The Document Image */}
                    <img
                      ref={imageRef}
                      crossOrigin="anonymous"
                      src={fileViewUrl}
                      alt={activeFile?.original_name}
                      style={{
                        clipPath: (activeToolTab !== 'crop' || cropViewMode === 'preview')
                          ? `inset(${cropInsetTop}% ${cropInsetRight}% ${cropInsetBottom}% ${cropInsetLeft}%)`
                          : 'none',
                        filter: previewFilter,
                        transition: 'filter 0.15s ease',
                        maxHeight: '620px',
                        maxWidth: '100%',
                        objectFit: 'contain'
                      }}
                      className="rounded shadow-2xl block select-none pointer-events-none"
                    />

                    {/* Interactive Crop Frame & Handles (Active in Crop tab & Adjust mode) */}
                    {activeToolTab === 'crop' && cropViewMode === 'adjust' && (
                      <div 
                        className="absolute border-2 border-[#30AFFF] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] z-10 cursor-move select-none group"
                        style={{
                          top: `${cropInsetTop}%`,
                          bottom: `${cropInsetBottom}%`,
                          left: `${cropInsetLeft}%`,
                          right: `${cropInsetRight}%`,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStartCropDrag(e.clientX, e.clientY, 'move');
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          if (e.touches.length > 0) {
                            handleStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'move');
                          }
                        }}
                      >
                        {/* Rule of Thirds Horizontal Gridlines */}
                        {showCropGrid && (
                          <>
                            <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-white/60 pointer-events-none" />
                            <div className="absolute top-2/3 left-0 right-0 border-t border-dashed border-white/60 pointer-events-none" />
                            <div className="absolute left-1/3 top-0 bottom-0 border-l border-dashed border-white/60 pointer-events-none" />
                            <div className="absolute left-2/3 top-0 bottom-0 border-l border-dashed border-white/60 pointer-events-none" />
                          </>
                        )}

                        {/* Drag Reposition Hint on hover */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                          Drag inside to reposition frame
                        </div>

                        {/* 4 Corner Handles */}
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartCropDrag(e.clientX, e.clientY, 'tl');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (e.touches.length > 0) handleStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'tl');
                          }}
                          className="absolute -top-2 -left-2 w-4 h-4 bg-[#30AFFF] border-2 border-white rounded-xs shadow-lg cursor-nwse-resize z-20"
                          title="Resize Top-Left"
                        />
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartCropDrag(e.clientX, e.clientY, 'tr');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (e.touches.length > 0) handleStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'tr');
                          }}
                          className="absolute -top-2 -right-2 w-4 h-4 bg-[#30AFFF] border-2 border-white rounded-xs shadow-lg cursor-nesw-resize z-20"
                          title="Resize Top-Right"
                        />
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartCropDrag(e.clientX, e.clientY, 'bl');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (e.touches.length > 0) handleStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'bl');
                          }}
                          className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#30AFFF] border-2 border-white rounded-xs shadow-lg cursor-nesw-resize z-20"
                          title="Resize Bottom-Left"
                        />
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartCropDrag(e.clientX, e.clientY, 'br');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (e.touches.length > 0) handleStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'br');
                          }}
                          className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#30AFFF] border-2 border-white rounded-xs shadow-lg cursor-nwse-resize z-20"
                          title="Resize Bottom-Right"
                        />

                        {/* 4 Edge Midpoint Handles */}
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartCropDrag(e.clientX, e.clientY, 'top');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (e.touches.length > 0) handleStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'top');
                          }}
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-[#30AFFF] border border-white rounded-sm shadow-md cursor-ns-resize z-20"
                          title="Drag Top Edge"
                        />
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartCropDrag(e.clientX, e.clientY, 'bottom');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (e.touches.length > 0) handleStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'bottom');
                          }}
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-[#30AFFF] border border-white rounded-sm shadow-md cursor-ns-resize z-20"
                          title="Drag Bottom Edge"
                        />
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartCropDrag(e.clientX, e.clientY, 'left');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (e.touches.length > 0) handleStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'left');
                          }}
                          className="absolute top-1/2 -translate-y-1/2 -left-1.5 h-8 w-2.5 bg-[#30AFFF] border border-white rounded-sm shadow-md cursor-ew-resize z-20"
                          title="Drag Left Edge"
                        />
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartCropDrag(e.clientX, e.clientY, 'right');
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (e.touches.length > 0) handleStartCropDrag(e.touches[0].clientX, e.touches[0].clientY, 'right');
                          }}
                          className="absolute top-1/2 -translate-y-1/2 -right-1.5 h-8 w-2.5 bg-[#30AFFF] border border-white rounded-sm shadow-md cursor-ew-resize z-20"
                          title="Drag Right Edge"
                        />
                      </div>
                    )}
                    {/* Leveling & Alignment Grid Overlay for Straightening */}
                    {activeToolTab === 'orient' && showStraightenGrid && (
                      <div className="absolute inset-0 pointer-events-none z-10 border-2 border-cyan-400/40 rounded">
                        {/* Horizontal leveling lines */}
                        <div className="absolute top-[12.5%] left-0 right-0 border-t border-cyan-400/25 border-dashed" />
                        <div className="absolute top-[25%] left-0 right-0 border-t border-cyan-400/45" />
                        <div className="absolute top-[37.5%] left-0 right-0 border-t border-cyan-400/25 border-dashed" />
                        <div className="absolute top-[50%] left-0 right-0 border-t border-cyan-400/60" />
                        <div className="absolute top-[62.5%] left-0 right-0 border-t border-cyan-400/25 border-dashed" />
                        <div className="absolute top-[75%] left-0 right-0 border-t border-cyan-400/45" />
                        <div className="absolute top-[87.5%] left-0 right-0 border-t border-cyan-400/25 border-dashed" />

                        {/* Vertical leveling lines */}
                        <div className="absolute left-[25%] top-0 bottom-0 border-l border-cyan-400/45" />
                        <div className="absolute left-[50%] top-0 bottom-0 border-l border-cyan-400/60" />
                        <div className="absolute left-[75%] top-0 bottom-0 border-l border-cyan-400/45" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                  <iframe
                    src={fileViewUrl}
                    title={activeFile?.original_name}
                    className="w-full h-[620px] rounded-xl border border-[var(--color-border)] shadow-md"
                  />
                  <div className="p-2 text-center text-xs text-[var(--color-muted-text)] font-medium">
                    Native PDF loaded. Use PDF Suite above to merge or split pages.
                  </div>
                </div>
              )}
            </div>

            {/* Bottom info banner */}
            <div className="flex items-center justify-between text-[11px] text-[var(--color-muted-text)] pt-2 border-t border-[var(--color-border)]/40 print:hidden">
              <span className="font-medium truncate max-w-[300px]">
                {activeFile?.original_name}
              </span>
              <span className="font-mono font-bold">
                Maa Vaishno e-World • Studio Counter Engine
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL 1: MERGE MULTIPLE DOCUMENTS MODAL
      ========================================================================= */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center space-x-2">
                <Files className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-black text-[var(--color-text)]">Merge Customer Documents</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--color-muted-text)]">
              Select the documents you wish to combine into a single consolidated multi-page A4 PDF file:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {submission.files.map((file, idx) => {
                const fId = file.id || file.filename;
                const isChecked = mergeSelectedFiles.includes(fId);
                return (
                  <label
                    key={fId}
                    className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-[var(--color-border)] bg-[var(--bg-primary)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMergeSelectedFiles((prev) => [...prev, fId]);
                        } else {
                          setMergeSelectedFiles((prev) => prev.filter((id) => id !== fId));
                        }
                      }}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[var(--color-text)] truncate">{file.original_name}</p>
                      <p className="text-[10px] text-[var(--color-muted-text)]">
                        Page {idx + 1} • {formatFileSize(file.size)} • {getDocumentType(file)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => {
                  if (mergeSelectedFiles.length === submission.files.length) {
                    setMergeSelectedFiles([]);
                  } else {
                    setMergeSelectedFiles(submission.files.map((f) => f.id || f.filename));
                  }
                }}
                className="text-xs font-bold text-[#30AFFF] hover:underline cursor-pointer"
              >
                {mergeSelectedFiles.length === submission.files.length ? 'Deselect All' : 'Select All'}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[var(--bg-primary)] border border-[var(--color-border)] hover:bg-[var(--bg-card)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing || mergeSelectedFiles.length === 0}
                  onClick={handleMergeDocuments}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? 'Merging...' : `Merge & Download (${mergeSelectedFiles.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SPLIT PDF PAGES MODAL
      ========================================================================= */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center space-x-2">
                <Split className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-black text-[var(--color-text)]">Split / Extract PDF Pages</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[var(--color-text)]">
                Page Numbers or Range to Extract:
              </label>
              <input
                type="text"
                value={splitPageRange}
                onChange={(e) => setSplitPageRange(e.target.value)}
                placeholder="e.g. 1, 2-3"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-sm font-mono font-bold text-[var(--color-text)] focus:border-purple-500 focus:outline-none"
              />
              <p className="text-[11px] text-[var(--color-muted-text)] leading-relaxed">
                Enter single pages separated by commas, or page ranges with hyphens. Examples: <span className="font-mono text-[#30AFFF]">1</span>, <span className="font-mono text-[#30AFFF]">1-2</span>, or <span className="font-mono text-[#30AFFF]">1, 3-4</span>.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[var(--bg-primary)] border border-[var(--color-border)] hover:bg-[var(--bg-card)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing || !splitPageRange.trim()}
                onClick={handleSplitPdf}
                className="px-4 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isProcessing ? 'Extracting...' : 'Extract & Download'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
