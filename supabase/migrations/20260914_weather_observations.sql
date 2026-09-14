-- Migration: Create weather_observations table for IMD Current Weather API
-- UrbanFlood AI - Dibrugarh Flood Nowcasting System

CREATE TABLE IF NOT EXISTS public.weather_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id TEXT NOT NULL,
  station_name TEXT,
  observation_time TIMESTAMPTZ NOT NULL,
  temperature NUMERIC(5, 2),
  humidity NUMERIC(5, 2),
  wind_speed NUMERIC(5, 2),
  wind_direction TEXT,
  weather_code TEXT,
  rainfall_24h NUMERIC(6, 2),
  source TEXT DEFAULT 'IMD Current Wx API',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rapid retrieval by station and time
CREATE INDEX IF NOT EXISTS idx_weather_station_time 
  ON public.weather_observations(station_id, observation_time DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.weather_observations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to weather telemetry
DROP POLICY IF EXISTS "Public read weather observations" ON public.weather_observations;
CREATE POLICY "Public read weather observations" 
  ON public.weather_observations FOR SELECT USING (true);

-- Allow authenticated or backend service to insert new telemetry
DROP POLICY IF EXISTS "Insert weather observations" ON public.weather_observations;
CREATE POLICY "Insert weather observations" 
  ON public.weather_observations FOR INSERT WITH CHECK (true);
