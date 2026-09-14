import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/[<>]/g, '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').replace(/[<>]/g, '').trim();

const supabaseUrl = rawUrl || 'https://placeholder.supabase.co';
const supabaseKey = rawKey || 'placeholder-key';

// Determine if running in demo mode
export const isDemoMode = import.meta.env.VITE_USE_DEMO_DATA === 'true' || 
  supabaseUrl.includes('example.supabase.co') || 
  supabaseUrl.includes('placeholder.supabase.co') || 
  !rawUrl;

let client;
try {
  client = createClient(supabaseUrl, supabaseKey);
} catch (err) {
  console.warn('Supabase initialization failed, falling back to mock client:', err);
  client = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export const supabase = client;

