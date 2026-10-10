import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { 
  ADMIN_EMAIL, 
  ADMIN_PASSWORD, 
  COMMUNITY_UPLOADS_DIR, 
  UPLOADS_DIR, 
  supabase 
} from '../config.js';
import { 
  localSubmissions, 
  localAuditLogs, 
  localCommunityPosts, 
  localWebsiteContent, 
  setCounterManualOverride,
  addAuditLog, 
  persistData, 
  persistCommunityData, 
  persistWebsiteContent 
} from '../db.js';
import { 
  authLimiter, 
  cmsLimiter, 
  fileDownloadLimiter 
} from '../middleware/rateLimiter.js';
import { 
  activeAdminSessions, 
  loginAttemptsMap, 
  requireAdminAuth 
} from '../middleware/auth.js';
import { 
  validateFileMagicBytes 
} from '../middleware/upload.js';
import { 
  getClientIpHash, 
  timingSafeCompare, 
  sanitizeString, 
  sanitizeObject, 
  detectInjectionAttack, 
  safeResolvePath, 
  validateSafeUrl, 
  adminLoginSchema, 
  communityPostSchema, 
  websiteContentUpdateSchema 
} from '../../src/lib/security.js';
import { Submission, CommunityPost, AdminStats } from '../../src/types.js';

export const adminRouter = Router();

// Multer for Community Announcements and Equipment Media
const communityMediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per video or image upload
    files: 2,
  },
});

// 1. Admin Login (Brute Force Protection & Timing Safe Compare)
adminRouter.post('/login', authLimiter.middleware(), (req: Request, res: Response): void => {
  const ipHash = getClientIpHash(req);
  const now = Date.now();
  const attemptRecord = loginAttemptsMap.get(ipHash);

  if (attemptRecord && now < attemptRecord.lockedUntil) {
    const remainingSecs = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
    addAuditLog('LOGIN_BLOCKED', ipHash, 'Blocked locked-out IP attempt', 'WARNING');
    res.status(429).json({
      error: `Too many failed sign-in attempts. Account temporarily locked for security. Please try again in ${Math.ceil(remainingSecs / 60)} minutes.`,
    });
    return;
  }

  const parseResult = adminLoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Please enter a valid email address and password.' });
    return;
  }

  const { email, password } = parseResult.data;

  const emailAttack = detectInjectionAttack(email);
  const passAttack = detectInjectionAttack(password);
  if (emailAttack.detected || passAttack.detected) {
    addAuditLog('SECURITY_ATTACK', ipHash, 'Injection attempt detected in admin login payload', 'HIGH');
    
    const current = attemptRecord || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = now + 15 * 60 * 1000;
    }
    loginAttemptsMap.set(ipHash, current);

    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  const isEmailMatch = timingSafeCompare(ADMIN_EMAIL.toLowerCase(), email.toLowerCase());
  const isPassMatch = timingSafeCompare(ADMIN_PASSWORD, password);

  if (isEmailMatch && isPassMatch) {
    loginAttemptsMap.delete(ipHash);

    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeAdminSessions.add(sessionToken);

    addAuditLog('LOGIN_SUCCESS', ipHash, `Admin authentication successful (${email})`);

    res.json({
      success: true,
      token: sessionToken,
      user: {
        email: ADMIN_EMAIL,
        role: 'superadmin',
        lastLogin: new Date().toISOString(),
      },
    });
  } else {
    const current = attemptRecord || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = now + 15 * 60 * 1000;
      addAuditLog('LOGIN_LOCKOUT', ipHash, 'IP locked out due to 5 consecutive failed login attempts', 'HIGH');
    } else {
      addAuditLog('LOGIN_FAILURE', ipHash, `Failed admin login attempt (${current.count}/5)`, 'WARNING');
    }
    loginAttemptsMap.set(ipHash, current);

    res.status(401).json({ error: 'Invalid administrator credentials.' });
  }
});

// 2. Admin Session Verification
adminRouter.get('/me', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    user: {
      email: ADMIN_EMAIL,
      role: 'superadmin',
    },
  });
});

// 3. Admin Logout
adminRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '').trim() : '';
  if (token) {
    activeAdminSessions.delete(token);
  }
  res.json({ success: true });
});

// 4. Admin Submissions List with Filtering & Pagination
adminRouter.get('/submissions', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  const { search, purpose, status, dateRange, page = '1', limit = '500', sortOrder = 'desc' } = req.query as Record<string, string>;

  let allList: Submission[] = [...localSubmissions];

  if (supabase) {
    try {
      const { data, error } = await (supabase.from('submissions') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        const map = new Map<string, Submission>();
        data.forEach((s: any) => map.set(s.id, s));
        localSubmissions.forEach((s: Submission) => map.set(s.id, s));
        allList = Array.from(map.values());
      }
    } catch (e) {
      console.warn('Supabase fetch error, fallback to local database');
    }
  }

  let filtered = [...allList];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((s) => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.purpose.toLowerCase().includes(q));
  }

  if (purpose && purpose !== 'ALL') {
    filtered = filtered.filter((s) => s.purpose === purpose);
  }

  if (status && status !== 'ALL') {
    filtered = filtered.filter((s) => s.status === status);
  }

  if (dateRange) {
    const now = new Date();
    if (dateRange === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      filtered = filtered.filter((s) => s.created_at.startsWith(todayStr));
    } else if (dateRange === 'YESTERDAY') {
      const y = new Date(now.valueOf() - 86400000).toISOString().split('T')[0];
      filtered = filtered.filter((s) => s.created_at.startsWith(y));
    } else if (dateRange === 'LAST_7_DAYS') {
      const weekAgo = new Date(now.valueOf() - 7 * 86400000);
      filtered = filtered.filter((s) => new Date(s.created_at) >= weekAgo);
    }
  }

  filtered.sort((a, b) => {
    const valA = new Date(a.created_at).getTime();
    const valB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    submissions: paginated,
    pagination: {
      total,
      page: pageNum,
      totalPages,
      limit: limitNum,
    },
  });
});

// 5. Admin Single Submission View
adminRouter.get('/submissions/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  if (!id || !/^[A-Za-z0-9-]+$/.test(id) || id.length > 40) {
    res.status(400).json({ error: 'Invalid submission ID format' });
    return;
  }
  const sub = localSubmissions.find((s) => s.id === id);
  if (!sub) {
    res.status(404).json({ error: 'Submission not found.' });
    return;
  }
  res.json({ submission: sub });
});

// 6. Admin Update Submission Status
adminRouter.patch('/submissions/:id/status', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Processing', 'Downloaded', 'Completed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status value.' });
    return;
  }

  const sub = localSubmissions.find((s) => s.id === id);
  if (!sub) {
    res.status(404).json({ error: 'Submission not found.' });
    return;
  }

  sub.status = status;
  persistData();

  if (supabase) {
    supabase.from('submissions').update({ status }).eq('id', id).then(() => {}).catch((err: any) => console.error('Supabase status update error:', err));
  }

  addAuditLog('FILE_UPLOADED', getClientIpHash(req), `Status for submission ${id} updated to ${status}`);
  res.json({ success: true, submission: sub });
});

// 7. Admin Delete Single Submission
adminRouter.delete('/submissions/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = localSubmissions.findIndex((s) => s.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Submission not found.' });
    return;
  }

  const sub = localSubmissions[index];

  sub.files.forEach((file) => {
    try {
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }
    } catch (e) {
      console.error('Failed to delete file from disk:', file.file_path, e);
    }
  });

  localSubmissions.splice(index, 1);
  persistData();

  if (supabase) {
    supabase.from('submissions').delete().eq('id', id).then(() => {}).catch((err: any) => {
      console.warn('Supabase submission delete notice:', err.message || err);
    });
    const fileKeys = sub.files.map((f) => f.filename);
    if (fileKeys.length > 0) {
      supabase.storage.from('csc-documents').remove(fileKeys).catch(() => {});
    }
  }

  addAuditLog('SUBMISSION_DELETED', getClientIpHash(req), `Deleted submission ${id} and associated files`, 'WARNING');
  res.json({ success: true, message: `Submission ${id} deleted successfully.` });
});

// 8. Admin Bulk Delete Submissions
adminRouter.post('/submissions/bulk-delete', requireAdminAuth, (req: Request, res: Response): void => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Please provide an array of submission IDs to delete.' });
    return;
  }

  let deletedCount = 0;
  ids.forEach((id) => {
    const index = localSubmissions.findIndex((s) => s.id === id);
    if (index !== -1) {
      const sub = localSubmissions[index];
      sub.files.forEach((file) => {
        try {
          if (fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
          }
        } catch (e) {
          console.error('Failed to delete file from disk:', file.file_path, e);
        }
      });
      localSubmissions.splice(index, 1);
      deletedCount++;
    }
  });

  persistData();

  if (supabase) {
    supabase.from('submissions').delete().in('id', ids).then(() => {}).catch((err: any) => {
      console.warn('Supabase bulk delete notice:', err.message || err);
    });
  }

  addAuditLog('SUBMISSION_DELETED', getClientIpHash(req), `Bulk deleted ${deletedCount} submissions and associated files`, 'WARNING');
  res.json({ success: true, count: deletedCount, message: `Permanently deleted ${deletedCount} submissions and physical files.` });
});

// 9. Admin Download File (Path Traversal Guarded)
adminRouter.get('/download/:submissionId/:fileId', fileDownloadLimiter.middleware(), requireAdminAuth, (req: Request, res: Response): void => {
  const { submissionId, fileId } = req.params;

  if (!submissionId || !/^[A-Za-z0-9-]+$/.test(submissionId) || submissionId.length > 40) {
    res.status(400).send('Invalid submission ID format');
    return;
  }
  if (!fileId || !/^[A-Za-z0-9._-]+$/.test(fileId) || fileId.length > 80) {
    res.status(400).send('Invalid file ID format');
    return;
  }

  const sub = localSubmissions.find((s) => s.id === submissionId);
  if (!sub) {
    res.status(404).send('Submission not found');
    return;
  }

  const file = sub.files.find((f) => f.id === fileId || f.filename === fileId);
  if (!file) {
    res.status(404).send('File not found in storage');
    return;
  }

  const safePath = safeResolvePath(UPLOADS_DIR, file.filename);
  if (!safePath || !fs.existsSync(safePath)) {
    res.status(404).send('File not found in storage');
    return;
  }

  if (sub.status === 'Pending') {
    sub.status = 'Downloaded';
    persistData();
  }

  addAuditLog('FILE_DOWNLOADED', getClientIpHash(req), `Admin downloaded file ${file.original_name} from submission ${submissionId}`);

  res.setHeader('Content-Type', file.mime_type);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);

  const fileStream = fs.createReadStream(safePath);
  fileStream.pipe(res);
});

// 10. Admin Inline View File Stream
adminRouter.get('/view/:submissionId/:fileId', async (req: Request, res: Response): Promise<void> => {
  const { submissionId, fileId } = req.params;
  const sub = localSubmissions.find((s) => s.id === submissionId);

  if (!sub) {
    res.status(404).send('Submission not found');
    return;
  }

  const file = sub.files.find((f) => f.id === fileId || f.filename === fileId);
  if (!file) {
    res.status(404).send('File metadata not found');
    return;
  }

  if (sub.status === 'Pending') {
    sub.status = 'Processing';
    persistData();
  }

  res.setHeader('Content-Type', file.mime_type || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);

  if (fs.existsSync(file.file_path)) {
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);
  } else if (supabase) {
    try {
      const { data, error } = await supabase.storage.from('csc-documents').download(file.filename);
      if (error || !data) {
        res.status(404).send('File not found in Supabase storage bucket');
        return;
      }
      const buffer = Buffer.from(await data.arrayBuffer());
      res.send(buffer);
    } catch (e) {
      res.status(404).send('Storage stream error');
    }
  } else {
    res.status(404).send('File not found on disk or storage');
  }
});

// 11. Admin Stats
adminRouter.get('/stats', requireAdminAuth, (req: Request, res: Response) => {
  const todayStr = new Date().toISOString().split('T')[0];

  let todayCount = 0;
  let pendingCount = 0;
  let downloadedCount = 0;
  let completedCount = 0;
  let storageBytes = 0;
  const purposeMap: Record<string, number> = {};

  localSubmissions.forEach((sub) => {
    if (sub.created_at.startsWith(todayStr)) {
      todayCount += 1;
    }

    if (sub.status === 'Pending') pendingCount += 1;
    if (sub.status === 'Downloaded') downloadedCount += 1;
    if (sub.status === 'Completed') completedCount += 1;

    purposeMap[sub.purpose] = (purposeMap[sub.purpose] || 0) + 1;

    sub.files.forEach((f) => {
      storageBytes += f.size || 0;
    });
  });

  const dailyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const count = localSubmissions.filter((s) => s.created_at.startsWith(dateStr)).length;
    dailyTrends.push({
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      count,
    });
  }

  const stats: AdminStats = {
    todayUploadCount: todayCount,
    pendingCount,
    downloadedCount,
    completedCount,
    storageUsageBytes: storageBytes,
    storageLimitBytes: 10 * 1024 * 1024 * 1024,
    purposeBreakdown: purposeMap,
    dailyTrends,
  };

  res.json(stats);
});

// 12. Admin Community Announcement Creation
adminRouter.post(
  '/community', 
  cmsLimiter.middleware(), 
  requireAdminAuth, 
  communityMediaUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), 
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parseResult = communityPostSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid announcement data' });
        return;
      }

      const { title, content, category, important, authorName } = parseResult.data;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      let imageUrl: string | undefined = undefined;
      let videoUrl: string | undefined = undefined;

      if (files?.image && files.image[0]) {
        const imgFile = files.image[0];
        const validation = validateFileMagicBytes(imgFile.buffer, imgFile.originalname);
        if (!validation.valid) {
          res.status(400).json({ error: `Security Validation Failed for image: ${validation.reason}` });
          return;
        }
        const ext = path.extname(imgFile.originalname).toLowerCase() || '.jpg';
        const imgName = `comm_img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
        const targetPath = path.join(COMMUNITY_UPLOADS_DIR, imgName);
        fs.writeFileSync(targetPath, imgFile.buffer);
        imageUrl = `/api/community/image/${imgName}`;
      }

      if (files?.video && files.video[0]) {
        const vidFile = files.video[0];
        const ext = path.extname(vidFile.originalname).toLowerCase();
        if (!['.mp4', '.webm', '.mov', '.ogg'].includes(ext)) {
          res.status(400).json({ error: `Invalid video format. Supported: MP4, WebM, MOV, OGG` });
          return;
        }
        const vidName = `comm_vid_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
        const targetPath = path.join(COMMUNITY_UPLOADS_DIR, vidName);
        fs.writeFileSync(targetPath, vidFile.buffer);
        videoUrl = `/api/community/media/${vidName}`;
      }

      const newPost: CommunityPost = {
        id: `COMM_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        title: sanitizeString(title),
        content: sanitizeString(content),
        category,
        imageUrl,
        videoUrl,
        important: Boolean(important),
        createdAt: new Date().toISOString(),
        authorName: authorName ? sanitizeString(authorName) : 'Maa Vaishno e-World Operator',
      };

      localCommunityPosts.unshift(newPost);
      persistCommunityData();

      addAuditLog('FILE_UPLOADED', getClientIpHash(req), `Admin created community announcement: ${newPost.title}`);
      res.status(201).json({ success: true, post: newPost });
    } catch (err: any) {
      console.error('Failed to create community post:', err);
      res.status(500).json({ error: 'Server error creating announcement' });
    }
  }
);

// 13. Admin Community Announcement Deletion
adminRouter.delete('/community/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = localCommunityPosts.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Announcement not found' });
    return;
  }

  const post = localCommunityPosts[index];
  if (post.imageUrl) {
    try {
      const filename = path.basename(post.imageUrl);
      const filePath = safeResolvePath(COMMUNITY_UPLOADS_DIR, filename);
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {}
  }

  localCommunityPosts.splice(index, 1);
  persistCommunityData();

  addAuditLog('SUBMISSION_DELETED', getClientIpHash(req), `Admin deleted community announcement: ${post.title}`);
  res.json({ success: true });
});

// 14. Admin Pin/Unpin Community Announcement
adminRouter.put('/community/:id/pin', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const post = localCommunityPosts.find((p) => p.id === id);

  if (!post) {
    res.status(404).json({ error: 'Announcement not found' });
    return;
  }

  post.important = !post.important;
  persistCommunityData();
  res.json({ success: true, post });
});

// 15. Admin Update Website Content CMS
adminRouter.put('/website-content', cmsLimiter.middleware(), requireAdminAuth, (req: Request, res: Response): void => {
  try {
    const parseResult = websiteContentUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid content payload' });
      return;
    }

    const update = parseResult.data;

    if (update.mapsUrl) {
      const urlCheck = validateSafeUrl(update.mapsUrl);
      if (!urlCheck.valid) {
        res.status(400).json({ error: `Security Exception on Maps URL: ${urlCheck.reason}` });
        return;
      }
    }

    const sanitizedUpdate = sanitizeObject(update);

    Object.assign(localWebsiteContent, sanitizedUpdate);
    persistWebsiteContent();

    if (supabase) {
      supabase.from('website_content').upsert({
        id: 1,
        kendra_name: localWebsiteContent.kendraName,
        operator_name: localWebsiteContent.operatorName,
        phone: localWebsiteContent.phone,
        whatsapp: localWebsiteContent.whatsapp,
        email: localWebsiteContent.email,
        address: localWebsiteContent.address,
        maps_url: localWebsiteContent.mapsUrl,
        working_hours_text: localWebsiteContent.workingHoursText,
        hero_headline: localWebsiteContent.heroHeadline,
        hero_subtitle: localWebsiteContent.heroSubtitle,
        announcement_banner_enabled: localWebsiteContent.announcementBannerEnabled,
        announcement_banner_text: localWebsiteContent.announcementBannerText,
        equipment_list: localWebsiteContent.equipmentList,
        services_list: localWebsiteContent.servicesList,
        core_services: localWebsiteContent.coreServices,
        faqs: localWebsiteContent.faqs,
        updated_at: new Date().toISOString(),
      }).then(() => {}).catch((err: any) => {
        console.warn('Supabase website content upsert notice:', err.message || err);
      });
    }

    addAuditLog('FILE_UPLOADED', getClientIpHash(req), 'Admin updated public website content configuration');
    res.json({ success: true, content: localWebsiteContent });
  } catch (err: any) {
    console.error('Failed to update website content:', err);
    res.status(500).json({ error: 'Server error saving website content' });
  }
});

// 16. Admin Upload Equipment Image
adminRouter.post('/equipment-image', cmsLimiter.middleware(), requireAdminAuth, communityMediaUpload.single('image'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }
    const validation = validateFileMagicBytes(req.file.buffer, req.file.originalname);
    if (!validation.valid) {
      res.status(400).json({ error: `Security Validation Failed for equipment photo: ${validation.reason}` });
      return;
    }
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `equip_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const targetPath = path.join(COMMUNITY_UPLOADS_DIR, uniqueName);
    fs.writeFileSync(targetPath, req.file.buffer);
    res.json({ success: true, imageUrl: `/api/community/media/${uniqueName}` });
  } catch (err: any) {
    console.error('Failed to upload equipment image:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 17. Security Audit Logs
adminRouter.get('/audit-logs', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ logs: localAuditLogs.slice(0, 100) });
});
