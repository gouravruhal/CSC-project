import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { 
  COMMUNITY_UPLOADS_DIR, 
  UPLOADS_DIR, 
  supabase 
} from '../config.js';
import { 
  localSubmissions, 
  localCommunityPosts, 
  localWebsiteContent, 
  validCsrfTokens, 
  isCounterCurrentlyOpen, 
  setCounterManualOverride, 
  addAuditLog, 
  persistData 
} from '../db.js';
import { 
  submissionLimiter, 
  trackingLimiter, 
  csrfLimiter 
} from '../middleware/rateLimiter.js';
import { 
  handleDocumentUpload, 
  validateFileMagicBytes 
} from '../middleware/upload.js';
import { 
  getClientIpHash, 
  maskPhoneNumber, 
  sanitizeString, 
  detectInjectionAttack, 
  safeResolvePath, 
  citizenSubmitSchema, 
  trackingQuerySchema 
} from '../../src/lib/security.js';
import { UploadedFile, Submission } from '../../src/types.js';

export const publicRouter = Router();

// 1. Get CSRF Token (Single-Use, Rate-Limited)
publicRouter.get('/csrf-token', csrfLimiter.middleware(), (req: Request, res: Response) => {
  const token = crypto.randomBytes(32).toString('hex');
  validCsrfTokens.add(token);

  if (validCsrfTokens.size > 1000) {
    const first = validCsrfTokens.values().next().value;
    if (first) validCsrfTokens.delete(first);
  }

  res.json({ csrfToken: token });
});

// 2. Counter Status
publicRouter.get('/counter-status', (req: Request, res: Response) => {
  const currentCheck = isCounterCurrentlyOpen();
  res.json({
    isOpen: currentCheck.isOpen,
    reason: currentCheck.reason || '',
    statusText: currentCheck.isOpen
      ? 'COUNTER OPEN NOW — Accepting Document & Service Submissions'
      : (currentCheck.reason || 'COUNTER CLOSED'),
    updatedAt: new Date().toISOString(),
  });
});

publicRouter.post('/counter-status', async (req: Request, res: Response) => {
  const { isOpen, statusText } = req.body;
  if (typeof isOpen === 'boolean') {
    setCounterManualOverride(isOpen, statusText);

    if (supabase) {
      try {
        await supabase.from('counter_status').upsert({
          id: 1,
          is_open: isOpen,
          status_text: statusText || (isOpen ? 'COUNTER OPEN NOW' : 'COUNTER CLOSED'),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Supabase counter status update failed:', err);
      }
    }
  }
  res.json({ success: true, isOpen: isCounterCurrentlyOpen().isOpen });
});

// 3. Website Content Configuration (Public)
publicRouter.get('/website-content', (req: Request, res: Response) => {
  res.json({ content: localWebsiteContent });
});

// 4. Submit Documents to Counter (Rate Limited, Multer Magic Bytes Inspected)
publicRouter.post(
  '/submissions', 
  submissionLimiter.middleware(), 
  handleDocumentUpload, 
  async (req: Request, res: Response): Promise<void> => {
    const ipHash = getClientIpHash(req);

    // Counter Working Hours & Status Check
    const counterCheck = isCounterCurrentlyOpen();
    if (!counterCheck.isOpen) {
      addAuditLog('FILE_BLOCKED', ipHash, `Submission blocked because counter is closed: ${counterCheck.reason}`, 'WARNING');
      res.status(403).json({ 
        error: `Counter Closed: ${counterCheck.reason}` 
      });
      return;
    }

    try {
      const parseResult = citizenSubmitSchema.safeParse(req.body);
      if (!parseResult.success) {
        const msg = parseResult.error.issues.map((i) => i.message).join(', ');
        addAuditLog('FILE_BLOCKED', ipHash, `Validation failed: ${msg}`, 'WARNING');
        res.status(400).json({ error: msg });
        return;
      }

      const { name, phone, purpose, description, autonomousId, csrfToken } = parseResult.data;

      // Attack Pattern Detection
      const attackCheck =
        detectInjectionAttack(name) ||
        detectInjectionAttack(phone) ||
        detectInjectionAttack(purpose) ||
        (description ? detectInjectionAttack(description) : { detected: false }) ||
        (autonomousId ? detectInjectionAttack(autonomousId) : { detected: false });

      if (attackCheck.detected) {
        addAuditLog('SECURITY_ATTACK', ipHash, `Blocked ${attackCheck.attackType} in document submission payload`, 'HIGH');
        res.status(400).json({ error: 'Security Exception: Restricted characters or database patterns detected in input payload.' });
        return;
      }

      // CSRF Verification (Single-Use Token)
      if (!validCsrfTokens.has(csrfToken)) {
        addAuditLog('CSRF_REJECTED', ipHash, 'Invalid or expired CSRF token on submission', 'HIGH');
        res.status(403).json({ error: 'CSRF security token invalid or expired. Please refresh the page and try again.' });
        return;
      }
      validCsrfTokens.delete(csrfToken);

      // Deep Sanitization
      const cleanName = sanitizeString(name);
      const cleanPurpose = sanitizeString(purpose);
      const cleanDescription = description ? sanitizeString(description) : '';
      const cleanAutonomousId = autonomousId ? sanitizeString(autonomousId) : `ANON-${Date.now().toString(36).toUpperCase()}`;

      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        res.status(400).json({ error: 'At least one document file is required.' });
        return;
      }

      const processedFiles: UploadedFile[] = [];

      for (const file of files) {
        const validation = validateFileMagicBytes(file.buffer, file.originalname);
        if (!validation.valid) {
          addAuditLog('FILE_BLOCKED', ipHash, `Blocked dangerous file ${file.originalname}: ${validation.reason}`, 'HIGH');
          res.status(400).json({ error: `Security Validation Failed for file '${file.originalname}': ${validation.reason}` });
          return;
        }

        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        const fileExt = path.extname(file.originalname).toLowerCase();
        const randomName = `ask_sub_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${fileExt}`;
        const savePath = path.join(UPLOADS_DIR, randomName);

        fs.writeFileSync(savePath, file.buffer);

        if (supabase) {
          try {
            const { data: buckets } = await supabase.storage.listBuckets();
            const bucketExists = buckets?.some((b: any) => b.name === 'csc-documents');
            if (!bucketExists) {
              await supabase.storage.createBucket('csc-documents', { public: true });
            }

            const { error: sErr } = await supabase.storage.from('csc-documents').upload(randomName, file.buffer, {
              contentType: file.mimetype || 'application/octet-stream',
              upsert: true,
            });

            if (sErr) {
              console.error('Supabase Storage sync upload error:', sErr.message);
            }
          } catch (sErr) {
            console.error('Supabase Storage sync upload warning:', sErr);
          }
        }

        processedFiles.push({
          id: 'FILE_' + crypto.randomBytes(8).toString('hex'),
          filename: randomName,
          original_name: file.originalname,
          size: file.size,
          mime_type: file.mimetype || 'application/octet-stream',
          file_path: savePath,
          sha256_hash: fileHash,
          scan_status: 'CLEARED',
        });
      }

      const submissionId = `ASK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const newSubmission: Submission = {
        id: submissionId,
        autonomous_id: cleanAutonomousId,
        name: cleanName,
        phone: phone.trim(),
        purpose: cleanPurpose,
        description: cleanDescription,
        files: processedFiles,
        created_at: new Date().toISOString(),
        ip_hash: ipHash,
        status: 'Pending',
      };

      if (supabase) {
        try {
          await (supabase.from('submissions') as any).insert([
            {
              id: newSubmission.id,
              autonomous_id: newSubmission.autonomous_id,
              name: newSubmission.name,
              phone: newSubmission.phone,
              purpose: newSubmission.purpose,
              description: newSubmission.description,
              files: newSubmission.files,
              created_at: newSubmission.created_at,
              ip_hash: newSubmission.ip_hash,
              status: newSubmission.status,
            },
          ]);
        } catch (err) {
          console.error('Supabase sync insert failed, saving locally', err);
        }
      }

      localSubmissions.unshift(newSubmission);
      persistData();

      addAuditLog('FILE_UPLOADED', ipHash, `Submission ${submissionId} created with ${processedFiles.length} file(s) by ${phone}`);

      res.status(201).json({
        success: true,
        submission: {
          id: newSubmission.id,
          name: newSubmission.name,
          phone: newSubmission.phone,
          purpose: newSubmission.purpose,
          description: newSubmission.description,
          files: newSubmission.files.map((f) => ({
            original_name: f.original_name,
            size: f.size,
            sha256_hash: f.sha256_hash,
            scan_status: f.scan_status,
          })),
          created_at: newSubmission.created_at,
          status: newSubmission.status,
        },
      });
    } catch (error: any) {
      console.error('Submission processing error:', error);
      addAuditLog('FILE_BLOCKED', ipHash, `Unhandled error during file submission: ${error.message}`, 'HIGH');
      res.status(500).json({ error: 'Server error processing document submission. Please try again.' });
    }
  }
);

// 5. Track Submissions by Autonomous ID
publicRouter.get('/submissions/autonomous/:autonomousId', trackingLimiter.middleware(), (req: Request, res: Response): void => {
  const { autonomousId } = req.params;

  if (!autonomousId || autonomousId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(autonomousId)) {
    res.status(400).json({ error: 'Invalid tracking token format.' });
    return;
  }

  const matches = localSubmissions.filter((sub) => sub.autonomous_id === autonomousId);
  const safeMatches = matches.map((sub) => ({
    id: sub.id,
    name: sub.name,
    phone: maskPhoneNumber(sub.phone),
    purpose: sub.purpose,
    description: sub.description,
    files: sub.files.map((f) => ({ original_name: f.original_name, size: f.size, scan_status: f.scan_status })),
    created_at: sub.created_at,
    status: sub.status,
  }));
  res.json({ submissions: safeMatches });
});

// 6. Track Submissions by Query (ID or Phone)
publicRouter.get('/submissions/track/:query', trackingLimiter.middleware(), (req: Request, res: Response): void => {
  const ipHash = getClientIpHash(req);
  const rawQuery = (req.params.query || '').trim();

  const parseResult = trackingQuerySchema.safeParse({ query: rawQuery });
  if (!parseResult.success) {
    res.status(400).json({ error: 'Search query format invalid. Letters, digits, and hyphens only (max 50 chars).' });
    return;
  }

  const attackCheck = detectInjectionAttack(rawQuery);
  if (attackCheck.detected) {
    addAuditLog('SECURITY_ATTACK', ipHash, `Blocked ${attackCheck.attackType} in tracking query: ${rawQuery}`, 'HIGH');
    res.status(400).json({ error: 'Security Exception: Restricted characters or query syntax detected.' });
    return;
  }

  const query = rawQuery.toUpperCase();
  const phoneQuery = query.replace(/\D/g, '');

  const matches = localSubmissions.filter((sub) => {
    return sub.id.toUpperCase() === query || (phoneQuery.length === 10 && sub.phone === phoneQuery);
  });

  if (matches.length === 0) {
    res.status(404).json({ error: 'No document submission found matching that Submission ID or 10-digit mobile number.' });
    return;
  }

  const safeMatches = matches.map((sub) => ({
    id: sub.id,
    name: sub.name,
    phone: maskPhoneNumber(sub.phone),
    purpose: sub.purpose,
    description: sub.description,
    file_count: sub.files.length,
    file_names: sub.files.map((f) => f.original_name),
    created_at: sub.created_at,
    status: sub.status,
  }));

  res.json({ submissions: safeMatches });
});

// 7. Community Announcements (Public)
publicRouter.get('/community', (req: Request, res: Response) => {
  const sorted = [...localCommunityPosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ posts: sorted });
});

// 8. Stream Community Media
const streamCommunityMedia = (req: Request, res: Response) => {
  const { filename } = req.params;
  const safePath = safeResolvePath(COMMUNITY_UPLOADS_DIR, filename);

  if (!safePath || !fs.existsSync(safePath)) {
    res.status(404).send('Media not found');
    return;
  }

  const ext = path.extname(safePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.ogg': 'video/ogg',
  };
  res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  const stream = fs.createReadStream(safePath);
  stream.pipe(res);
};

publicRouter.get('/community/image/:filename', streamCommunityMedia);
publicRouter.get('/community/media/:filename', streamCommunityMedia);
