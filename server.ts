import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import WebSocket from 'ws';

import { PORT } from './server/config.js';
import { globalApiLimiter } from './server/middleware/rateLimiter.js';
import { syncFromSupabase } from './server/db.js';
import { getLocalNetworkDetails } from './server/utils.js';
import { publicRouter } from './server/routes/public.routes.js';
import { adminRouter } from './server/routes/admin.routes.js';

(globalThis as any).WebSocket = WebSocket;
dotenv.config();

const app = express();

// Disable Express fingerprinting header (OWASP A05)
app.disable('x-powered-by');

// Security headers with Helmet (OWASP A05)
app.use(
  helmet({
    contentSecurityPolicy: false, // Vite inline scripts in dev
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

// Stricter request payload limits (capped to 2mb, preventing memory DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global API rate limiting
app.use('/api', globalApiLimiter.middleware());

// Favicon handler
app.get('/favicon.ico', (req: Request, res: Response) => {
  const iconPath = path.join(process.cwd(), 'public', 'logo.png');
  if (fs.existsSync(iconPath)) {
    res.sendFile(iconPath);
  } else {
    res.status(204).end();
  }
});

// Mount Public & Admin API Routers
app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api', adminRouter); // Allows legacy /api/community & /api/website-content endpoints

// Vite / Production Static Server Setup
async function startServer() {
  const httpServer = http.createServer(app);
  await syncFromSupabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        allowedHosts: true,
        cors: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? { server: httpServer } : false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use by another running terminal or background process.`);
      console.error(`💡 Run: npx kill-port ${PORT} to free the port, or restart your terminal.\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    const { primaryWifiIp, allIps } = getLocalNetworkDetails();
    console.log(`\n===============================================================`);
    console.log(`🚀 MAA VAISHNO e-WORLD PORTAL IS READY FOR LOCAL & MOBILE ACCESS`);
    console.log(`===============================================================`);
    console.log(`💻 Laptop / Local Browser : http://localhost:${PORT}`);
    if (primaryWifiIp) {
      console.log(`📱 Phone (Same Wi-Fi)     : http://${primaryWifiIp}:${PORT}`);
    }
    const otherIps = allIps.filter((e) => e.ip !== primaryWifiIp);
    if (otherIps.length > 0) {
      console.log(`🌐 Other Network Interfaces:`);
      otherIps.forEach((e) => {
        console.log(`   • ${e.name}: http://${e.ip}:${PORT}`);
      });
    }
    console.log(`---------------------------------------------------------------`);
    console.log(`💡 Mobile Connection Guide:`);
    console.log(`   1. Connect your phone to the same Wi-Fi router as this laptop.`);
    console.log(`   2. Open Chrome or Safari on your phone.`);
    console.log(`   3. Type http://${primaryWifiIp || '<YOUR-IP>'}:${PORT} in the phone browser.`);
    console.log(`===============================================================\n`);
  });
}

startServer();
