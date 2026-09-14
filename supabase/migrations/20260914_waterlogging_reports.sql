-- Migration: Waterlogging Reports Table & Supabase Storage Integration
-- Ensures support for crowdsourced citizen waterlogging reports with image URLs and incident IDs

-- 1. Extend user_reports table with incident_id, location_name, image_url, and flexible user_id
DO $$ 
BEGIN
  -- Add incident_id column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'incident_id') THEN
    ALTER TABLE public.user_reports ADD COLUMN incident_id TEXT;
  END IF;

  -- Add location_name column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'location_name') THEN
    ALTER TABLE public.user_reports ADD COLUMN location_name TEXT;
  END IF;

  -- Add image_url column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'image_url') THEN
    ALTER TABLE public.user_reports ADD COLUMN image_url TEXT;
  END IF;

  -- Allow nullable user_id for anonymous or guest citizen submissions
  ALTER TABLE public.user_reports ALTER COLUMN user_id DROP NOT NULL;
END $$;

-- 2. Ensure waterlogging_reports view/synonym exists for compatibility
CREATE OR REPLACE VIEW public.waterlogging_reports AS
SELECT 
  id,
  incident_id,
  user_id,
  COALESCE(location_name, 'Dibrugarh') AS location_name,
  area_id,
  latitude,
  longitude,
  severity,
  description,
  image_url,
  status,
  created_at
FROM public.user_reports;

-- 3. Indexes for rapid lookup
CREATE INDEX IF NOT EXISTS idx_user_reports_incident_id ON public.user_reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON public.user_reports(created_at DESC);

-- 4. Enable Row Level Security & Policies
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read reports
DROP POLICY IF EXISTS "Anyone can view user reports" ON public.user_reports;
CREATE POLICY "Anyone can view user reports" ON public.user_reports FOR SELECT USING (true);

-- Allow both authenticated and anonymous citizen submissions
DROP POLICY IF EXISTS "Anyone can create reports" ON public.user_reports;
CREATE POLICY "Anyone can create reports" ON public.user_reports FOR INSERT WITH CHECK (true);

-- Allow updating report status (for municipal response dispatchers)
DROP POLICY IF EXISTS "Anyone can update reports" ON public.user_reports;
CREATE POLICY "Anyone can update reports" ON public.user_reports FOR UPDATE USING (true);

-- Allow deleting reports
DROP POLICY IF EXISTS "Anyone can delete reports" ON public.user_reports;
CREATE POLICY "Anyone can delete reports" ON public.user_reports FOR DELETE USING (true);
