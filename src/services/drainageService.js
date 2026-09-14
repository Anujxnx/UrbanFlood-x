import { supabase, isDemoMode } from '../lib/supabase';
import { DEMO_ROADS, DEMO_DRAINAGE, DEMO_ALERTS } from '../data/demoData';
import { imdNowcastService } from './imdNowcastService';

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
    let nowcastAlert = null;
    try {
      const nowcast = await imdNowcastService.getDistrictNowcast('310');
      if (nowcast && nowcast.isActive) {
        nowcastAlert = {
          id: `imd-nowcast-${nowcast.district_id}`,
          area_name: `Dibrugarh (${nowcast.rainfall_intensity_category})`,
          severity: nowcast.warning_severity.toUpperCase() === 'RED' ? 'CRITICAL' : 'HIGH',
          message: nowcast.warning_message,
          created_at: nowcast.issue_time,
          isNowcast: true,
          severityColor: nowcast.severity_color
        };
      }
    } catch (e) {
      console.warn('Could not load nowcast alert:', e);
    }

    if (isDemoMode) {
      return nowcastAlert ? [nowcastAlert, ...DEMO_ALERTS] : DEMO_ALERTS;
    }

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`*, areas(name)`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return nowcastAlert ? [nowcastAlert, ...DEMO_ALERTS] : DEMO_ALERTS;
      }

      const list = data.map(a => ({
        id: a.id,
        area_name: a.areas?.name || 'Dibrugarh Sector',
        severity: a.severity,
        message: a.message,
        created_at: a.created_at
      }));

      return nowcastAlert ? [nowcastAlert, ...list] : list;
    } catch (e) {
      console.error('Error fetching alerts:', e);
      return nowcastAlert ? [nowcastAlert, ...DEMO_ALERTS] : DEMO_ALERTS;
    }
  }
};

