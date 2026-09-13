import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

// Determine if running in demo mode
export const isDemoMode = import.meta.env.VITE_USE_DEMO_DATA === 'true' || 
  supabaseUrl.includes('example.supabase.co') || 
  supabaseUrl.includes('placeholder.supabase.co') || 
  !supabaseUrl;

export const supabase = createClient(supabaseUrl, supabaseKey);
