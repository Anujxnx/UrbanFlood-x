import { supabase, isDemoMode } from '../lib/supabase';
import { DEMO_AREAS } from '../data/demoData';

export const areaService = {
  async getAreas() {
    if (isDemoMode) {
      return DEMO_AREAS;
    }

    try {
      const { data, error } = await supabase
        .from('areas')
        .select(`
          *,
          rainfall_data (rainfall_mm, rainfall_intensity),
          predictions (waterlogging_probability, risk_level),
          elevation_features (elevation, slope, flow_accumulation)
        `);

      if (error || !data || data.length === 0) {
        console.warn('Supabase areas fetch fallback to DEMO_AREAS:', error);
        return DEMO_AREAS;
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        district: item.district,
        state: item.state,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        geometry: item.geometry,
        risk_level: item.predictions?.[0]?.risk_level || 'LOW',
        waterlogging_probability: Number(item.predictions?.[0]?.waterlogging_probability || 20),
        rainfall_mm: Number(item.rainfall_data?.[0]?.rainfall_mm || 15),
        elevation: Number(item.elevation_features?.[0]?.elevation || 100),
        slope: Number(item.elevation_features?.[0]?.slope || 0.5),
        flow_accumulation: Number(item.elevation_features?.[0]?.flow_accumulation || 500)
      }));
    } catch (err) {
      console.error('Error fetching areas:', err);
      return DEMO_AREAS;
    }
  },

  async getAreaById(id) {
    const areas = await this.getAreas();
    return areas.find(a => a.id === id) || areas[0];
  },

  searchAreas(query, areas) {
    if (!query) return areas;
    const lower = query.toLowerCase().trim();
    return areas.filter(a => a.name.toLowerCase().includes(lower));
  }
};
