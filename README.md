# Maa Vaishno e-World — Citizen Service & Document Processing Portal

[![Production Build](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)]()
[![React](https://img.shields.io/badge/React-19-cyan.svg)]()
[![OWASP Security](https://img.shields.io/badge/Security-OWASP%20Compliant-emerald.svg)]()
[![License](https://img.shields.io/badge/license-Proprietary-slate.svg)]()

An enterprise-grade, high-security digital citizen service and document processing portal engineered for **CSC (Common Services Center) / Atal Seva Kendra** operations. 

Featuring mobile document submission with client-side magic-byte inspection, real-time queue management, and an **in-browser Operator Studio** dynamic across PDF, Word, Excel, and image formats.

---

## 🌟 Architecture & Core Modules

### 1. Dynamic Operator Studio
The Operator Processing Studio adapts dynamically to the active document format:
- **PDF Suite**:
  - In-studio live saving and immediate preview updates (Rotate, Watermark, Page Numbers, Compress).
  - Multi-document merge with one-click batch action from the sidebar.
  - Page range extraction (split) with instant download or in-studio inspection.
  - Revert and safe print utilities.
- **Word Document Studio (MS Word-Grade)**:
  - Office-style ribbon toolbar: Home (Fonts, Sizes, Bold/Italic/Underline, Alignment), Layout (Margins, Orientation, Spacing), and Review (Live Word count, Character count, Proofing).
  - Realistic A4 page canvas with margin ruler, drop-shadow elevation, and bottom status bar.
  - Export to PDF, print, and clipboard copy.
- **Excel Spreadsheet Studio (MS Excel-Grade)**:
  - Office green ribbon with interactive Formula Bar (Cell coordinate indicator `A1`, `fx`, formula/value input).
  - Live mathematical summary pills (COUNT, SUM, AVERAGE, MIN, MAX).
  - Interactive grid (Columns A–G, Rows 1–14+) with active cell indicator, CSV export, and formatted sheet printing.
- **Image Editing & Optimization Studio**:
  - Aspect ratio crop presets (Passport, Aadhaar, PAN card, A4, Freeform).
  - Fine-angle rotation (-45° to +45°), 90° increments, and straighten grid.
  - Xerox Black & White thresholding, invert, and document contrast boost.
  - Multi-stage target size compression (`<20KB`, `<50KB`, `<100KB`, `<200KB`, custom KB).

### 2. Public Citizen Portal
- Instant multi-document upload with magic-byte MIME validation.
- Live tracking system with token IDs and status progression.
- Service catalog with government fee transparency and operational schedules.
- Community announcement board for welfare schemes and local updates.

### 3. Administrative Management (`/admin`)
- Role-based credential authentication with brute-force rate-limiting.
- Live queue dashboard with filtering, search, and batch status toggles.
- Announcements CMS with priority pinning and image uploads.
- Website Content CMS (equipment list, services, operating hours).
- OWASP-compliant security audit logs with IP hashing and threat detection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Document Processing** | `pdf-lib`, HTML5 Canvas API, Web Workers |
| **Backend API** | Node.js, Express.js (TypeScript), Multer, Helmet, Express-Rate-Limit |
| **Database & Cloud Storage** | Supabase (PostgreSQL + S3 Storage) with automatic JSON-cache fallback |
| **Deployment** | Vercel (Single-Page Application + Serverless Functions) |

---

## 📁 Modular Directory Structure

```text
src/
├── admin/
│   ├── components/
│   │   ├── workspace/
│   │   │   ├── office/              # Word & Excel Studio components & hooks
│   │   │   ├── pdfSuite/            # PDF manipulation panels & actions
│   │   │   ├── CustomerDetailCard   # Citizen particulars card (Left column)
│   │   │   ├── FileListSidebar      # Document selection with multi-select checkboxes
│   │   │   ├── ImageToolsDeck       # Crop, rotate, xerox, and compression tools
│   │   │   ├── StudioStageContainer # Dynamic stage switcher (Image / PDF / Word / Excel)
│   │   │   ├── WorkspaceTopBar      # Fixed action top bar (Save, Print, Back)
│   │   │   └── workspaceHelpers     # MIME & file type categorization helpers
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminCommunityManager.tsx
│   │   └── OperatorWorkspace.tsx    # Workspace controller (< 200 lines)
├── lib/
│   ├── pdfSuite/                    # Core PDF byte manipulation engines
│   └── apiCache.ts                  # Resilient API communication layer
├── public/                          # Citizen-facing home, upload, and service pages
└── types.ts                         # Universal TypeScript definitions
```

> **Code Quality Standard**: Strict modularity guidelines are enforced across all studio components with a hard limit of `< 200 lines per file`, zero TypeScript errors, and zero compiler warnings.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 2. Installation
```bash
git clone https://github.com/gouravruhal/CSC-project.git
cd CSC-project
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your environment credentials:
```env
PORT=3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run Locally
```bash
# Start frontend and backend concurrently
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Verification

```bash
# Run TypeScript compilation check
npm run lint

# Build production bundle and serverless assets
npm run build
```

---

## ⚡ Production Deployment (Vercel)

The repository includes pre-configured `vercel.json` routing rules for hosting both the Vite frontend bundle and the Express API serverless functions.

1. Connect the repository in your **Vercel Dashboard**.
2. Set Build Command to `vite build` and Output Directory to `dist`.
3. Add the required environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Trigger deployment.

---

## 📜 License & Compliance
Proprietary software developed for **Maa Vaishno e-World Common Services Center (CSC)**, Rairkalan, Panipat, Haryana. All rights reserved.
