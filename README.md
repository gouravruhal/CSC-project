# CSC Project — Maa Vaishno e-World Document Portal

An enterprise-grade, high-security digital service and document submission portal built for CSC (Common Services Center) / Atal Seva Kendra operations.

Designed for citizens and kendra operators with instant mobile document upload, live queue management, automated audit logging, community announcements, and an administrative CMS.

---

## 🚀 Key Features

- **Public Citizen Portal**:
  - Direct document upload with client-side image cropping, compression, and magic-byte MIME validation.
  - Tracking system for submitted document tokens and queue status.
  - Service directory with real-time status and operational hours.
  - Community announcement board for government schemes and citizen updates.

- **Admin Management Portal (`/admin`)**:
  - Secure credential authentication with brute-force rate-limiting and session management.
  - Live document queue with instant status updates and preview.
  - Community announcements CMS with image upload and priority pinning.
  - Website content CMS (services, equipment list, operating hours, contact details).
  - Security audit logs with IP tracking and suspicious activity alerts.

- **Security & Reliability (OWASP Compliant)**:
  - Magic byte binary inspection for all file uploads.
  - Helmet security headers and strict Content Security Policy.
  - Anti-brute force and rate limiting on all public and admin endpoints.
  - Input sanitization against XSS and injection attacks.
  - Serverless-compatible file handling with Supabase cloud persistence fallback.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Express.js, TypeScript, Multer, Helmet, Rate-Limiter
- **Database / Cloud**: Supabase (PostgreSQL + Storage) with JSON fallback
- **Deployment**: Vercel (Vite Frontend SPA + Serverless Express API)

---

## 📦 Getting Started Locally

### 1. Prerequisites
- Node.js 18+ or 20+
- npm / yarn / pnpm

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
PORT=3000
ADMIN_EMAIL=surenderbajwa1@gmail.com
ADMIN_PASSWORD=your_secure_password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ Deployment on Vercel

This repository is pre-configured for seamless Vercel deployment via `vercel.json` and `api/index.ts`.

### 1. Import Repository
1. Go to your [Vercel Dashboard](https://vercel.com/new).
2. Click **Import** and select the **CSC-project** repository.

### 2. Project Settings
Vercel will automatically detect the settings:
- **Framework Preset**: Vite
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Environment Variables
Add the following Environment Variables in your Vercel project settings:
- `ADMIN_EMAIL`: Your admin email
- `ADMIN_PASSWORD`: Your admin password
- `SUPABASE_URL`: Your Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key

### 4. Deploy
Click **Deploy**! Your site and serverless API endpoints will be live immediately.

---

## 📜 License
Private & Proprietary — Developed for Maa Vaishno e-World CSC Kendra.
