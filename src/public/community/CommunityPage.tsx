import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Share2, 
  Check, 
  X, 
  Upload, 
  ArrowLeft, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';
import { Language, CommunityPost, CommunityCategory, AdminUser } from '../../types';
import { subscribeToCommunityUpdates } from '../../lib/apiCache';

interface CommunityPageProps {
  language: Language;
  adminUser?: AdminUser | null;
  adminToken?: string;
  onNavigateToUpload: () => void;
  onBackToHome: () => void;
  onNavigateToAdminCommunity?: () => void;
}

const POSTS_PER_PAGE = 10;

export const CommunityPage: React.FC<CommunityPageProps> = ({
  language,
  adminUser,
  onNavigateToUpload,
  onBackToHome,
  onNavigateToAdminCommunity,
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Highlight target post when deep-linked
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

  // Image Lightbox state
  const [activeImagePost, setActiveImagePost] = useState<CommunityPost | null>(null);

  // Share feedback state
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunityPosts();
    const unsub = subscribeToCommunityUpdates(() => {
      fetchCommunityPosts();
    });
    return () => unsub();
  }, []);

  const fetchCommunityPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/community');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
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
    } catch (err) {
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
    } finally {
      setLoading(false);
    }
  };

  // Reset pagination to page 1 whenever search query or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Deep-link auto scroll when URL contains ?id=COMM_... or #post-COMM_...
  useEffect(() => {
    if (posts.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id') || window.location.hash.replace('#post-', '').replace('#', '');

    if (targetId) {
      // Find what page this post is on
      const postIdx = filteredPosts.findIndex((p) => p.id === targetId);
      if (postIdx !== -1) {
        const targetPage = Math.floor(postIdx / POSTS_PER_PAGE) + 1;
        setCurrentPage(targetPage);
        setHighlightedPostId(targetId);

        setTimeout(() => {
          const el = document.getElementById(`post-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        setTimeout(() => {
          setHighlightedPostId(null);
        }, 4000);
      }
    }
  }, [posts]);

  // Filter posts across entire collection
  const filteredPosts = posts.filter((post) => {
    if (selectedCategory === 'Urgent') {
      if (!post.important) return false;
    } else if (selectedCategory !== 'All') {
      if (post.category !== selectedCategory) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      post.title.toLowerCase().includes(q) ||
      post.content.toLowerCase().includes(q) ||
      (post.authorName && post.authorName.toLowerCase().includes(q))
    );
  });

  // Calculate pagination across filtered posts
  const totalPosts = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  // Share direct deep link to the post
  const handleSharePostLink = (post: CommunityPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const postUrl = `${window.location.origin}/community?id=${post.id}`;

    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: `📢 ${post.title}\n\n${post.content.substring(0, 180)}...\n\nRead official notice at Maa Vaishno e-World:`,
        url: postUrl,
      }).catch(() => {
        // User cancelled or clipboard fallback
        navigator.clipboard.writeText(postUrl);
        setSharedPostId(post.id);
        setTimeout(() => setSharedPostId(null), 2500);
      });
    } else {
      navigator.clipboard.writeText(postUrl);
      setSharedPostId(post.id);
      setTimeout(() => setSharedPostId(null), 2500);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

      if (diffHours < 24 && d.getDate() === now.getDate()) {
        return `Today at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="py-4 sm:py-8 bg-[var(--bg-primary)] min-h-[85vh] transition-colors w-full max-w-full overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 space-y-4 sm:space-y-6">
        
        {/* Channel Header (Clean, Verified Badge Removed) */}
        <div className="container-box p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--color-border)] p-1.5 flex items-center justify-center shadow-xs shrink-0">
                <img
                  src="/logo.png"
                  alt="Maa Vaishno e-World Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-base sm:text-lg font-black text-[var(--color-text)] tracking-tight uppercase font-sans">
                  MAA VAISHNO e-WORLD
                </h1>
                <p className="text-xs text-[var(--color-muted-text)] font-semibold">
                  CSC Community Channel • Rairkalan, Panipat
                </p>
                <p className="text-[11px] text-[var(--color-muted-text)] font-medium mt-0.5">
                  {totalPosts} Official Update{totalPosts === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* Back to Home Button */}
              <button
                type="button"
                onClick={onBackToHome}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-xs font-bold text-[var(--color-text)] flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
                title="Return to home page"
              >
                <ArrowLeft className="w-4 h-4 text-[#30AFFF]" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>

          </div>
        </div>

        {/* Global Search & Category Filters (Includes 'Urgent' Filter) */}
        <div className="space-y-2.5">
          {/* Search bar (Searches all posts across all pages) */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--color-muted-text)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'सभी पृष्ठों में खोजें (उदा. किसान, भर्ती, योजना)...' : 'Search all posts (e.g. Kisan, Police, Scheme)...'}
              className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder-[var(--color-muted-text)] focus:outline-none focus:border-[#30AFFF] transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-muted-text)] hover:text-[var(--color-text)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Chips Bar (Includes 'Urgent' Filter) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
            {(['All', 'Urgent', 'Scheme', 'Jobs', 'Notice'] as CommunityCategory[]).map((cat) => {
              const isSelected = selectedCategory === cat;
              const labelMap: Record<CommunityCategory, string> = {
                All: language === 'hi' ? 'सभी अपडेट' : 'All Updates',
                Urgent: language === 'hi' ? '🚨 जरूरी सूचना (Urgent)' : '🚨 Urgent Alerts',
                Scheme: language === 'hi' ? 'सरकारी योजनाएं' : 'Govt Schemes',
                Jobs: language === 'hi' ? 'नौकरी सूचना' : 'Job Alerts',
                Notice: language === 'hi' ? 'सामान्य नोटिस' : 'Notices',
              };

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 text-xs ${
                    isSelected
                      ? 'bg-[#30AFFF] text-slate-950 font-black shadow-xs'
                      : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {labelMap[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Post Feed Stream */}
        {loading ? (
          <div className="container-box p-12 text-center text-xs font-bold text-[var(--color-muted-text)] rounded-2xl">
            Loading community updates...
          </div>
        ) : paginatedPosts.length === 0 ? (
          <div className="container-box p-12 text-center space-y-3 rounded-2xl border border-[var(--color-border)]">
            <h3 className="text-sm font-bold text-[var(--color-text)]">No announcements found</h3>
            <p className="text-xs text-[var(--color-muted-text)] max-w-sm mx-auto">
              {searchQuery ? `No updates match "${searchQuery}". Try clearing search.` : 'No posts in this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs font-bold text-[#30AFFF] cursor-pointer"
              >
                Reset Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedPosts.map((post) => {
              const isHighlighted = highlightedPostId === post.id;

              return (
                <article
                  key={post.id}
                  id={`post-${post.id}`}
                  className={`container-box rounded-2xl sm:rounded-3xl border shadow-xs transition-all overflow-hidden flex flex-col ${
                    isHighlighted
                      ? 'border-[#30AFFF] ring-2 ring-[#30AFFF]/40 shadow-lg'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                  }`}
                >
                  {/* Clean Post Header: Left = Owner Name only, Right = Timing only */}
                  <div className="px-4 py-3 sm:px-6 flex items-center justify-between border-b border-[var(--color-border)]/60 bg-[var(--bg-primary)]/40 text-xs">
                    <span className="font-extrabold text-[var(--color-text)] tracking-tight">
                      {post.authorName || 'Surender Bajwa'}
                    </span>

                    <span className="font-mono text-[11px] text-[var(--color-muted-text)] font-semibold">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>

                  {/* Post Content */}
                  <div className="p-4 sm:p-6 space-y-3.5">
                    <h2 className="text-base sm:text-lg font-black text-[var(--color-text)] tracking-tight leading-snug">
                      {post.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-[var(--color-text)] font-normal leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Video Attachment (if operator uploaded video) */}
                    {post.videoUrl && (
                      <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-black shadow-xs">
                        <video
                          src={post.videoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-[420px] object-contain rounded-2xl"
                        />
                      </div>
                    )}

                    {/* Image Attachment (Tap to view full-size lightbox) */}
                    {post.imageUrl && (
                      <div
                        onClick={() => setActiveImagePost(post)}
                        className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-slate-950/5 dark:bg-slate-900/30 group cursor-pointer flex items-center justify-center transition-all hover:border-[#30AFFF]/50 shadow-xs"
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-auto max-h-[560px] object-contain rounded-2xl block transition-transform duration-300 group-hover:scale-[1.008]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="px-3.5 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg backdrop-blur-xs">
                            <Maximize2 className="w-3.5 h-3.5 text-[#30AFFF]" />
                            <span>Click for Fullscreen View</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Post Footer Action Bar: Share direct post link & Upload Document */}
                  <div className="px-4 py-3 sm:px-6 bg-[var(--bg-primary)] border-t border-[var(--color-border)] flex items-center justify-between gap-2 text-xs">
                    
                    {/* Share Post Link Button */}
                    <button
                      onClick={(e) => handleSharePostLink(post, e)}
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-[var(--color-text)] font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-all hover:scale-[1.02]"
                      title="Share link directly to this announcement"
                    >
                      {sharedPostId === post.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-[#30AFFF]" />
                          <span>Share Link</span>
                        </>
                      )}
                    </button>

                    {/* Upload Document Action Button */}
                    <button
                      onClick={onNavigateToUpload}
                      className="px-4 py-1.5 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-950" />
                      <span>Upload Document</span>
                    </button>

                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* 10 Post Per Page Pagination Controls */}
        {totalPosts > 0 && (
          <div className="container-box p-4 rounded-2xl border border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
            <span className="text-[var(--color-muted-text)] font-semibold">
              Showing {startIndex + 1}–{Math.min(startIndex + POSTS_PER_PAGE, totalPosts)} of {totalPosts} Announcements
            </span>

            <div className="flex items-center space-x-2 font-bold">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs flex items-center space-x-1 ${
                  currentPage === 1
                    ? 'opacity-40 cursor-not-allowed border-[var(--color-border)]'
                    : 'border-[var(--color-border)] hover:border-[#30AFFF] bg-[var(--bg-card)] cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] font-mono text-xs">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs flex items-center space-x-1 ${
                  currentPage === totalPages
                    ? 'opacity-40 cursor-not-allowed border-[var(--color-border)]'
                    : 'border-[var(--color-border)] hover:border-[#30AFFF] bg-[var(--bg-card)] cursor-pointer'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {activeImagePost && activeImagePost.imageUrl && (
        <div
          onClick={() => setActiveImagePost(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-150"
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between text-white max-w-4xl mx-auto w-full pb-3 border-b border-white/20"
          >
            <div className="min-w-0 pr-4">
              <p className="text-xs sm:text-sm font-extrabold truncate text-white">
                {activeImagePost.title}
              </p>
              <p className="text-[10px] text-white/70 font-mono">
                {formatDate(activeImagePost.createdAt)}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={(e) => handleSharePostLink(activeImagePost, e)}
                className="px-3 py-1.5 rounded-xl bg-[#30AFFF] text-slate-950 font-bold text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                onClick={() => setActiveImagePost(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                title="Close photo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Photo Stage */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
          >
            <img
              src={activeImagePost.imageUrl}
              alt={activeImagePost.title}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Bottom Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl mx-auto w-full pt-3 text-center"
          >
            <button
              onClick={() => setActiveImagePost(null)}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CommunityPage;
