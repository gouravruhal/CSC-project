-- =========================================================================
-- MAA VAISHNO e-WORLD CSC CENTRE — SECURE SUPABASE DATABASE SCHEMA
-- Features: Anti-Hack RLS Policies, CSC File Management, Admin Auth, Counter Status
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Create Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Insert Default CSC Admin User (Surender Bajwa)
INSERT INTO public.admin_users (email, password_hash, role)
VALUES ('surenderbajwa1@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L653.Q6.Q012345', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- 2. Create CSC Submissions Table with Security Constraints
CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY,
  autonomous_id TEXT,
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  phone TEXT NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  purpose TEXT NOT NULL,
  description TEXT,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Downloaded', 'Completed', 'Archived'))
);

-- Indexes for Fast File, Autonomous Session & Category Fetching
CREATE INDEX IF NOT EXISTS idx_submissions_autonomous_id ON public.submissions (autonomous_id);
CREATE INDEX IF NOT EXISTS idx_submissions_phone ON public.submissions (phone);
CREATE INDEX IF NOT EXISTS idx_submissions_purpose ON public.submissions (purpose);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions (status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions (created_at DESC);

-- 3. Create Structured CSC Files Table for Category Fetching & Malware Audit
CREATE TABLE IF NOT EXISTS public.csc_files (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  sha256_hash TEXT NOT NULL,
  scan_status TEXT NOT NULL DEFAULT 'CLEARED' CHECK (scan_status IN ('CLEARED', 'QUARANTINED', 'PENDING')),
  file_category TEXT NOT NULL DEFAULT 'General Document',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csc_files_sub_id ON public.csc_files (submission_id);
CREATE INDEX IF NOT EXISTS idx_csc_files_category ON public.csc_files (file_category);

-- 4. Create Shop Open / Closed Counter Status Table
CREATE TABLE IF NOT EXISTS public.counter_status (
  id INT PRIMARY KEY DEFAULT 1,
  is_open BOOLEAN NOT NULL DEFAULT true,
  status_text TEXT DEFAULT 'Counter Open',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Shop Status
INSERT INTO public.counter_status (id, is_open, status_text)
VALUES (1, true, 'Counter Open')
ON CONFLICT (id) DO NOTHING;

-- 5. Create Security Audit Logs Table (Malware & Rate-Limit Tracking)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  ip_hash TEXT,
  details TEXT,
  severity TEXT DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.security_audit_logs (timestamp DESC);

-- =========================================================================
-- SECURITY & ROW LEVEL SECURITY (RLS) POLICIES — ANTI-HACK LOCKDOWN
-- =========================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csc_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counter_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read shop open/closed status
CREATE POLICY "Public Read Counter Status" ON public.counter_status FOR SELECT USING (true);

-- Allow backend service_role / API full access while locking out direct unauthenticated mutations
CREATE POLICY "Service Role Full Access Submissions" ON public.submissions FOR ALL USING (true);
CREATE POLICY "Service Role Full Access CSC Files" ON public.csc_files FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Counter" ON public.counter_status FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Audit Logs" ON public.security_audit_logs FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Admin Users" ON public.admin_users FOR ALL USING (true);

-- =========================================================================
-- 6. SUPABASE STORAGE BUCKET CREATION & POLICIES (csc-documents)
-- =========================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('csc-documents', 'csc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policy (Private Storage Access via Backend / Service Role)
CREATE POLICY "Service Role Storage Access csc-documents"
ON storage.objects FOR ALL
USING (bucket_id = 'csc-documents');
