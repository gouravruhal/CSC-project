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
  HardDrive
} from 'lucide-react';
import { Submission, Language } from '../../types';

interface OperatorWorkspaceProps {
  submissionId: string;
  adminToken: string;
  onBack: () => void;
  language: Language;
}

interface SavedFileState {
  zoom: number;
  rotation: number;
  brightness: number;
  contrast: number;
  bwMode: boolean;
  widthScale: number;
  heightScale: number;
  cropPreset: string;
  targetMaxKB: number;
  convertedToPdf: boolean;
}

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
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const [savedFileStates, setSavedFileStates] = useState<Record<string, SavedFileState>>({});

  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [bwMode, setBwMode] = useState<boolean>(false);
  const [mergePreviewMode, setMergePreviewMode] = useState<boolean>(false);

  const [targetMaxKB, setTargetMaxKB] = useState<number>(200);
  const [convertedToPdf, setConvertedToPdf] = useState<boolean>(false);

  const [resizePreset, setResizePreset] = useState<'a4' | 'passport' | 'idcard' | 'custom'>('a4');
  const [widthScale, setWidthScale] = useState<number>(100);
  const [heightScale, setHeightScale] = useState<number>(100);

  const [cropPreset, setCropPreset] = useState<'none' | 'aadhaar_front' | 'aadhaar_back' | 'passport' | 'pancard' | 'custom'>('none');
  const [cropInsetTop, setCropInsetTop] = useState<number>(0);
  const [cropInsetBottom, setCropInsetBottom] = useState<number>(0);
  const [cropInsetLeft, setCropInsetLeft] = useState<number>(0);
  const [cropInsetRight, setCropInsetRight] = useState<number>(0);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [submissionId]);

  useEffect(() => {
    if (activeFileId && savedFileStates[activeFileId]) {
      const st = savedFileStates[activeFileId];
      setZoom(st.zoom);
      setRotation(st.rotation);
      setBrightness(st.brightness);
      setContrast(st.contrast);
      setBwMode(st.bwMode);
      setWidthScale(st.widthScale);
      setHeightScale(st.heightScale);
      setCropPreset(st.cropPreset as any);
      setTargetMaxKB(st.targetMaxKB);
      setConvertedToPdf(st.convertedToPdf);
    } else {
      resetEditor();
    }
  }, [activeFileId]);

  const fetchSubmissionDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSubmission(data.submission);

        if (data.submission.files && data.submission.files.length > 0) {
          setActiveFileId(data.submission.files[0].id || data.submission.files[0].filename);
          setSelectedFileIds(data.submission.files.map((f: any) => f.id || f.filename));
        }
      } else {
        setError(`Submission record ${submissionId} not found in database.`);
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

  const handleSaveState = () => {
    if (!activeFileId) return;
    setSavedFileStates((prev) => ({
      ...prev,
      [activeFileId]: {
        zoom,
        rotation,
        brightness,
        contrast,
        bwMode,
        widthScale,
        heightScale,
        cropPreset,
        targetMaxKB,
        convertedToPdf,
      },
    }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const resetEditor = () => {
    setZoom(100);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setBwMode(false);
    setResizePreset('a4');
    setWidthScale(100);
    setHeightScale(100);
    setCropPreset('none');
    setCropInsetTop(0);
    setCropInsetBottom(0);
    setCropInsetLeft(0);
    setCropInsetRight(0);
    setTargetMaxKB(200);
    setConvertedToPdf(false);
  };

  const handleDirectPrint = () => {
    window.print();
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

  const activeFile = submission.files.find(f => (f.id || f.filename) === activeFileId) || submission.files[0];
  const fileViewUrl = `/api/admin/view/${submission.id}/${activeFile?.id || activeFile?.filename}`;
  const isImage = activeFile?.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(activeFile?.original_name || '');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-primary)] text-[var(--color-text)] flex flex-col font-sans">
      
      <header className="bg-[var(--bg-card)] border-b border-[var(--color-border)] px-4 py-3 sticky top-0 z-40 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] hover:bg-[var(--bg-card)] text-[var(--color-text)] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-xs font-extrabold text-[#30AFFF] uppercase tracking-wider">
                Maa Vaishno e-World Workstation Studio
              </span>
              <h1 className="text-base font-black text-[var(--color-text)] tracking-tight">
                Client Order — <span className="font-mono text-[#30AFFF]">{submission.id}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveState}
              className="px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer border bg-[var(--bg-primary)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[#30AFFF]"
            >
              <Save className="w-3.5 h-3.5 text-[#30AFFF]" />
              <span>{savedNotice ? 'Saved!' : 'Save State'}</span>
            </button>

            <button
              onClick={handleDirectPrint}
              className="px-4 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs shadow-xs flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Client Details */}
        <div className="lg:col-span-4 space-y-5 print:hidden">
          <div className="container-box p-5 space-y-4 shadow-2xs rounded-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-[#30AFFF]" />
                <h2 className="text-xs font-extrabold text-[var(--color-text)] uppercase tracking-wider">
                  Client Profile
                </h2>
              </div>
              <button onClick={handleCopyId} className="text-xs font-mono font-bold text-[#30AFFF]">
                {copiedId ? 'Copied!' : submission.id}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <p className="font-bold text-[var(--color-muted-text)]">Client Name</p>
                <p className="text-sm font-black text-[var(--color-text)]">{submission.name}</p>
              </div>

              <div>
                <p className="font-bold text-[var(--color-muted-text)]">Mobile Number</p>
                <p className="text-xs font-mono font-black text-[#30AFFF]">+91 {submission.phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:+91${submission.phone.replace(/\D/g, '')}`}
                  className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>

                <a
                  href={`https://wa.me/91${submission.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-[var(--color-border)] text-xs">
              <div>
                <span className="font-bold text-[var(--color-muted-text)]">Requested Service:</span>
                <p className="font-extrabold text-[var(--color-text)] mt-0.5 bg-[var(--bg-primary)] px-3 py-2 rounded-xl border border-[var(--color-border)]">
                  {submission.purpose}
                </p>
              </div>

              {submission.description && (
                <div>
                  <span className="font-bold text-[var(--color-muted-text)]">Instructions:</span>
                  <p className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-medium text-xs mt-1">
                    "{submission.description}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="container-box p-5 space-y-3 shadow-2xs rounded-2xl">
            <h3 className="text-xs font-extrabold text-[var(--color-text)] uppercase tracking-wider border-b border-[var(--color-border)] pb-2">
              Attached Files ({submission.files?.length || 0})
            </h3>
            
            <div className="space-y-2">
              {submission.files.map((file) => (
                <div
                  key={file.id || file.filename}
                  onClick={() => setActiveFileId(file.id || file.filename)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    (file.id || file.filename) === activeFileId
                      ? 'border-[#30AFFF] bg-[#30AFFF]/10'
                      : 'border-[var(--color-border)] bg-[var(--bg-primary)]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-[var(--color-text)] truncate">{file.original_name}</p>
                    <p className="text-[10px] text-[var(--color-muted-text)] font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Editor / Preview Canvas */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls Bar */}
          <div className="container-box p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(250, prev + 25))}
                className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] font-bold cursor-pointer"
              >
                <ZoomIn className="w-4 h-4 text-[#30AFFF]" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(50, prev - 25))}
                className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] font-bold cursor-pointer"
              >
                <ZoomOut className="w-4 h-4 text-[#30AFFF]" />
              </button>
              <span className="font-mono font-bold text-[var(--color-text)]">{zoom}%</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] font-bold cursor-pointer flex items-center space-x-1"
              >
                <RotateCw className="w-4 h-4 text-[#30AFFF]" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={() => setBwMode(!bwMode)}
                className={`px-3 py-2 rounded-xl font-bold border cursor-pointer ${
                  bwMode ? 'bg-[#30AFFF] text-slate-950 border-[#30AFFF]' : 'bg-[var(--bg-primary)] text-[var(--color-text)] border-[var(--color-border)]'
                }`}
              >
                B/W Xerox Mode
              </button>
            </div>
          </div>

          {/* Document Preview Stage */}
          <div ref={printAreaRef} className="container-box p-6 rounded-2xl min-h-[500px] flex items-center justify-center bg-slate-100 dark:bg-slate-950 border border-[var(--color-border)] overflow-auto relative">
            {isImage ? (
              <img
                ref={imageRef}
                src={fileViewUrl}
                alt={activeFile?.original_name}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  filter: `${bwMode ? 'grayscale(100%) contrast(150%)' : ''} brightness(${brightness}%) contrast(${contrast}%)`,
                  transition: 'transform 0.2s ease, filter 0.2s ease',
                  maxHeight: '650px',
                  objectFit: 'contain'
                }}
                className="rounded-lg shadow-md"
              />
            ) : (
              <iframe
                src={fileViewUrl}
                title={activeFile?.original_name}
                className="w-full h-[650px] rounded-lg border-0"
              />
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
