import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

// Polyfill native WebSocket for Node.js so Supabase doesn't error
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

dotenv.config();

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'surenderbajwa1@gmail.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234567890';

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const baseDataDir = isServerless ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');

export const DATA_DIR = baseDataDir;
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const COMMUNITY_UPLOADS_DIR = path.join(DATA_DIR, 'uploads', 'community');

export const DB_FILE = path.join(DATA_DIR, 'db.json');
export const LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
export const COMMUNITY_FILE = path.join(DATA_DIR, 'community.json');
export const WEBSITE_CONTENT_FILE = path.join(DATA_DIR, 'website_content.json');
export const SESSIONS_FILE = path.join(DATA_DIR, 'admin_sessions.json');

// Ensure required directories exist (safely handled on read-only serverless filesystems)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(COMMUNITY_UPLOADS_DIR)) {
    fs.mkdirSync(COMMUNITY_UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  // Graceful fallback on read-only environments
}

// Supabase Client Initialization
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export let supabase: any = null;

if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-supabase-project')) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase client initialized:', SUPABASE_URL);
  } catch (e) {
    console.warn('⚠️ Supabase client initialization error:', e);
  }
}
