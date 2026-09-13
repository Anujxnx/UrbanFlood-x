-- Seed Data for Dibrugarh Waterlogging Prediction System (UrbanFlood AI)

-- 1. Insert Initial Dibrugarh Localities
INSERT INTO public.areas (id, name, district, state, latitude, longitude) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Lachit Nagar', 'Dibrugarh', 'Assam', 27.4728, 94.9120),
  ('a2222222-2222-2222-2222-222222222222', 'Dibrugarh University', 'Dibrugarh', 'Assam', 27.4479, 94.8911),
  ('a3333333-3333-3333-3333-333333333333', 'Dibrugarh West', 'Dibrugarh', 'Assam', 27.4812, 94.8985),
  ('a4444444-4444-4444-4444-444444444444', 'Barbaruah Chuk', 'Dibrugarh', 'Assam', 27.4350, 94.8520),
  ('a5555555-5555-5555-5555-555555555555', 'Panitola', 'Dibrugarh', 'Assam', 27.4610, 95.0320),
  ('a6666666-6666-6666-6666-666666666666', 'Chowkidinghee', 'Dibrugarh', 'Assam', 27.4795, 94.9180),
  ('a7777777-7777-7777-7777-777777777777', 'Graham Bazar', 'Dibrugarh', 'Assam', 27.4880, 94.9075);

-- 2. Insert Rainfall Records
INSERT INTO public.rainfall_data (area_id, rainfall_mm, rainfall_intensity, forecast_hour, source) VALUES
  ('a1111111-1111-1111-1111-111111111111', 42.50, 'Heavy', 1, 'AWS Radar Nowcast'),
  ('a2222222-2222-2222-2222-222222222222', 18.20, 'Moderate', 1, 'AWS Radar Nowcast'),
  ('a3333333-3333-3333-3333-333333333333', 35.80, 'Heavy', 1, 'AWS Radar Nowcast'),
  ('a4444444-4444-4444-4444-444444444444', 31.00, 'Heavy', 1, 'AWS Radar Nowcast'),
  ('a5555555-5555-5555-5555-555555555555', 12.40, 'Light', 1, 'AWS Radar Nowcast'),
  ('a6666666-6666-6666-6666-666666666666', 28.50, 'Moderate', 1, 'AWS Radar Nowcast'),
  ('a7777777-7777-7777-7777-777777777777', 48.00, 'Torrential', 1, 'AWS Radar Nowcast');

-- 3. Insert Elevation Features
INSERT INTO public.elevation_features (area_id, elevation, slope, flow_accumulation) VALUES
  ('a1111111-1111-1111-1111-111111111111', 99.20, 0.45, 1250.40),
  ('a2222222-2222-2222-2222-222222222222', 104.50, 1.20, 420.10),
  ('a3333333-3333-3333-3333-333333333333', 98.80, 0.30, 1890.60),
  ('a4444444-4444-4444-4444-444444444444', 101.10, 0.80, 850.30),
  ('a5555555-5555-5555-5555-555555555555', 106.30, 1.50, 210.00),
  ('a6666666-6666-6666-6666-666666666666', 100.10, 0.50, 940.20),
  ('a7777777-7777-7777-7777-777777777777', 97.90, 0.20, 2150.80);

-- 4. Insert ML Predictions
INSERT INTO public.predictions (area_id, rainfall_mm, waterlogging_probability, risk_level, model_name, model_version) VALUES
  ('a1111111-1111-1111-1111-111111111111', 42.50, 78.50, 'HIGH', 'XGBoost-Dibrugarh-v1', '1.0.0'),
  ('a2222222-2222-2222-2222-222222222222', 18.20, 22.10, 'LOW', 'XGBoost-Dibrugarh-v1', '1.0.0'),
  ('a3333333-3333-3333-3333-333333333333', 35.80, 68.40, 'HIGH', 'XGBoost-Dibrugarh-v1', '1.0.0'),
  ('a4444444-4444-4444-4444-444444444444', 31.00, 54.00, 'MEDIUM', 'XGBoost-Dibrugarh-v1', '1.0.0'),
  ('a5555555-5555-5555-5555-555555555555', 12.40, 15.00, 'LOW', 'XGBoost-Dibrugarh-v1', '1.0.0'),
  ('a6666666-6666-6666-6666-666666666666', 28.50, 48.00, 'MEDIUM', 'XGBoost-Dibrugarh-v1', '1.0.0'),
  ('a7777777-7777-7777-7777-777777777777', 48.00, 89.20, 'CRITICAL', 'XGBoost-Dibrugarh-v1', '1.0.0');

-- 5. Insert Active Alerts
INSERT INTO public.alerts (area_id, severity, message, is_active) VALUES
  ('a7777777-7777-7777-7777-777777777777', 'CRITICAL', 'Severe water accumulation imminent in Graham Bazar low-lying road corridors. Evacuation advisory for basement stores.', true),
  ('a1111111-1111-1111-1111-111111111111', 'HIGH', 'High waterlogging probability (78%) in Lachit Nagar. Municipal pump deployment recommended.', true),
  ('a3333333-3333-3333-3333-333333333333', 'HIGH', 'Drainage overflow expected along Dibrugarh West main collector line.', true);
