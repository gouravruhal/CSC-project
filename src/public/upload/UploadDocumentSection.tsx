import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  Trash2, 
  RefreshCw, 
  Plus, 
  CheckCircle2,
  CloudUpload
} from 'lucide-react';
import { Language, ManagedServiceItem } from '../../types';
import { sanitizeText, sanitizePhone, validateIndianPhone } from '../../lib/uiSecurity';
import { 
  getCachedWebsiteContent, 
  getCachedCounterStatus,
  subscribeToCounterStatus,
  subscribeToWebsiteContent
} from '../../lib/apiCache';

interface UploadDocumentSectionProps {
  preselectedPurpose?: string;
  onSuccess: (submissionData: any) => void;
  language: Language;
}

interface QueuedFile {
  file: File;
  id: string;
  previewUrl?: string;
  validationError?: string;
}

export const UploadDocumentSection: React.FC<UploadDocumentSectionProps> = ({
  preselectedPurpose = '',
  onSuccess,
  language,
}) => {
  // Form States
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [purpose, setPurpose] = useState(preselectedPurpose || 'General Service Request');
  const [description, setDescription] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  
  // UI States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csrfToken, setCsrfToken] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [lastSubmissionSuccess, setLastSubmissionSuccess] = useState<any | null>(null);

  const [sessionKey] = useState<string>(() => `SESSION-${Date.now().toString(36).toUpperCase()}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [counterStatus, setCounterStatus] = useState<{ isOpen: boolean; reason?: string }>({ isOpen: true });
  const [availableServices, setAvailableServices] = useState<ManagedServiceItem[]>(() => {
    try {
      const cached = localStorage.getItem('mv_website_content');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.servicesList) && parsed.servicesList.length > 0) {
          return parsed.servicesList;
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    let isMounted = true;
    fetchCsrfToken();
    checkCounterStatus();

    getCachedWebsiteContent().then((content) => {
      if (isMounted && content?.servicesList && Array.isArray(content.servicesList)) {
        setAvailableServices(content.servicesList);
      }
    });

    const unsubCounter = subscribeToCounterStatus((data) => {
      if (!isMounted) return;
      const open = typeof data.isOpen === 'boolean' ? data.isOpen : true;
      setCounterStatus({
        isOpen: open,
        reason: data.reason || data.statusText || 'Counter Closed: Open Mon–Sat 8:30 AM – 7:30 PM IST',
      });
    });

    const unsubContent = subscribeToWebsiteContent((content) => {
      if (isMounted && content?.servicesList && Array.isArray(content.servicesList)) {
        setAvailableServices(content.servicesList);
      }
    });

    return () => {
      isMounted = false;
      unsubCounter();
      unsubContent();
    };
  }, []);

  useEffect(() => {
    if (preselectedPurpose) {
      setPurpose(preselectedPurpose);
    }
  }, [preselectedPurpose]);

  const checkCounterStatus = async (): Promise<boolean> => {
    try {
      const data = await getCachedCounterStatus();
      const open = typeof data.isOpen === 'boolean' ? data.isOpen : true;
      setCounterStatus({
        isOpen: open,
        reason: data.reason || data.statusText || 'Counter Closed: Open Mon–Sat 8:30 AM – 7:30 PM IST',
      });
      return open;
    } catch (e) {
      console.error('Failed to fetch counter status:', e);
    }
    return true;
  };

  const fetchCsrfToken = async () => {
    try {
      const res = await fetch('/api/csrf-token');
      if (res.ok) {
        const data = await res.json();
        if (data && data.csrfToken) setCsrfToken(data.csrfToken);
      }
    } catch (e) {
      console.error('Failed to fetch CSRF token:', e);
    }
  };

  const resetFormForMoreUploads = () => {
    setQueuedFiles([]);
    setDescription('');
    setErrors({});
    setUploadProgress(0);
    setLastSubmissionSuccess(null);
    fetchCsrfToken();
  };

  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.zip'];
  const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.dll', '.php', '.html', '.htm', '.svg', '.js', '.sh', '.scr'];

  const validateFileClient = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (DISALLOWED_EXTENSIONS.includes(ext)) return `Format (${ext}) is blocked for safety.`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) return `Format not supported (${ext}).`;
    if (file.size > 25 * 1024 * 1024) return `File exceeds 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`;
    if (file.size === 0) return 'File is empty.';
    return null;
  };

  const handleFilesAdded = (files: FileList | File[]) => {
    const newQueue: QueuedFile[] = [...queuedFiles];
    let fileError = '';

    for (let i = 0; i < files.length; i++) {
      if (newQueue.length >= 10) {
        fileError = 'Maximum 10 files allowed.';
        break;
      }
      const f = files[i];
      const validationErr = validateFileClient(f);
      let previewUrl: string | undefined = undefined;
      if (f.type.startsWith('image/')) previewUrl = URL.createObjectURL(f);

      newQueue.push({
        file: f,
        id: Math.random().toString(36).substring(2, 9),
        previewUrl,
        validationError: validationErr || undefined,
      });
    }

    setQueuedFiles(newQueue);
    if (fileError) setErrors((prev) => ({ ...prev, files: fileError }));
    else setErrors((prev) => { const copy = { ...prev }; delete copy.files; return copy; });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFilesAdded(e.dataTransfer.files);
  };

  const removeFileFromQueue = (id: string) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  const validateForm = (): boolean => {
    const newErrs: Record<string, string> = {};

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      newErrs.fullName = 'Enter your name (at least 2 letters).';
    } else if (cleanName.length > 60) {
      newErrs.fullName = 'Name must not exceed 60 characters.';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(cleanName)) {
      newErrs.fullName = 'Name can only contain alphabetic letters, spaces, dots, and hyphens.';
    }

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrs.mobileNumber = 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }

    if (description.length > 500) {
      newErrs.description = 'Instructions must not exceed 500 characters.';
    }

    if (queuedFiles.length === 0) {
      newErrs.files = 'Attach at least one document file to upload.';
    }

    if (queuedFiles.length > 10) {
      newErrs.files = 'Maximum 10 files allowed per submission.';
    }

    if (queuedFiles.some((item) => item.validationError)) {
      newErrs.files = 'Remove invalid or unsafe files before submitting.';
    }

    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Client-side debounce rate limit against rapid repeat clicking
    const now = Date.now();
    if (now - lastSubmitTime < 3000) {
      setErrors((prev) => ({ ...prev, submit: 'Please wait a few seconds before submitting again.' }));
      return;
    }
    setLastSubmitTime(now);

    // Re-verify counter status live before submission
    const isOpenNow = await checkCounterStatus();
    if (!isOpenNow) {
      setErrors((prev) => ({
        ...prev,
        submit: counterStatus.reason || 'Counter Closed: Submissions are accepted Monday–Saturday 8:30 AM to 7:30 PM IST.',
      }));
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append('name', fullName.trim());
      formData.append('phone', mobileNumber.replace(/\D/g, ''));
      formData.append('purpose', purpose.trim() || 'General Service Request');
      formData.append('description', description.trim());
      formData.append('autonomousId', sessionKey);
      formData.append('csrfToken', csrfToken);

      queuedFiles.forEach((item) => formData.append('files', item.file));

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 85 ? (clearInterval(progressInterval), 85) : prev + 20));
      }, 180);

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json().catch(() => null);

      if (response.status === 429) {
        throw new Error(data?.error || 'Rate limit exceeded: Too many document uploads from this network. Please wait 15 minutes before uploading again.');
      }

      if (response.status === 403) {
        throw new Error(data?.error || 'Counter is currently closed or security session has expired.');
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit documents. Please check your inputs and try again.');
      }

      setLastSubmissionSuccess(data.submission);
      setIsSubmitting(false);
      setQueuedFiles([]);
      setDescription('');
      fetchCsrfToken();

      // Smooth auto-transition to success ticket after brief confirmation
      setTimeout(() => {
        if (data.submission) {
          onSuccess(data.submission);
        }
      }, 1200);

    } catch (err: any) {
      setIsSubmitting(false);
      setUploadProgress(0);
      setErrors((prev) => ({ ...prev, submit: err.message || 'Error submitting files.' }));
      fetchCsrfToken();
    }
  };

  return (
    <section id="upload-section" className="py-8 bg-[var(--bg-primary)] w-full max-w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Minimal Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tracking-tight">
            {language === 'hi' ? 'दस्तावेज़ अपलोड करें' : 'Upload Documents'}
          </h2>
          <p className="text-xs text-[var(--color-muted-text)] font-medium">
            Send files directly to Maa Vaishno e-World counter queue
          </p>
        </div>

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.zip"
          onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
          className="hidden"
        />

        {/* Minimalist Card Container */}
        <div className="container-box p-6 sm:p-8 shadow-sm rounded-3xl space-y-6">
          
          {/* Success Banner */}
          {lastSubmissionSuccess && (
            <div className="p-4 rounded-2xl bg-[#C4F7CA]/20 border border-[#C4F7CA]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-[#C4F7CA] shrink-0" />
                <div>
                  <p className="font-extrabold text-[var(--color-text)]">
                    Documents Submitted Successfully!
                  </p>
                  <p className="text-[11px] text-[var(--color-muted-text)] font-mono">
                    ID: {lastSubmissionSuccess.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={resetFormForMoreUploads}
                  className="px-3.5 py-1.5 rounded-xl bg-[#30AFFF] text-slate-950 font-black hover:bg-[#209CEF] transition-all cursor-pointer text-xs"
                >
                  + Upload More
                </button>
                <button
                  type="button"
                  onClick={() => onSuccess(lastSubmissionSuccess)}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-xs"
                >
                  View Ticket
                </button>
              </div>
            </div>
          )}

          {/* Error Banner (e.g. Counter Closed or Rate Limited) */}
          {errors.submit && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-600 dark:text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errors.submit}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Row 1: Name & Phone with Strict UI Security & Character Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-[var(--color-muted-text)] font-mono">
                    {fullName.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  value={fullName}
                  onChange={(e) => {
                    const cleaned = sanitizeText(e.target.value, 60);
                    setFullName(cleaned);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  placeholder="Enter your name"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border ${
                    errors.fullName ? 'border-red-500' : 'border-[var(--color-border)]'
                  } focus:border-[#30AFFF] focus:outline-none text-xs text-[var(--color-text)] font-medium transition-colors`}
                />
                {errors.fullName && <p className="mt-1 text-[11px] text-red-500 font-semibold">{errors.fullName}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                    Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-[var(--color-muted-text)] font-mono">
                    {mobileNumber.length}/10
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-muted-text)]">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => {
                      const cleaned = sanitizePhone(e.target.value);
                      setMobileNumber(cleaned);
                      if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: '' }));
                    }}
                    placeholder="10-digit mobile number"
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border ${
                      errors.mobileNumber ? 'border-red-500' : 'border-[var(--color-border)]'
                    } focus:border-[#30AFFF] focus:outline-none text-xs font-mono text-[var(--color-text)] transition-colors`}
                  />
                </div>
                {errors.mobileNumber && <p className="mt-1 text-[11px] text-red-500 font-semibold">{errors.mobileNumber}</p>}
              </div>
            </div>

            {/* Row 2: Service (Optional) & Instructions (Optional) with Character Counter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1.5 uppercase tracking-wider">
                  Work Required <span className="text-[var(--color-muted-text)] font-normal">(Optional)</span>
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] focus:border-[#30AFFF] focus:outline-none text-xs text-[var(--color-text)] cursor-pointer"
                >
                  <option value="General Service Request">General Counter Service</option>
                  {availableServices
                    .filter((s) => !s.isClosed)
                    .map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  {preselectedPurpose &&
                    !availableServices.some((s) => s.name === preselectedPurpose) &&
                    preselectedPurpose !== 'General Service Request' && (
                      <option value={preselectedPurpose}>{preselectedPurpose}</option>
                    )}
                  <option value="OTHER">Other Custom Request</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                    Instructions <span className="text-[var(--color-muted-text)] font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-[var(--color-muted-text)] font-mono">
                    {description.length}/500
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={500}
                  value={description}
                  onChange={(e) => {
                    const cleaned = sanitizeText(e.target.value, 500);
                    setDescription(cleaned);
                  }}
                  placeholder="e.g. Color print, 2 copies back-to-back"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] focus:border-[#30AFFF] focus:outline-none text-xs text-[var(--color-text)] transition-colors"
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-7 sm:p-9 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer group ${
                dragActive
                  ? 'border-[#30AFFF] bg-[#30AFFF]/10'
                  : errors.files
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-[var(--color-border)] hover:border-[#30AFFF] bg-[var(--bg-primary)]'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-2.5">
                <div className="w-12 h-12 rounded-xl bg-[#30AFFF]/10 text-[#30AFFF] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CloudUpload className="w-6 h-6 text-[#30AFFF]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[var(--color-text)]">
                    Click to browse or drag & drop files
                  </p>
                  <p className="text-[11px] text-[var(--color-muted-text)] font-medium mt-0.5">
                    PDF, PNG, JPG, WEBP, DOC, DOCX, TXT, ZIP • Max 25MB per file • Up to 10 files
                  </p>
                </div>
              </div>
            </div>

            {errors.files && (
              <p className="text-xs text-red-500 font-semibold flex items-center space-x-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.files}</span>
              </p>
            )}

            {/* Attached Documents Grid Below Dropzone */}
            {queuedFiles.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                    Attached Files ({queuedFiles.length}/10)
                  </h4>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-[#30AFFF] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More Files</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {queuedFiles.map((item) => {
                    const isImage = item.file.type.startsWith('image/');
                    const sizeMb = (item.file.size / (1024 * 1024)).toFixed(1);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl bg-[var(--bg-primary)] border flex items-center justify-between space-x-3 transition-colors ${
                          item.validationError ? 'border-red-400 bg-red-50/10' : 'border-[var(--color-border)]'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {isImage && item.previewUrl ? (
                            <img src={item.previewUrl} alt={item.file.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#30AFFF]/15 text-[#30AFFF] flex items-center justify-center shrink-0 font-extrabold text-[10px] uppercase">
                              {item.file.name.split('.').pop()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--color-text)] truncate" title={item.file.name}>
                              {item.file.name}
                            </p>
                            <p className="text-[10px] text-[var(--color-muted-text)] font-mono">
                              {sizeMb} MB {item.validationError && <span className="text-red-500 font-bold ml-1">• {item.validationError}</span>}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFileFromQueue(item.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Upload Progress Bar */}
            {isSubmitting && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-bold text-[var(--color-text)]">
                  <span>Uploading files securely to Kendra counter queue...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#30AFFF] transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}



            {/* Prominent Bottom Submit Button Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--color-border)] shadow-xs">
              <div className="text-left w-full sm:w-auto">
                <p className="text-xs font-black text-[var(--color-text)]">
                  Ready to send to operator counter?
                </p>
                <p className="text-[11px] text-[var(--color-muted-text)] font-medium">
                  {queuedFiles.length > 0
                    ? `${queuedFiles.length} file(s) attached (${(queuedFiles.reduce((acc, f) => acc + f.file.size, 0) / (1024 * 1024)).toFixed(1)} MB total)`
                    : 'Attach your documents above to submit'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !counterStatus.isOpen}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 ${
                  isSubmitting || !counterStatus.isOpen
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                <Upload className="w-4 h-4 text-slate-950 shrink-0" />
                <span>
                  {isSubmitting
                    ? `Uploading (${uploadProgress}%)...`
                    : !counterStatus.isOpen
                    ? 'Counter Closed'
                    : 'Upload Documents Now'}
                </span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </section>
  );
};
