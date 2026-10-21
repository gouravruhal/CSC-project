import React, { useState, useEffect } from 'react';
import {
  FileText, 
  Download, 
  Trash2, 
  Search, 
  RefreshCw, 
  LogOut, 
  Phone,
  Paperclip, 
  ChevronLeft,
  ChevronRight,
  BarChart3,
  X,
  HardDrive,
  Mail,
  MailOpen,
  CheckSquare,
  Square,
  ShieldAlert,
  Inbox
} from 'lucide-react';
import { Submission, SubmissionStatus, AdminUser, AdminTab } from '../../types';
import { sanitizeText } from '../../lib/uiSecurity';
import { 
  getCachedCounterStatus, 
  invalidateCounterStatusCache, 
  subscribeToCounterStatus,
  authFetch 
} from '../../lib/apiCache';

interface AdminDashboardProps {
  adminUser: AdminUser;
  adminToken: string;
  onLogout: () => void;
  onBackToHome?: () => void;
  activeAdminTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  adminToken,
  onLogout,
  activeAdminTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<AdminTab>('dashboard');
  const currentTab: AdminTab = controlledTab || internalTab;

  const handleTabChange = (tab: AdminTab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isCounterOpen, setIsCounterOpen] = useState(true);

  // Multi-select Checkbox State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Analytics Popup State
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);

  useEffect(() => {
    fetchSubmissions();
    fetchCounterStatus();

    const unsub = subscribeToCounterStatus((data) => {
      setIsCounterOpen(data.isOpen);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, statusFilter, categoryFilter, itemsPerPage]);

  const fetchCounterStatus = async () => {
    try {
      const data = await getCachedCounterStatus();
      if (typeof data.isOpen === 'boolean') setIsCounterOpen(data.isOpen);
    } catch (e) {
      const saved = localStorage.getItem('atalseva_counter_open');
      if (saved !== null) setIsCounterOpen(saved === 'true');
    }
  };

  const toggleCounterStatus = async () => {
    const newStatus = !isCounterOpen;
    setIsCounterOpen(newStatus);
    localStorage.setItem('atalseva_counter_open', String(newStatus));

    const statusObj = {
      isOpen: newStatus,
      statusText: newStatus
        ? 'COUNTER OPEN NOW — Accepting Document Submissions'
        : 'COUNTER CLOSED NOW — Open Hours: Mon–Sat 8:30 AM – 7:30 PM IST',
      reason: newStatus ? '' : 'COUNTER CLOSED',
      updatedAt: new Date().toISOString(),
    };

    // Instant 0ms broadcast across all components & open tabs
    invalidateCounterStatusCache(statusObj);

    try {
      await fetch('/api/counter-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOpen: newStatus,
          statusText: statusObj.statusText,
        }),
      });
    } catch (e) {
      console.error('Failed to update counter status', e);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '500',
      });

      const res = await authFetch(`/api/admin/submissions?${queryParams.toString()}`);

      if (res.status === 401) {
        setSubmissions([]);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const rawList = data.submissions || [];
        const list = rawList.sort(
          (a: Submission, b: Submission) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setSubmissions(list);
      } else {
        setSubmissions([]);
      }
    } catch (e) {
      console.error('Failed to fetch submissions:', e);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, newStatus: SubmissionStatus = 'Downloaded') => {
    try {
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === id && sub.status === 'Pending' ? { ...sub, status: newStatus } : sub))
      );

      const res = await authFetch(`/api/admin/submissions/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.status === 401) return;
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  // Complete Permanent Single Delete (Disappears completely from backend)
  const handleDeleteSubmission = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Permanently erase client submission ${id} and physical files from backend server?`)) return;

    try {
      const res = await authFetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
      });
      if (res.status === 401) return;

      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission(null);
      }
    } catch (e) {
      console.error('Failed to delete submission:', e);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission(null);
      }
    }
  };

  // Complete Permanent Bulk Delete (Disappears completely from backend)
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Permanently erase ${selectedIds.length} submission(s) and physical files completely from backend server?`)) return;

    try {
      const res = await authFetch('/api/admin/submissions/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.status === 401) return;

      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
        setSelectedIds([]);
      }
    } catch (e) {
      console.error('Bulk delete error:', e);
    }
  };

  const handleDownloadFile = (submissionId: string, fileId: string, originalName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleMarkAsRead(submissionId, 'Downloaded');
    const downloadUrl = `/api/admin/download/${submissionId}/${fileId}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.setAttribute('download', originalName || 'document');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sub.name.toLowerCase().includes(q) ||
      sub.phone.includes(q) ||
      sub.id.toLowerCase().includes(q) ||
      (sub.purpose || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'unread' && sub.status !== 'Pending') return false;
    if (statusFilter === 'read' && sub.status !== 'Downloaded' && sub.status !== 'Processing') return false;

    if (categoryFilter !== 'all') {
      const purp = (sub.purpose || '').toLowerCase();
      if (categoryFilter === 'typing' && !purp.includes('typing') && !purp.includes('टाइपिंग')) return false;
      if (categoryFilter === 'printing' && !purp.includes('print') && !purp.includes('प्रिंटिंग')) return false;
      if (categoryFilter === 'scanning' && !purp.includes('scan') && !purp.includes('pdf') && !purp.includes('स्कैन')) return false;
      if (categoryFilter === 'forms' && !purp.includes('form') && !purp.includes('फॉर्म')) return false;
    }

    return true;
  });

  const totalRecords = filteredSubmissions.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  const isAllSelected = paginatedSubmissions.length > 0 && paginatedSubmissions.every((s) => selectedIds.includes(s.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const currentPageIds = new Set(paginatedSubmissions.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.has(id)));
    } else {
      const currentPageIds = paginatedSubmissions.map((s) => s.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const toggleSelectId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Analytics Computation
  const totalReceived = submissions.length;
  const unreadCount = submissions.filter((s) => s.status === 'Pending').length;
  const readCount = submissions.filter((s) => s.status === 'Downloaded' || s.status === 'Processing').length;
  
  let totalStorageBytes = 0;
  const purposeMap: Record<string, number> = {};

  submissions.forEach((sub) => {
    purposeMap[sub.purpose || 'General Service'] = (purposeMap[sub.purpose || 'General Service'] || 0) + 1;
    sub.files?.forEach((f) => {
      totalStorageBytes += f.size || 0;
    });
  });

  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

  const openWorkspaceStudio = (sub: Submission, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleMarkAsRead(sub.id, 'Processing');
    window.open(`/admin/workspace?id=${sub.id}`, '_blank');
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-primary)] text-[var(--color-text)] p-3 sm:p-6 transition-colors font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        

        <div className="space-y-5">
            {/* Top Header Bar strictly on Dashboard */}
            <div className="container-box p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-[var(--color-border)] shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-slate-100 flex items-center justify-center font-black text-sm shrink-0 border border-[var(--color-border)]">
                  CSC
                </div>
                <div>
                  <h1 className="text-xl font-black text-[var(--color-text)] tracking-tight">
                    Operator Document Dashboard
                  </h1>
                  <p className="text-xs text-[var(--color-muted-text)] font-semibold">
                    Maa Vaishno e-World • Client Uploaded Files & Queue
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Single Official Counter Status Toggle */}
                <button
                  type="button"
                  onClick={toggleCounterStatus}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center space-x-2 cursor-pointer transition-all shadow-2xs ${
                    isCounterOpen
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                  }`}
                  title="Toggle Shop Availability"
                >
                  <span className={`w-2 h-2 rounded-full ${isCounterOpen ? 'bg-white animate-pulse' : 'bg-white'}`} />
                  <span>{isCounterOpen ? 'Counter: Open' : 'Counter: Closed'}</span>
                </button>

                {/* Analytics Modal Button */}
                <button
                  type="button"
                  onClick={() => setShowAnalyticsModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-xs font-bold text-[var(--color-text)] flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-[#30AFFF]" />
                  <span>Analytics</span>
                </button>

                <button
                  onClick={fetchSubmissions}
                  className="px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--bg-card)] text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#30AFFF] ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                {/* Independent Logout */}
                <button
                  onClick={onLogout}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-1.5 cursor-pointer hover:bg-rose-100 transition-colors"
                  title="Log out operator session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Email Inbox View Container */}
            <div className="container-box rounded-2xl overflow-hidden shadow-xs border border-[var(--color-border)]">
          
          {/* Toolbar: Inbox Filter Tabs, Select All & Bulk Actions */}
          <div className="p-4 bg-[var(--bg-primary)] border-b border-[var(--color-border)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Select All Checkbox */}
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-xs font-bold text-[var(--color-text)] flex items-center space-x-2 cursor-pointer transition-colors"
                title="Select All visible submissions on this page"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#30AFFF]" />
                ) : (
                  <Square className="w-4 h-4 text-[var(--color-muted-text)]" />
                )}
                <span>Select All</span>
              </button>

              {/* Bulk Delete Action Button */}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs animate-in fade-in"
                  title="Permanently erase selected submissions and physical files from server disk & database"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              )}

              {/* Status Filter Tabs (All & Unread) */}
              <div className="flex items-center space-x-1 text-xs font-bold pl-2 border-l border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#30AFFF] text-slate-950 font-black'
                      : 'bg-[var(--bg-card)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
                  }`}
                >
                  All Submissions ({totalReceived})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('unread')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                    statusFilter === 'unread'
                      ? 'bg-[#30AFFF] text-slate-950 font-black'
                      : 'bg-[var(--bg-card)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#30AFFF]" />
                  <span>Unread ({unreadCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('read')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    statusFilter === 'read'
                      ? 'bg-[#30AFFF] text-slate-950 font-black'
                      : 'bg-[var(--bg-card)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
                  }`}
                >
                  Opened ({readCount})
                </button>
              </div>
            </div>

            {/* Search Input & Category Filter */}
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--color-muted-text)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={60}
                  value={search}
                  onChange={(e) => setSearch(sanitizeText(e.target.value, 60))}
                  placeholder="Search sender, mobile, or order ID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] cursor-pointer focus:outline-none shrink-0"
              >
                <option value="all">All Services</option>
                <option value="typing">Typing</option>
                <option value="printing">Printing</option>
                <option value="scanning">Scanning</option>
                <option value="forms">Forms</option>
              </select>
            </div>

          </div>

          {/* Inbox List Stream (Responsive Full Screen Table with Checkboxes) */}
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-[var(--color-muted-text)]">
              Loading document inbox...
            </div>
          ) : paginatedSubmissions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Mail className="w-10 h-10 text-[var(--color-muted-text)] mx-auto opacity-40" />
              <p className="text-sm font-bold text-[var(--color-text)]">No submissions found</p>
              <p className="text-xs text-[var(--color-muted-text)]">No requests match your current search or tab filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {paginatedSubmissions.map((sub) => {
                const isUnread = sub.status === 'Pending';
                const isSelected = selectedIds.includes(sub.id);
                const formattedDate = new Date(sub.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      handleMarkAsRead(sub.id, 'Downloaded');
                      setSelectedSubmission(sub);
                    }}
                    className={`p-3.5 sm:p-4 transition-colors cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs group ${
                      isSelected
                        ? 'bg-[#30AFFF]/15 dark:bg-[#30AFFF]/20'
                        : isUnread
                        ? 'bg-[#30AFFF]/5 dark:bg-[#30AFFF]/10 hover:bg-[#30AFFF]/10'
                        : 'hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    
                    {/* Left: Checkbox, Indicator, Avatar, Sender Name & Mobile */}
                    <div className="flex items-center space-x-3 min-w-0 sm:min-w-[260px]">
                      {/* Row Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelectId(sub.id, e)}
                        className="p-1 text-[var(--color-muted-text)] hover:text-[var(--color-text)] cursor-pointer"
                        title="Select row for bulk action"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#30AFFF]" />
                        ) : (
                          <Square className="w-4 h-4 opacity-50" />
                        )}
                      </button>

                      {/* Unread Indicator Dot */}
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isUnread ? 'bg-[#30AFFF] animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />

                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                        isUnread
                          ? 'bg-[#30AFFF] text-slate-950 border-[#30AFFF]'
                          : 'bg-slate-100 dark:bg-slate-800 text-[var(--color-text)] border-[var(--color-border)]'
                      }`}>
                        {sub.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`truncate text-xs ${isUnread ? 'font-black text-[var(--color-text)]' : 'font-semibold text-[var(--color-text)]'}`}>
                            {sub.name}
                          </p>
                          {isUnread && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#30AFFF] text-slate-950">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#30AFFF] font-mono font-bold flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>+91 {sub.phone}</span>
                        </p>
                      </div>
                    </div>

                    {/* Center: Requested Service / Purpose + Attachment Pill */}
                    <div className="flex-1 min-w-0 md:px-3 space-y-0.5">
                      <p className={`truncate text-xs ${isUnread ? 'font-bold text-[var(--color-text)]' : 'font-medium text-[var(--color-muted-text)]'}`}>
                        {sub.purpose || 'Service Request'}
                      </p>
                      <div className="flex items-center space-x-2 text-[11px] text-[var(--color-muted-text)] font-semibold">
                        <span className="flex items-center space-x-1">
                          <Paperclip className="w-3 h-3 text-[#30AFFF]" />
                          <span>{sub.files?.length || 0} document(s)</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono">{sub.id}</span>
                      </div>
                    </div>

                    {/* Right: Timestamp & Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                      <span className="text-[11px] font-mono text-[var(--color-muted-text)] font-semibold mr-1 hidden sm:inline">
                        {formattedDate}
                      </span>

                      {/* Open Studio Button */}
                      <button
                        type="button"
                        onClick={(e) => openWorkspaceStudio(sub, e)}
                        className="px-3 py-1.5 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 text-xs font-black cursor-pointer shadow-2xs transition-transform hover:scale-[1.02]"
                        title="Open Dedicated 2-Section Operator Studio"
                      >
                        Open Studio ↗
                      </button>

                      {/* Quick Download */}
                      {sub.files && sub.files.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadFile(sub.id, sub.files[0].id, sub.files[0].original_name, e)}
                          className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-xs font-bold transition-colors cursor-pointer"
                          title="Download document file"
                        >
                          <Download className="w-3.5 h-3.5 text-[var(--color-text)]" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSubmission(sub.id, e)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Permanently erase from backend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Inbox Pagination Footer */}
          {totalRecords > 0 && (
            <div className="px-4 py-3 bg-[var(--bg-primary)] border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-[var(--color-muted-text)] font-semibold">
                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalRecords)} of {totalRecords} Submissions
                {selectedIds.length > 0 && <span className="font-bold text-[#30AFFF] ml-2">({selectedIds.length} Selected)</span>}
              </div>

              <div className="flex items-center space-x-2 font-bold">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={`px-3 py-1.5 rounded-xl border text-xs flex items-center space-x-1 ${
                    currentPage === 1
                      ? 'opacity-40 cursor-not-allowed border-[var(--color-border)]'
                      : 'border-[var(--color-border)] hover:border-[#30AFFF] bg-[var(--bg-card)] cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs font-mono">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
        </div>

        {/* Analytics Overview Modal */}
        {showAnalyticsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="container-box rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative border border-[var(--color-border)]">
              
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-[#30AFFF]" />
                  <h3 className="text-base font-black text-[var(--color-text)] tracking-tight">
                    Real-Time Portal Metrics
                  </h3>
                </div>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="p-1.5 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--color-muted-text)] hover:text-[var(--color-text)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-center">
                    <p className="text-[10px] font-bold text-[var(--color-muted-text)] uppercase">Total Received</p>
                    <p className="text-2xl font-black text-[var(--color-text)] mt-1">{totalReceived}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-center">
                    <p className="text-[10px] font-bold text-[var(--color-muted-text)] uppercase">Unread Queue</p>
                    <p className="text-2xl font-black text-[#30AFFF] mt-1">{unreadCount}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text)]">
                    <span className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-[#30AFFF]" />
                      <span>Encrypted Storage Consumed</span>
                    </span>
                    <span className="font-mono text-[#30AFFF]">
                      {totalStorageMB} MB
                    </span>
                  </div>
                </div>

                {Object.keys(purposeMap).length > 0 && (
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-[var(--color-muted-text)]">
                      Service Category Breakdown
                    </p>
                    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden divide-y divide-[var(--color-border)]">
                      {Object.entries(purposeMap).map(([purp, count]) => (
                        <div key={purp} className="p-2.5 bg-[var(--bg-primary)] flex items-center justify-between text-xs">
                          <span className="font-bold text-[var(--color-text)]">{purp}</span>
                          <span className="font-mono font-black text-[#30AFFF] px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--color-border)]">
                            {count} req
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAnalyticsModal(false)}
                  className="px-5 py-2 rounded-xl bg-[#30AFFF] text-slate-950 text-xs font-black cursor-pointer"
                >
                  Close Metrics
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
