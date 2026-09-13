-- UrbanFlood AI - Initial Supabase & PostgreSQL Migration
-- Dibrugarh Urban Waterlogging Prediction & Drainage Response System

-- Enable PostGIS extension if available
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AREAS TABLE (Dibrugarh Localities)
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT DEFAULT 'Dibrugarh',
  state TEXT DEFAULT 'Assam',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geometry JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RAINFALL DATA TABLE
CREATE TABLE IF NOT EXISTS public.rainfall_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  rainfall_mm NUMERIC(6, 2) NOT NULL,
  rainfall_intensity TEXT,
  forecast_hour INT DEFAULT 1,
  source TEXT DEFAULT 'AWS Radar/Sensor Network',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROADS TABLE
CREATE TABLE IF NOT EXISTS public.roads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  road_type TEXT NOT NULL,
  geometry JSONB NOT NULL,
  importance TEXT DEFAULT 'Medium',
  risk_level TEXT DEFAULT 'LOW',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DRAINAGE NETWORK TABLE
CREATE TABLE IF NOT EXISTS public.drainage_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  drain_type TEXT NOT NULL,
  geometry JSONB NOT NULL,
  capacity NUMERIC(6, 2),
  status TEXT DEFAULT 'Operational',
  blockage_status TEXT DEFAULT 'None',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ELEVATION FEATURES TABLE
CREATE TABLE IF NOT EXISTS public.elevation_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  elevation NUMERIC(6, 2) NOT NULL,
  slope NUMERIC(5, 2) NOT NULL,
  flow_accumulation NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FLOOD EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.flood_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  rainfall_mm NUMERIC(6, 2),
  water_depth NUMERIC(5, 2),
  duration INT,
  severity TEXT NOT NULL,
  source TEXT DEFAULT 'Dibrugarh Municipal Record',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  prediction_time TIMESTAMPTZ DEFAULT NOW(),
  forecast_time TIMESTAMPTZ DEFAULT NOW(),
  rainfall_mm NUMERIC(6, 2),
  waterlogging_probability NUMERIC(5, 2) NOT NULL,
  risk_level TEXT NOT NULL,
  model_name TEXT DEFAULT 'XGBoost-Dibrugarh-v1',
  model_version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. USER REPORTS TABLE (Crowdsourced Waterlogging Reports)
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_rainfall_area_time ON public.rainfall_data(area_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_area_time ON public.predictions(area_id, prediction_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_area ON public.user_reports(area_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(is_active);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rainfall_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drainage_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elevation_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flood_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Reports RLS
CREATE POLICY "Anyone can view user reports" ON public.user_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reports" ON public.user_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own reports" ON public.user_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.user_reports FOR DELETE USING (auth.uid() = user_id);

-- Public Read Access for System Datasets
CREATE POLICY "Public read areas" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Public read rainfall" ON public.rainfall_data FOR SELECT USING (true);
CREATE POLICY "Public read roads" ON public.roads FOR SELECT USING (true);
CREATE POLICY "Public read drainage" ON public.drainage_network FOR SELECT USING (true);
CREATE POLICY "Public read elevation" ON public.elevation_features FOR SELECT USING (true);
CREATE POLICY "Public read flood events" ON public.flood_events FOR SELECT USING (true);
CREATE POLICY "Public read predictions" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Public read alerts" ON public.alerts FOR SELECT USING (true);

-- TRIGGER FOR AUTOMATIC PROFILE CREATION ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'System User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
