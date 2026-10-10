import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Multer memory storage for file validation before saving
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max per file
    files: 10, // max 10 files
  },
});

// Safe Multer Upload Middleware catching MulterErrors cleanly
export const handleDocumentUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload.array('files', 10)(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File size exceeds maximum allowed limit (25MB per file).' });
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({ error: 'Maximum 10 files allowed per document submission.' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      }
      res.status(400).json({ error: err.message || 'File upload error.' });
      return;
    }
    next();
  });
};

// File validation helper (Magic Bytes)
export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.zip'];
export const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.dll', '.php', '.html', '.htm', '.svg', '.js', '.sh', '.scr', '.elf', '.com', '.vbs', '.ps1'];

export function validateFileMagicBytes(buffer: Buffer, originalName: string): { valid: boolean; reason?: string } {
  const ext = path.extname(originalName).toLowerCase();

  if (DISALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: `Executable or script extension ${ext} is strictly prohibited.` };
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: `Extension ${ext} is not allowed. Supported formats: PDF, DOC, DOCX, PNG, JPG, JPEG, WEBP, TXT, ZIP.` };
  }

  // Check magic header bytes
  if (buffer.length < 4) {
    return { valid: false, reason: 'File content is empty or corrupt.' };
  }

  // Check executable signature MZ (EXE/DLL)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { valid: false, reason: 'Executable headers detected (MZ signature blocked).' };
  }

  // Check ELF executable
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return { valid: false, reason: 'Executable binary signature detected (ELF).' };
  }

  // Check SVG / HTML / Script injection content
  const sample = buffer.subarray(0, 1024).toString('utf-8').toLowerCase();
  if (sample.includes('<script') || sample.includes('javascript:') || sample.includes('<?php')) {
    return { valid: false, reason: 'Script or HTML tag injection detected inside file content.' };
  }

  // Validate specific magic bytes per allowed extensions
  if (ext === '.pdf') {
    const isPdf = buffer.subarray(0, 4).toString() === '%PDF';
    if (!isPdf) return { valid: false, reason: 'File extension is .pdf but binary header does not match PDF magic bytes.' };
  } else if (ext === '.png') {
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp = buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
    if (!isPng && !isJpg && !isWebp) return { valid: false, reason: 'File extension is .png but binary header does not match valid image magic bytes.' };
  } else if (ext === '.jpg' || ext === '.jpeg') {
    const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
    if (!isJpg && !isPng && !isWebp) return { valid: false, reason: 'File header does not match valid image magic bytes.' };
  } else if (ext === '.webp') {
    const isWebp = buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (!isWebp && !isPng && !isJpg) return { valid: false, reason: 'File header does not match valid image magic bytes.' };
  } else if (ext === '.zip' || ext === '.docx') {
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    if (!isZip) return { valid: false, reason: 'File header does not match ZIP/DOCX container magic bytes.' };
  } else if (ext === '.doc') {
    const isOle = buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
    if (!isOle) return { valid: false, reason: 'File header does not match DOC OLE compound document magic bytes.' };
  }

  return { valid: true };
}
