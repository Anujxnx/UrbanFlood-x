-- Migration: Create nowcast_warnings table for IMD District Nowcast API
-- UrbanFlood AI - Dibrugarh Flood Nowcasting System

CREATE TABLE IF NOT EXISTS public.nowcast_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id TEXT NOT NULL,
  district_name TEXT DEFAULT 'Dibrugarh',
  state_name TEXT DEFAULT 'Assam',
  warning_severity TEXT NOT NULL, -- 'Green', 'Yellow', 'Orange', 'Red'
  severity_color TEXT NOT NULL,    -- Hex color e.g. '#f97316'
  rainfall_intensity_category TEXT NOT NULL, -- 'Light rain: < 5 mm/hr', 'Moderate rain: 5–15 mm/hr', 'Heavy rain: > 15 mm/hr'
  rainfall_rate_mm_hr NUMERIC(5, 2),
  thunderstorm_warning BOOLEAN DEFAULT false,
  lightning_warning BOOLEAN DEFAULT false,
  warning_message TEXT NOT NULL,
  issue_time TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  source TEXT DEFAULT 'IMD District Nowcast API',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rapid lookup of active warnings
CREATE INDEX IF NOT EXISTS idx_nowcast_district_validity 
  ON public.nowcast_warnings(district_id, valid_until DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.nowcast_warnings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to nowcast bulletins
DROP POLICY IF EXISTS "Public read nowcast warnings" ON public.nowcast_warnings;
CREATE POLICY "Public read nowcast warnings" 
  ON public.nowcast_warnings FOR SELECT USING (true);

-- Allow authenticated or backend service to insert nowcast warnings
DROP POLICY IF EXISTS "Insert nowcast warnings" ON public.nowcast_warnings;
CREATE POLICY "Insert nowcast warnings" 
  ON public.nowcast_warnings FOR INSERT WITH CHECK (true);
