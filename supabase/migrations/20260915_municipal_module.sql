-- Migration: Municipal Authority Operations & Citizen Incident Management
-- Adds role-based access control, response team assignment, municipal actions, and status tracking

-- 1. Extend profiles table with role column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'citizen';
    -- Add check constraint for supported roles
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profile_role CHECK (role IN ('citizen', 'municipal_authority'));
  END IF;
END $$;

-- 2. Update handle_new_user() trigger function to capture role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'System User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Extend user_reports table with municipal dispatch & action columns
DO $$ 
BEGIN
  -- assigned_team: e.g. "DMC Drainage Squad 02", "Mobile Dewatering Pump Unit 04"
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'assigned_team') THEN
    ALTER TABLE public.user_reports ADD COLUMN assigned_team TEXT DEFAULT NULL;
  END IF;

  -- priority: LOW, MEDIUM, HIGH, CRITICAL
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'priority') THEN
    ALTER TABLE public.user_reports ADD COLUMN priority TEXT DEFAULT 'MEDIUM';
  END IF;

  -- municipal_action: Official field remarks / action taken by the municipal authority
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'municipal_action') THEN
    ALTER TABLE public.user_reports ADD COLUMN municipal_action TEXT DEFAULT NULL;
  END IF;

  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'updated_at') THEN
    ALTER TABLE public.user_reports ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- resolved_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'resolved_at') THEN
    ALTER TABLE public.user_reports ADD COLUMN resolved_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- 4. Update waterlogging_reports view/synonym to expose all new fields
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
  assigned_team,
  priority,
  municipal_action,
  created_at,
  updated_at,
  resolved_at
FROM public.user_reports;

-- 5. Indexes for fast filtering and statistics aggregation
CREATE INDEX IF NOT EXISTS idx_user_reports_priority ON public.user_reports(priority);
CREATE INDEX IF NOT EXISTS idx_user_reports_assigned_team ON public.user_reports(assigned_team);
CREATE INDEX IF NOT EXISTS idx_user_reports_updated_at ON public.user_reports(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 6. RLS Policies
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read of user profiles (for displaying contributor/officer names)
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

-- Allow authenticated users to manage own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow reading all reports
DROP POLICY IF EXISTS "Anyone can view user reports" ON public.user_reports;
CREATE POLICY "Anyone can view user reports" ON public.user_reports FOR SELECT USING (true);

-- Allow citizens and anonymous guests to report incidents
DROP POLICY IF EXISTS "Anyone can create reports" ON public.user_reports;
CREATE POLICY "Anyone can create reports" ON public.user_reports FOR INSERT WITH CHECK (true);

-- Allow updating report status and municipal action
DROP POLICY IF EXISTS "Anyone can update reports" ON public.user_reports;
CREATE POLICY "Anyone can update reports" ON public.user_reports FOR UPDATE USING (true);

-- Allow deleting reports
DROP POLICY IF EXISTS "Anyone can delete reports" ON public.user_reports;
CREATE POLICY "Anyone can delete reports" ON public.user_reports FOR DELETE USING (true);
