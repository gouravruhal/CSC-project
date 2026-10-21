export type SubmissionStatus = 'Pending' | 'Processing' | 'Downloaded' | 'Completed';

export interface UploadedFile {
  id: string;
  filename: string;
  original_name: string;
  size: number;
  mime_type: string;
  file_path: string;
  sha256_hash: string;
  scan_status: 'CLEARED' | 'SUSPICIOUS' | 'UNVERIFIED';
}

export interface Submission {
  id: string;
  autonomous_id?: string;
  name: string;
  phone: string;
  purpose: string;
  description?: string;
  files: UploadedFile[];
  created_at: string;
  updated_at?: string;
  ip_hash: string;
  status: SubmissionStatus;
  workspace_state?: Record<string, any>;
}

export interface AdminStats {
  todayUploadCount: number;
  pendingCount: number;
  downloadedCount: number;
  completedCount: number;
  storageUsageBytes: number;
  storageLimitBytes: number;
  purposeBreakdown: Record<string, number>;
  dailyTrends: { date: string; count: number }[];
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  event_type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'FILE_UPLOADED' | 'FILE_BLOCKED' | 'FILE_DOWNLOADED' | 'SUBMISSION_DELETED' | 'CSRF_REJECTED' | 'LOGIN_BLOCKED' | 'SECURITY_ATTACK' | 'LOGIN_LOCKOUT';
  ip_hash: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'HIGH';
}

export interface CSRFTokenResponse {
  csrfToken: string;
}

export interface AdminUser {
  email: string;
  role: 'superadmin' | 'kendra_operator';
  lastLogin: string;
}

export type Language = 'en' | 'hi';

export type CommunityCategory = 'All' | 'Urgent' | 'Scheme' | 'Jobs' | 'Notice';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: 'Scheme' | 'Timing' | 'Jobs' | 'Notice';
  imageUrl?: string;
  videoUrl?: string;
  important?: boolean;
  createdAt: string;
  authorName?: string;
}

export type AdminTab = 'dashboard' | 'community' | 'website-content';

export interface EquipmentItem {
  id: string;
  name: string;
  imageUrl: string;
}

export interface ManagedServiceItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  isClosed?: boolean;
}

export interface WebsiteContent {
  kendraName: string;
  operatorName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  mapsUrl: string;
  workingHoursText: string;
  heroHeadline?: string;
  heroSubtitle?: string;
  announcementBannerEnabled?: boolean;
  announcementBannerText?: string;
  equipmentList?: EquipmentItem[];
  servicesList?: ManagedServiceItem[];
  coreServices: string[];
  faqs: Array<{ q: string; a: string }>;
}

