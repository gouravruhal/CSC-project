import fs from 'fs';
import crypto from 'crypto';
import { Submission, SecurityAuditLog, CommunityPost, WebsiteContent } from '../src/types.js';
import { 
  DB_FILE, 
  LOGS_FILE, 
  COMMUNITY_FILE, 
  WEBSITE_CONTENT_FILE, 
  supabase 
} from './config.js';

// Default Website Content
export const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  kendraName: 'MAA VAISHNO e-WORLD CSC CENTRE',
  operatorName: 'Surender Bajwa',
  phone: '+91 9896419275',
  whatsapp: '+91 9896419275',
  email: 'surenderbajwa1@gmail.com',
  address: 'Rairkalan, Panipat, Haryana 132103',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=29.48823169134412,76.83097890513511',
  workingHoursText: 'Monday to Saturday: 8:30 AM to 7:30 PM (Sunday Closed)',
  heroHeadline: 'MAA VAISHNO e-WORLD CSC CENTRE',
  heroSubtitle: 'Official CSC Document & Public Services Portal in Rairkalan, Panipat. Instant document uploading, printing, scanning & government forms with zero waiting time.',
  announcementBannerEnabled: false,
  announcementBannerText: 'Important: Complete biometric e-KYC for PM-Kisan and Ayushman Bharat PVC Card printing at our Kendra counter.',
  equipmentList: [],
  servicesList: [
    { id: 'srv-1', name: 'Hindi Typing Work', category: 'Typing', isClosed: false },
    { id: 'srv-2', name: 'English Typing Work', category: 'Typing', isClosed: false },
    { id: 'srv-3', name: 'Government Application Drafting', category: 'Typing', isClosed: false },
    { id: 'srv-4', name: 'Rent Agreements & Affidavits', category: 'Typing', isClosed: false },
    { id: 'srv-5', name: 'Black & White Printing', category: 'Printing', isClosed: false },
    { id: 'srv-6', name: 'Colour Laser Printing', category: 'Printing', isClosed: false },
    { id: 'srv-7', name: 'Fast Document Photocopy', category: 'Printing', isClosed: false },
    { id: 'srv-8', name: 'HD Document Scanning', category: 'Printing', isClosed: false },
    { id: 'srv-9', name: 'PVC Smart Card Printing (Aadhaar / PAN)', category: 'Printing', isClosed: false },
    { id: 'srv-10', name: 'Scan to PDF & PDF Merge', category: 'Printing', isClosed: false },
    { id: 'srv-11', name: 'Government Job Recruitment Forms', category: 'Online Forms', isClosed: false },
    { id: 'srv-12', name: 'PAN Card (New & Correction)', category: 'Online Forms', isClosed: false },
    { id: 'srv-13', name: 'PM-Kisan & Ayushman e-KYC', category: 'Online Forms', isClosed: false },
    { id: 'srv-14', name: 'Income, Caste & Domicile Certificates', category: 'Online Forms', isClosed: false },
  ],
  coreServices: [],
  faqs: [
    {
      q: 'Is there any fee to send documents online?',
      a: 'No, sending documents through this portal is completely free. You only pay standard printing or service fees at the counter.',
    },
    {
      q: 'How long does Hindi & English typing work take?',
      a: 'Short letters are typed immediately and multi-page documents are prepared quickly with special attention to accurate spelling and names.',
    },
    {
      q: 'Are my documents safe with Maa Vaishno e-World?',
      a: 'Yes, customer documents are handled with strict confidentiality and encrypted processing.',
    },
    {
      q: 'What are the centre operating hours?',
      a: 'Monday through Saturday from 8:30 AM to 7:30 PM (Sunday Closed).',
    },
  ],
};

// Memory Database initialization
export let localSubmissions: Submission[] = [];
export let localAuditLogs: SecurityAuditLog[] = [];
export let localCommunityPosts: CommunityPost[] = [];
export let localWebsiteContent: WebsiteContent = { ...DEFAULT_WEBSITE_CONTENT };

// CSRF tokens store
export const validCsrfTokens = new Set<string>();

// Counter Manual Override state
export let counterManualOverride: boolean | null = null;
export let counterStatus = {
  isOpen: true,
  statusText: 'COUNTER OPEN NOW — Accepting Document & Service Submissions',
  updatedAt: new Date().toISOString(),
};

// Load Submissions
if (fs.existsSync(DB_FILE)) {
  try {
    localSubmissions = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    localSubmissions = [];
  }
}

// Load Audit Logs
if (fs.existsSync(LOGS_FILE)) {
  try {
    localAuditLogs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
  } catch (e) {
    localAuditLogs = [];
  }
}

// Load Community Announcements
if (fs.existsSync(COMMUNITY_FILE)) {
  try {
    const raw = fs.readFileSync(COMMUNITY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    localCommunityPosts = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    localCommunityPosts = [];
  }
} else {
  localCommunityPosts = [];
  try {
    fs.writeFileSync(COMMUNITY_FILE, JSON.stringify([], null, 2));
  } catch (e) {}
}

// Load Website Content
if (fs.existsSync(WEBSITE_CONTENT_FILE)) {
  try {
    const raw = fs.readFileSync(WEBSITE_CONTENT_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    localWebsiteContent = {
      ...DEFAULT_WEBSITE_CONTENT,
      ...parsed,
      equipmentList: Array.isArray(parsed.equipmentList) ? parsed.equipmentList : [],
      servicesList: (Array.isArray(parsed.servicesList) && parsed.servicesList.length > 0) ? parsed.servicesList : DEFAULT_WEBSITE_CONTENT.servicesList,
    };
  } catch (e) {
    localWebsiteContent = { ...DEFAULT_WEBSITE_CONTENT };
  }
} else {
  try {
    fs.writeFileSync(WEBSITE_CONTENT_FILE, JSON.stringify(localWebsiteContent, null, 2));
  } catch (e) {}
}

export function persistData() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localSubmissions, null, 2));
    fs.writeFileSync(LOGS_FILE, JSON.stringify(localAuditLogs, null, 2));
  } catch (err) {
    console.error('Failed to persist local DB', err);
  }
}

export function persistCommunityData() {
  try {
    fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(localCommunityPosts, null, 2));
  } catch (err) {
    console.error('Failed to persist community DB', err);
  }
}

export function persistWebsiteContent() {
  try {
    fs.writeFileSync(WEBSITE_CONTENT_FILE, JSON.stringify(localWebsiteContent, null, 2));
  } catch (err) {
    console.error('Failed to persist website content', err);
  }
}

export function addAuditLog(
  eventType: SecurityAuditLog['event_type'], 
  ipHash: string, 
  details: string, 
  severity: SecurityAuditLog['severity'] = 'INFO'
) {
  const log: SecurityAuditLog = {
    id: 'LOG_' + crypto.randomBytes(8).toString('hex'),
    timestamp: new Date().toISOString(),
    event_type: eventType,
    ip_hash: ipHash,
    details,
    severity,
  };
  localAuditLogs.unshift(log);
  if (localAuditLogs.length > 500) localAuditLogs.pop();
  persistData();

  if (supabase) {
    supabase.from('security_audit_logs').insert([log]).then(() => {}).catch((err: any) => {
      console.warn('Supabase audit log insert notice:', err.message || err);
    });
  }
}

export function isCounterCurrentlyOpen(): { isOpen: boolean; reason?: string } {
  if (counterManualOverride !== null && counterManualOverride === false) {
    return {
      isOpen: false,
      reason: 'Counter has been manually set to CLOSED by the counter operator.',
    };
  }

  // Calculate current India Standard Time (IST = UTC + 5h 30m)
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utcTime + (5.5 * 60 * 60 * 1000));

  const day = istDate.getDay(); // 0 = Sunday
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  if (day === 0) {
    return {
      isOpen: false,
      reason: 'Maa Vaishno e-World counter is CLOSED on Sundays. Counter working hours are Monday–Saturday 8:30 AM to 7:30 PM IST.',
    };
  }

  // Mon-Sat: Open 8:30 AM to 7:30 PM IST
  const openMinutes = 8 * 60 + 30;
  const closeMinutes = 19 * 60 + 30;

  if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
    return {
      isOpen: false,
      reason: 'Maa Vaishno e-World counter is currently CLOSED. Submissions are accepted only Monday–Saturday between 8:30 AM and 7:30 PM IST.',
    };
  }

  return { isOpen: true };
}

export function setCounterManualOverride(override: boolean | null, statusText?: string) {
  counterManualOverride = override;
  if (override !== null) {
    counterStatus.isOpen = override;
  }
  if (statusText) {
    counterStatus.statusText = statusText;
  }
  counterStatus.updatedAt = new Date().toISOString();
}

export async function syncFromSupabase(): Promise<void> {
  if (!supabase) return;
  try {
    // 1. Sync Submissions
    const { data: subsData, error: subsErr } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsData && !subsErr && subsData.length > 0) {
      localSubmissions = subsData;
      console.log(`✅ Loaded ${subsData.length} submissions from Supabase.`);
    }

    // 2. Sync Website Content
    const { data: wcData, error: wcErr } = await supabase
      .from('website_content')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (wcData && !wcErr) {
      Object.assign(localWebsiteContent, {
        kendraName: wcData.kendra_name || localWebsiteContent.kendraName,
        operatorName: wcData.operator_name || localWebsiteContent.operatorName,
        phone: wcData.phone || localWebsiteContent.phone,
        whatsapp: wcData.whatsapp || localWebsiteContent.whatsapp,
        email: wcData.email || localWebsiteContent.email,
        address: wcData.address || localWebsiteContent.address,
        mapsUrl: wcData.maps_url || localWebsiteContent.mapsUrl,
        workingHoursText: wcData.working_hours_text || localWebsiteContent.workingHoursText,
        heroHeadline: wcData.hero_headline || localWebsiteContent.heroHeadline,
        heroSubtitle: wcData.hero_subtitle || localWebsiteContent.heroSubtitle,
        announcementBannerEnabled: wcData.announcement_banner_enabled ?? localWebsiteContent.announcementBannerEnabled,
        announcementBannerText: wcData.announcement_banner_text || localWebsiteContent.announcementBannerText,
        equipmentList: Array.isArray(wcData.equipment_list) ? wcData.equipment_list : [],
        servicesList: (wcData.services_list && wcData.services_list.length > 0) ? wcData.services_list : localWebsiteContent.servicesList,
        coreServices: Array.isArray(wcData.core_services) ? wcData.core_services : localWebsiteContent.coreServices,
        faqs: (wcData.faqs && wcData.faqs.length > 0) ? wcData.faqs : localWebsiteContent.faqs,
      });
      console.log('✅ Loaded website content configuration from Supabase.');
    }

    // 3. Sync Community Posts
    const { data: commData, error: commErr } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!commErr && Array.isArray(commData)) {
      localCommunityPosts.length = 0;
      commData.forEach((p: any) => {
        localCommunityPosts.push({
          id: p.id,
          title: p.title,
          content: p.content,
          category: p.category,
          imageUrl: p.image_url,
          videoUrl: p.video_url,
          important: p.important,
          createdAt: p.created_at,
          authorName: p.author_name,
        });
      });
      persistCommunityData();
      console.log(`✅ Loaded ${commData.length} community posts from Supabase.`);
    }

    // 4. Sync Live Counter Status
    const { data: csData, error: csErr } = await supabase
      .from('counter_status')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (csData && !csErr) {
      if (typeof csData.is_open === 'boolean') {
        counterStatus.isOpen = csData.is_open;
        if (csData.status_text) counterStatus.statusText = csData.status_text;
        counterStatus.updatedAt = csData.updated_at || new Date().toISOString();
      }
      console.log('✅ Loaded live counter status from Supabase.');
    }
  } catch (err: any) {
    console.warn('⚠️ Supabase initial sync notice:', err.message || err);
  }
}

