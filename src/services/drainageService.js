import { supabase, isDemoMode } from '../lib/supabase';
import { DEMO_ROADS, DEMO_DRAINAGE, DEMO_ALERTS } from '../data/demoData';

export const drainageService = {
  async getRoads() {
    if (isDemoMode) return DEMO_ROADS;

    try {
      const { data, error } = await supabase.from('roads').select('*');
      if (error || !data || data.length === 0) return DEMO_ROADS;
      return data.map(r => ({
        ...r,
        coordinates: r.geometry?.coordinates || []
      }));
    } catch (e) {
      console.error('Error fetching roads:', e);
      return DEMO_ROADS;
    }
  },

  async getDrainageNetwork() {
    if (isDemoMode) return DEMO_DRAINAGE;

    try {
      const { data, error } = await supabase.from('drainage_network').select('*');
      if (error || !data || data.length === 0) return DEMO_DRAINAGE;
      return data.map(d => ({
        ...d,
        coordinates: d.geometry?.coordinates || []
      }));
    } catch (e) {
      console.error('Error fetching drainage network:', e);
      return DEMO_DRAINAGE;
    }
  },

  async getAlerts() {
    if (isDemoMode) return DEMO_ALERTS;

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`*, areas(name)`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return DEMO_ALERTS;

      return data.map(a => ({
        id: a.id,
        area_name: a.areas?.name || 'Dibrugarh Sector',
        severity: a.severity,
        message: a.message,
        created_at: a.created_at
      }));
    } catch (e) {
      console.error('Error fetching alerts:', e);
      return DEMO_ALERTS;
    }
  }
};
