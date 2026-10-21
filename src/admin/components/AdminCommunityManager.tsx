import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Image as ImageIcon,
  Video,
  X,
  AlertCircle,
  Check,
  Share2,
  ExternalLink,
  Upload,
  Calendar,
  Sparkles,
  Eye,
  Film,
  FileText,
  Crop
} from 'lucide-react';
import { CommunityPost, CommunityCategory } from '../../types';
import ImageCropModal from './ImageCropModal';
import { sanitizeText } from '../../lib/uiSecurity';
import { notifyCommunityChanged, authFetch } from '../../lib/apiCache';

interface AdminCommunityManagerProps {
  adminToken: string;
}

export const AdminCommunityManager: React.FC<AdminCommunityManagerProps> = ({ adminToken }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CommunityCategory>('All');
  const [isUrgentFilter, setIsUrgentFilter] = useState<boolean>(false);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'Scheme' | 'Timing' | 'Jobs' | 'Notice'>('Notice');
  const [formAuthor, setFormAuthor] = useState<string>('Surender Bajwa (Kendra Operator)');
  const [formImportant, setFormImportant] = useState<boolean>(false);

  // Media File uploads & Interactive Cropping State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('photo.jpg');
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/community');
      if (res.ok) {
        const data = await res.json();
        if (data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts);
          localStorage.setItem('mv_community_posts', JSON.stringify(data.posts));
          return;
        }
      }
      const cached = localStorage.getItem('mv_community_posts');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(
              (p: any) => !['COMM_kendra_hours_notice', 'COMM_pm_kisan_notice', 'COMM_ayushman_pvc_notice'].includes(p.id)
            );
            setPosts(cleaned);
            return;
          }
        } catch {}
      }
      setPosts([]);
    } catch (e) {
      console.error('Failed to load community posts:', e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleRemoveVideo();
      setOriginalFileName(file.name);
      
      if (rawImageSrc) {
        URL.revokeObjectURL(rawImageSrc);
      }
      const rawUrl = URL.createObjectURL(file);
      setRawImageSrc(rawUrl);
      setShowCropModal(true); // Open cropper directly
    }
  };

  const handleCropComplete = (
    croppedBlob: Blob,
    croppedPreviewUrl: string,
    mimeType: string,
    extension: string
  ) => {
    const baseName = originalFileName.replace(/\.[^/.]+$/, '') || 'announcement_photo';
    const finalName = `${baseName}_cropped${extension}`;

    const croppedFile = new File([croppedBlob], finalName, {
      type: mimeType,
      lastModified: Date.now(),
    });

    if (imagePreview && imagePreview !== rawImageSrc) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(croppedFile);
    setImagePreview(croppedPreviewUrl);
    setShowCropModal(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setImagePreview(null);
    setRawImageSrc(null);
    setShowCropModal(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleRemoveImage();
      setVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleRemoveMedia = () => {
    handleRemoveImage();
    handleRemoveVideo();
  };

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('Notice');
    setFormAuthor('Surender Bajwa');
    setFormImportant(false);
    handleRemoveMedia();
    setImageUrlInput('');
    setVideoUrlInput('');
    setErrorMessage('');
    setShowCropModal(false);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMessage('Please provide an announcement title.');
      return;
    }
    if (!formContent.trim()) {
      setErrorMessage('Please provide announcement details / content.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('content', formContent.trim());
      formData.append('category', formCategory);
      formData.append('authorName', formAuthor.trim() || 'Surender Bajwa');
      formData.append('important', String(formImportant));

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imageUrlInput.trim()) {
        formData.append('imageUrl', imageUrlInput.trim());
      }

      if (videoFile) {
        formData.append('video', videoFile);
      } else if (videoUrlInput.trim()) {
        formData.append('videoUrl', videoUrlInput.trim());
      }

      const res = await authFetch('/api/community', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 401) return;

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish announcement');
      }

      // Add to list and close
      if (data.post) {
        setPosts((prev) => {
          const updated = [data.post, ...prev];
          try {
            localStorage.setItem('mv_community_posts', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      } else {
        await fetchPosts();
      }

      resetForm();
      setShowCreateModal(false);
      notifyCommunityChanged();
      showToast('Announcement published successfully to Community Channel!');
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setErrorMessage(err.message || 'Error uploading announcement. Please check your network and file size.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string, title: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete this announcement?\n\n"${title}"\n\nThis will permanently remove the post, attached photo, and video from the server.`);
    if (!confirmed) return;

    try {
      const res = await authFetch(`/api/community/${id}`, {
        method: 'DELETE',
      });

      if (res.status === 401) return;

      if (res.ok) {
        setPosts((prev) => {
          const updated = prev.filter((p) => p.id !== id);
          try {
            localStorage.setItem('mv_community_posts', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        notifyCommunityChanged();
        showToast('Announcement and associated media deleted.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete announcement.');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Error communicating with server while deleting.');
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleCopyPostLink = (id: string) => {
    const url = `${window.location.origin}/community?id=${id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedPostId(id);
      setTimeout(() => setCopiedPostId(null), 2500);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Filtered Posts
  const filteredPosts = posts.filter((p) => {
    if (isUrgentFilter && !p.important) return false;
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchContent = p.content.toLowerCase().includes(q);
      const matchAuthor = (p.authorName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    return true;
  });

  const urgentCount = posts.filter((p) => p.important).length;
  const mediaCount = posts.filter((p) => p.imageUrl || p.videoUrl).length;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Community Manager Header & Action Bar */}
      <div className="container-box p-4 rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-black text-[var(--color-text)] tracking-tight">
              Community Channel Management
            </h2>
          </div>
          <p className="text-xs text-[var(--color-muted-text)] font-semibold mt-0.5">
            Post updates, schemes, informational photos, and operator videos directly to citizens.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Public Page Link */}
          <a
            href="/community"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-xs font-bold text-[var(--color-text)] flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Open public community page in new tab"
          >
            <Eye className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span>View Public Channel ↗</span>
          </a>

          {/* Refresh */}
          <button
            onClick={fetchPosts}
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--bg-card)] text-xs font-bold cursor-pointer"
            title="Refresh announcements list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#30AFFF] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Bar & Highlighted Add Post Button */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs">
          <p className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase">Total Announcements</p>
          <p className="text-xl font-black text-[var(--color-text)] mt-0.5">{posts.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs">
          <p className="text-[11px] font-bold text-rose-500 uppercase flex items-center space-x-1">
            <span>🚨 Urgent Alerts</span>
          </p>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{urgentCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs">
          <p className="text-[11px] font-bold text-[var(--color-muted-text)] uppercase flex items-center space-x-1">
            <Film className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span>Media Attached</span>
          </p>
          <p className="text-xl font-black text-[#30AFFF] mt-0.5">{mediaCount}</p>
        </div>
        {/* Highlighted Add Post Button replacing "Hosting Storage Zero Extra Cost" */}
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="p-3 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black flex flex-col justify-between items-start transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 group border border-[#30AFFF]/50"
          title="Create & broadcast new community announcement"
        >
          <div className="flex items-center space-x-1.5 w-full justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
              Create Post
            </span>
            <div className="w-5 h-5 rounded-md bg-slate-950/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-3.5 h-3.5 stroke-[3] text-slate-950" />
            </div>
          </div>
          <p className="text-sm sm:text-base font-black text-slate-950 mt-1 flex items-center space-x-1">
            <span>+ Add Post</span>
          </p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="container-box p-3.5 rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {(['All', 'Scheme', 'Jobs', 'Timing', 'Notice'] as CommunityCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoryFilter(cat);
                setIsUrgentFilter(false);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs ${
                categoryFilter === cat && !isUrgentFilter
                  ? 'bg-[#30AFFF] text-slate-950 font-black'
                  : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
              }`}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}

          {/* Urgent Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsUrgentFilter(!isUrgentFilter)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs flex items-center space-x-1 ${
              isUrgentFilter
                ? 'bg-rose-600 text-white font-black'
                : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <span>🚨 Urgent Only ({urgentCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[var(--color-muted-text)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcement title, content..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--color-muted-text)] hover:text-[var(--color-text)]"
            >
              Clear
            </button>
          )}
        </div>

      </div>

      {/* Posts Stream / List */}
      {loading ? (
        <div className="container-box p-12 text-center text-xs font-bold text-[var(--color-muted-text)] rounded-2xl border border-[var(--color-border)]">
          Loading announcements...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="container-box p-12 text-center space-y-3 rounded-2xl border border-[var(--color-border)]">
          <FileText className="w-10 h-10 text-[var(--color-muted-text)] mx-auto opacity-40" />
          <p className="text-sm font-bold text-[var(--color-text)]">No announcements found</p>
          <p className="text-xs text-[var(--color-muted-text)]">
            {search ? 'Try modifying your search filter.' : 'Click "+ Post New Announcement" to broadcast to citizens.'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#30AFFF] text-slate-950 text-xs font-bold cursor-pointer inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Announcement</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`container-box rounded-2xl border transition-all overflow-hidden ${
                post.important
                  ? 'border-rose-300 dark:border-rose-900/60 shadow-xs'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
              }`}
            >
              {/* Card Header */}
              <div className="px-4 py-3 bg-[var(--bg-primary)]/60 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-[var(--color-text)]">
                    {post.authorName || 'Surender Bajwa'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)]">
                    {post.category}
                  </span>
                  {post.important && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white flex items-center space-x-1">
                      <span>🚨 Urgent Alert</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-[var(--color-muted-text)] font-semibold">
                    {formatDate(post.createdAt)}
                  </span>

                  {/* Share Deep-Link */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyPostLink(post.id);
                    }}
                    className="p-1.5 rounded-xl border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] cursor-pointer transition-colors"
                    title="Copy direct share link to this post"
                  >
                    {copiedPostId === post.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-[#30AFFF]" />
                    )}
                  </button>

                  {/* View Public Link */}
                  <a
                    href={`/community?id=${post.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-xl border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] cursor-pointer transition-colors"
                    title="Open on live public page"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#30AFFF]" />
                  </a>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeletePost(post.id, post.title);
                    }}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-300 dark:hover:border-rose-900 transition-colors cursor-pointer"
                    title="Delete announcement from portal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-3">
                <h3 className="text-base sm:text-lg font-black text-[var(--color-text)] tracking-tight">
                  {post.title}
                </h3>

                <p className="text-xs sm:text-sm text-[var(--color-text)] font-normal leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Media Section: Photos & Videos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Photo Display */}
                  {post.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-slate-950/5 dark:bg-slate-900/30">
                      <div className="px-3 py-1.5 bg-[var(--bg-primary)] border-b border-[var(--color-border)] text-[11px] font-bold text-[var(--color-muted-text)] flex items-center space-x-1.5">
                        <ImageIcon className="w-3 h-3 text-[#30AFFF]" />
                        <span>Attached Photo (Cropped Area)</span>
                      </div>
                      <div className="p-1 flex items-center justify-center bg-slate-950/5">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-auto max-h-72 object-contain rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}

                  {/* Video Display */}
                  {post.videoUrl && (
                    <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-black">
                      <div className="px-3 py-1.5 bg-[var(--bg-primary)] border-b border-[var(--color-border)] text-[11px] font-bold text-[var(--color-muted-text)] flex items-center space-x-1.5">
                        <Video className="w-3 h-3 text-rose-500" />
                        <span>Attached Operator Video</span>
                      </div>
                      <video
                        src={post.videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-56 object-contain bg-black"
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW ANNOUNCEMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
          <div className="container-box rounded-2xl w-full max-w-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative border border-[var(--color-border)] my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-base font-black text-[var(--color-text)] tracking-tight">
                Post Community Announcement
              </h3>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Creation Form */}
            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              
              {/* Title with Strict Character Limit & Counter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--color-text)]">
                    Announcement Title <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-[var(--color-muted-text)] font-mono">
                    {formTitle.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={formTitle}
                  onChange={(e) => setFormTitle(sanitizeText(e.target.value, 120))}
                  placeholder="e.g. PM Kisan Samman Nidhi 19th Installment e-KYC Started"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
                />
              </div>

              {/* Category & Urgent Alert Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--color-text)]">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] focus:outline-none cursor-pointer"
                  >
                    <option value="Notice">Notice (सामान्य सूचना)</option>
                    <option value="Scheme">Scheme (सरकारी योजना)</option>
                    <option value="Jobs">Jobs (नौकरी व भर्ती)</option>
                    <option value="Timing">Timing (केन्द्र समय व अवकाश)</option>
                  </select>
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] flex items-center justify-between h-[42px]">
                  <label htmlFor="urgentToggle" className="font-extrabold text-[var(--color-text)] text-xs flex items-center space-x-1.5 cursor-pointer select-none">
                    <span>🚨 Urgent Alert</span>
                  </label>
                  <input
                    type="checkbox"
                    id="urgentToggle"
                    checked={formImportant}
                    onChange={(e) => setFormImportant(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Description Textarea with Character Counter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--color-text)]">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-[var(--color-muted-text)] font-mono">
                    {formContent.length}/2000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={formContent}
                  onChange={(e) => setFormContent(sanitizeText(e.target.value, 2000))}
                  placeholder="Write full details, required documents, deadlines, or instructions for the public..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF] leading-relaxed resize-y"
                />
              </div>

              {/* MEDIA ATTACHMENT (SINGLE: PHOTO OR VIDEO) */}
              <div className="space-y-2 pt-1 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--color-text)] text-xs">
                    Media Attachment
                  </span>
                  {(imagePreview || videoPreview) && (
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
                    >
                      Remove Media
                    </button>
                  )}
                </div>

                {imagePreview ? (
                  <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text)]">
                      <span className="flex items-center space-x-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#30AFFF]" />
                        <span>Attached Photo</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold">
                          Cropped & Framed
                        </span>
                      </span>

                      <div className="flex items-center space-x-1.5">
                        {rawImageSrc && (
                          <button
                            type="button"
                            onClick={() => setShowCropModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[11px] font-bold text-[#30AFFF] flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                            title="Re-open cropping tool to adjust visible portion"
                          >
                            <Crop className="w-3 h-3" />
                            <span>Edit Crop Area</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold text-rose-500 cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border border-[var(--color-border)] max-h-52 bg-slate-950/5 flex items-center justify-center">
                      <img src={imagePreview} alt="Preview" className="w-full max-h-52 object-contain" />
                    </div>
                  </div>
                ) : videoPreview ? (
                  <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text)]">
                      <span className="flex items-center space-x-1.5">
                        <Video className="w-3.5 h-3.5 text-rose-500" />
                        <span>Attached Video</span>
                      </span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border border-[var(--color-border)] max-h-48 bg-black">
                      <video src={videoPreview} controls className="w-full h-48 object-contain" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Photo Option */}
                    <div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                        id="adminPhotoInput"
                      />
                      <label
                        htmlFor="adminPhotoInput"
                        className="w-full py-3.5 px-3 border-2 border-dashed border-[var(--color-border)] hover:border-[#30AFFF] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-[var(--bg-card)] text-center group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#30AFFF]/15 text-[#30AFFF] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-[var(--color-text)]">Upload Photo</span>
                      </label>
                    </div>

                    {/* Video Option */}
                    <div>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/ogg"
                        onChange={handleVideoChange}
                        className="hidden"
                        id="adminVideoInput"
                      />
                      <label
                        htmlFor="adminVideoInput"
                        className="w-full py-3.5 px-3 border-2 border-dashed border-[var(--color-border)] hover:border-rose-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-[var(--bg-card)] text-center group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <Video className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-[var(--color-text)]">Upload Video</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--bg-primary)] text-xs font-bold text-[var(--color-text)] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 text-xs font-black flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading & Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Publish Announcement</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Interactive Image Crop Studio Modal */}
      {showCropModal && rawImageSrc && (
        <ImageCropModal
          imageSrc={rawImageSrc}
          originalFileName={originalFileName}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropModal(false);
            if (!imageFile) {
              handleRemoveImage();
            }
          }}
        />
      )}

    </div>
  );
};

export default AdminCommunityManager;
