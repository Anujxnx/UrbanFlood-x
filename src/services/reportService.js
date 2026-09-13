import { supabase, isDemoMode } from '../lib/supabase';
import { DEMO_REPORTS } from '../data/demoData';

// Persistent in-memory array for demo mode reports submitted during a live session
let localDemoReports = [...DEMO_REPORTS];

export const reportService = {
  async getReports() {
    if (isDemoMode) {
      return localDemoReports;
    }

    try {
      const { data, error } = await supabase
        .from('user_reports')
        .select(`*, areas(name)`)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Fallback to demo reports:', error);
        return localDemoReports;
      }

      return data.map(r => ({
        id: r.id,
        user_name: 'Community Contributor',
        area_name: r.areas?.name || 'Dibrugarh Area',
        severity: r.severity,
        description: r.description,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        status: r.status || 'Pending',
        created_at: r.created_at
      }));
    } catch (e) {
      console.error('Error fetching reports:', e);
      return localDemoReports;
    }
  },

  async createReport({ area_id, area_name, description, severity, latitude, longitude, userId }) {
    if (isDemoMode) {
      const newReport = {
        id: `rep-${Date.now()}`,
        user_name: 'You (Citizen Report)',
        area_name: area_name || 'Dibrugarh Sector',
        severity,
        description,
        latitude: Number(latitude),
        longitude: Number(longitude),
        status: 'Submitted (Live Demo)',
        created_at: new Date().toISOString()
      };
      localDemoReports.unshift(newReport);
      return newReport;
    }

    try {
      const { data, error } = await supabase
        .from('user_reports')
        .insert({
          user_id: userId,
          area_id: area_id || null,
          description,
          severity,
          latitude: Number(latitude),
          longitude: Number(longitude),
          status: 'Pending'
        })
        .select();

      if (error) {
        throw new Error(error.message || 'Failed to submit report to Supabase.');
      }

      return data[0];
    } catch (err) {
      console.error('Create Report Error:', err);
      throw err;
    }
  }
};
