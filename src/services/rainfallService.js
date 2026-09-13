import { supabase, isDemoMode } from '../lib/supabase';
import { DEMO_AREAS } from '../data/demoData';

export const rainfallService = {
  async getRainfallByArea(areaId) {
    if (isDemoMode) {
      const area = DEMO_AREAS.find(a => a.id === areaId) || DEMO_AREAS[0];
      return {
        area_id: area.id,
        area_name: area.name,
        current_mm: area.rainfall_mm,
        intensity: area.rainfall_mm > 40 ? 'Torrential' : area.rainfall_mm > 30 ? 'Heavy' : 'Moderate',
        accumulated_24h: Math.round(area.rainfall_mm * 2.8),
        forecast: area.hourly_forecast || [
          { hour: '0-1 hr', rainfall_mm: 12, probability: 70 },
          { hour: '1-2 hr', rainfall_mm: 15, probability: 75 },
          { hour: '2-3 hr', rainfall_mm: 8, probability: 60 }
        ]
      };
    }

    try {
      const { data, error } = await supabase
        .from('rainfall_data')
        .select('*')
        .eq('area_id', areaId)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return this.getRainfallByArea(areaId); // Fallback to demo structure
      }

      const row = data[0];
      return {
        area_id: areaId,
        current_mm: Number(row.rainfall_mm),
        intensity: row.rainfall_intensity || 'Moderate',
        accumulated_24h: Math.round(Number(row.rainfall_mm) * 2.5),
        forecast: [
          { hour: '0-1 hr', rainfall_mm: Math.round(row.rainfall_mm * 0.3), probability: 65 },
          { hour: '1-2 hr', rainfall_mm: Math.round(row.rainfall_mm * 0.4), probability: 75 },
          { hour: '2-3 hr', rainfall_mm: Math.round(row.rainfall_mm * 0.2), probability: 50 }
        ]
      };
    } catch (err) {
      console.error('Error fetching rainfall data:', err);
      return {
        area_id: areaId,
        current_mm: 35.0,
        intensity: 'Heavy',
        accumulated_24h: 88.0,
        forecast: []
      };
    }
  }
};
