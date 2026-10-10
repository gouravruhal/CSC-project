import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import WebSocket from 'ws';

import { globalApiLimiter } from '../server/middleware/rateLimiter.js';
import { syncFromSupabase } from '../server/db.js';
import { publicRouter } from '../server/routes/public.routes.js';
import { adminRouter } from '../server/routes/admin.routes.js';

(globalThis as any).WebSocket = WebSocket;
dotenv.config();

const app = express();

// Disable Express fingerprinting header (OWASP A05)
app.disable('x-powered-by');

// Security headers with Helmet (OWASP A05)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'sameorigin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use(cors({ origin: true, credentials: true }));

// Request payload limits (capped to 2mb, preventing memory DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global API rate limiting
app.use('/api', globalApiLimiter.middleware());

// Best-effort Supabase sync
syncFromSupabase().catch((err) => {
  console.warn('Supabase sync warning on serverless invocation:', err?.message || err);
});

// Mount Public & Admin API Routers under /api
app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api', adminRouter);

// Also mount routes directly in case Vercel rewrites strip the /api prefix
app.use('/admin', adminRouter);
app.use(publicRouter);
app.use(adminRouter);

export default app;
