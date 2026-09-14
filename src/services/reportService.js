import { supabase, isDemoMode } from '../lib/supabase';
import { DEMO_REPORTS } from '../data/demoData';

const LOCAL_STORAGE_KEY = 'dibrugarh_waterlogging_reports';

// Helper to retrieve locally cached citizen reports
const getStoredLocalReports = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Unable to read localStorage reports:', e);
  }
  return [];
};

// Helper to save locally cached citizen reports
const saveStoredLocalReports = (reports) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.warn('Unable to save to localStorage reports:', e);
  }
};

// Default initial demo reports formatted with incident IDs
const INITIAL_DEMO_REPORTS = [
  {
    id: 'rep-1',
    incident_id: 'WF-2026-00101',
    user_name: 'Animesh Gogoi',
    location_name: 'Lachit Nagar',
    area_name: 'Lachit Nagar',
    severity: 'HIGH',
    description: 'Water accumulation of approx 1.5 ft near Lachit Nagar Girls High School street.',
    latitude: 27.4728,
    longitude: 94.9120,
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80',
    status: 'Under Review',
    created_at: new Date(Date.now() - 2500000).toISOString()
  },
  {
    id: 'rep-2',
    incident_id: 'WF-2026-00102',
    user_name: 'Priyanka Saikia',
    location_name: 'Gram Bazar',
    area_name: 'Gram Bazar',
    severity: 'CRITICAL',
    description: 'Market road submerged completely. Drains backflowing into ground floor shops.',
    latitude: 27.4880,
    longitude: 94.9075,
    image_url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    status: 'Pending',
    created_at: new Date(Date.now() - 1200000).toISOString()
  }
];

export const reportService = {
  /**
   * Upload an incident photo to Supabase Storage bucket 'waterlogging-reports'
   * Falls back to a persistent base64 data URL if the bucket is unconfigured or offline.
   */
  async uploadReportImage(file) {
    if (!file) {
      throw new Error('No image file selected.');
    }

    // Validate image format
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.type.toLowerCase())) {
      throw new Error('Unsupported image format. Please upload a JPG, JPEG, or PNG image.');
    }

    // Validate image file size (max 10MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(`Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
    }

    // Convert file to Base64 for instant preview and fallback resilience
    const base64DataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });

    // Attempt upload to Supabase Storage bucket 'waterlogging-reports'
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `reports/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('waterlogging-reports')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('waterlogging-reports')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            storageType: 'supabase-storage',
            fileName: cleanFileName
          };
        }
      } else if (error) {
        console.warn('Supabase storage upload error, using persistent data URL fallback:', error.message);
      }
    } catch (storageErr) {
      console.warn('Supabase storage exception, using persistent data URL fallback:', storageErr);
    }

    // High-reliability local fallback for demo/offline presentations
    return {
      url: base64DataUrl,
      storageType: 'local-persistent',
      fileName: file.name
    };
  },

  /**
   * Fetch all waterlogging reports (Supabase + local persistent cache)
   */
  async getReports() {
    let remoteReports = [];
    
    if (!isDemoMode) {
      try {
        const { data, error } = await supabase
          .from('user_reports')
          .select(`*, areas(name)`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          remoteReports = data.map(r => ({
            id: r.id,
            incident_id: r.incident_id || `WF-2026-${String(r.id).slice(0, 5)}`,
            user_name: r.user_name || 'Community Contributor',
            user_id: r.user_id || null,
            location_name: r.location_name || r.areas?.name || 'Dibrugarh Area',
            area_name: r.location_name || r.areas?.name || 'Dibrugarh Area',
            severity: (r.severity || 'HIGH').toUpperCase(),
            description: r.description || '',
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            image_url: r.image_url || null,
            status: r.status || 'Pending',
            assigned_team: r.assigned_team || null,
            priority: r.priority || (r.severity === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM'),
            municipal_action: r.municipal_action || null,
            created_at: r.created_at,
            updated_at: r.updated_at || r.created_at,
            resolved_at: r.resolved_at || null
          }));
        }
      } catch (e) {
        console.warn('Error fetching Supabase reports:', e);
      }
    }

    // Load locally saved reports
    const storedLocal = getStoredLocalReports();
    
    // Check for user-deleted report IDs in localStorage
    let deletedIds = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem('dibrugarh_deleted_report_ids') || '[]');
    } catch (e) {
      console.warn('Error reading deleted reports list:', e);
    }

    const isNotDeleted = (r) => {
      const idStr = String(r.id || '');
      const incStr = String(r.incident_id || '');
      return !deletedIds.includes(idStr) && !deletedIds.includes(incStr);
    };

    // Combine and deduplicate
    const combined = [...remoteReports, ...storedLocal].filter(isNotDeleted);
    if (combined.length === 0) {
      return INITIAL_DEMO_REPORTS.filter(isNotDeleted);
    }

    // Deduplicate by incident_id or id
    const seenIds = new Set();
    const uniqueReports = [];
    for (const rep of combined) {
      const key = rep.incident_id || rep.id;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        uniqueReports.push(rep);
      }
    }

    return uniqueReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  /**
   * Submit a new citizen waterlogging report
   */
  async createReport({
    incident_id,
    location_name,
    area_id,
    description,
    severity = 'HIGH',
    latitude,
    longitude,
    image_url = null,
    userId = null,
    userName = 'Citizen Report'
  }) {
    // Generate citizen-friendly Incident ID: e.g. WF-2026-00124
    const generatedId = incident_id || `WF-2026-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const newReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      incident_id: generatedId,
      user_name: userName || 'You (Citizen Report)',
      user_id: userId || null,
      area_id: area_id || null,
      location_name: location_name || 'Dibrugarh Locality',
      area_name: location_name || 'Dibrugarh Locality',
      severity: severity.toUpperCase(),
      description,
      latitude: Number(latitude),
      longitude: Number(longitude),
      image_url: image_url || null,
      status: 'Pending',
      assigned_team: null,
      priority: severity === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM',
      municipal_action: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null
    };

    // 1. Attempt insertion into Supabase
    try {
      const { data, error } = await supabase
        .from('user_reports')
        .insert({
          incident_id: newReport.incident_id,
          user_id: newReport.user_id,
          area_id: newReport.area_id,
          location_name: newReport.location_name,
          description: newReport.description,
          severity: newReport.severity,
          latitude: newReport.latitude,
          longitude: newReport.longitude,
          image_url: newReport.image_url,
          status: 'Pending',
          priority: newReport.priority
        })
        .select();

      if (!error && data && data.length > 0) {
        newReport.id = data[0].id;
      } else if (error) {
        console.warn('Supabase DB insert notice:', error.message);
      }
    } catch (dbErr) {
      console.warn('Supabase DB insert exception (running with local store):', dbErr);
    }

    // 2. Persist to localStorage for demo reliability
    const currentStored = getStoredLocalReports();
    currentStored.unshift(newReport);
    saveStoredLocalReports(currentStored);

    // 3. Track in user's personal submitted reports for Citizen "My Reports"
    try {
      const mySubmissions = JSON.parse(localStorage.getItem('my_submitted_report_ids') || '[]');
      mySubmissions.unshift(newReport.incident_id);
      mySubmissions.unshift(newReport.id);
      localStorage.setItem('my_submitted_report_ids', JSON.stringify(mySubmissions));
    } catch (e) {
      console.warn('Error saving to my_submitted_report_ids:', e);
    }

    return newReport;
  },

  /**
   * Update report status (Pending, Under Review, Dispatched, Resolved)
   */
  async updateReportStatus(reportId, newStatus) {
    const validStatuses = ['Pending', 'Under Review', 'Dispatched', 'Resolved'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    // Update in Supabase
    try {
      await supabase
        .from('user_reports')
        .update({ status: newStatus })
        .or(`id.eq.${reportId},incident_id.eq.${reportId}`);
    } catch (e) {
      console.warn('Supabase status update notice:', e);
    }

    // Update in localStorage cache
    const currentStored = getStoredLocalReports();
    const updated = currentStored.map(rep => {
      if (rep.id === reportId || rep.incident_id === reportId) {
        return { ...rep, status: newStatus };
      }
      return rep;
    });
    saveStoredLocalReports(updated);

    return { id: reportId, status: newStatus };
  },

  /**
   * Delete a waterlogging report by id or incident_id
   */
  async deleteReport(reportId) {
    if (!reportId) return false;

    const idStr = String(reportId);

    // 1. Delete from Supabase
    if (!isDemoMode) {
      try {
        await supabase
          .from('user_reports')
          .delete()
          .or(`id.eq.${idStr},incident_id.eq.${idStr}`);
      } catch (e) {
        console.warn('Supabase report delete notice:', e);
      }
    }

    // 2. Delete from localStorage cache
    const currentStored = getStoredLocalReports();
    const updated = currentStored.filter(
      rep => String(rep.id) !== idStr && String(rep.incident_id) !== idStr
    );
    saveStoredLocalReports(updated);

    // 3. Mark as deleted in localStorage to prevent demo data from resurrecting it
    const deletedKey = 'dibrugarh_deleted_report_ids';
    try {
      const deletedIds = JSON.parse(localStorage.getItem(deletedKey) || '[]');
      if (!deletedIds.includes(idStr)) {
        deletedIds.push(idStr);
        localStorage.setItem(deletedKey, JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn('LocalStorage error tracking deleted report:', e);
    }

    return true;
  },

  /**
   * Comprehensive Municipal Incident Action update
   * Updates status, municipal action, assigned response team, and priority
   */
  async updateMunicipalIncident(reportId, { status, municipal_action, assigned_team, priority }) {
    if (!reportId) throw new Error('Report ID required');

    const idStr = String(reportId);
    const nowIso = new Date().toISOString();
    const isResolved = status === 'Resolved' || status === 'RESOLVED';

    const updates = {
      status: status || 'Pending',
      updated_at: nowIso
    };

    if (municipal_action !== undefined) updates.municipal_action = municipal_action;
    if (assigned_team !== undefined) updates.assigned_team = assigned_team;
    if (priority !== undefined) updates.priority = priority;
    if (isResolved) updates.resolved_at = nowIso;

    // 1. Update in Supabase
    if (!isDemoMode) {
      try {
        await supabase
          .from('user_reports')
          .update(updates)
          .or(`id.eq.${idStr},incident_id.eq.${idStr}`);
      } catch (e) {
        console.warn('Supabase municipal incident update notice:', e);
      }
    }

    // 2. Update in localStorage cache
    const currentStored = getStoredLocalReports();
    let targetReport = null;
    const updatedList = currentStored.map(rep => {
      if (String(rep.id) === idStr || String(rep.incident_id) === idStr) {
        const merged = { ...rep, ...updates };
        targetReport = merged;
        return merged;
      }
      return rep;
    });

    if (targetReport) {
      saveStoredLocalReports(updatedList);
    } else {
      // If report was from demo data, persist this update
      const allReps = await this.getReports();
      const matched = allReps.find(r => String(r.id) === idStr || String(r.incident_id) === idStr);
      if (matched) {
        const updated = { ...matched, ...updates };
        currentStored.unshift(updated);
        saveStoredLocalReports(currentStored);
        targetReport = updated;
      }
    }

    return targetReport || { id: reportId, ...updates };
  },

  /**
   * Get Real-Time Municipal Incident Aggregated Statistics
   */
  async getMunicipalStats() {
    const allReports = await this.getReports();
    
    let total = allReports.length;
    let pending = 0;
    let underReview = 0;
    let dispatched = 0;
    let inProgress = 0;
    let resolved = 0;
    let critical = 0;

    for (const r of allReports) {
      const st = (r.status || 'Pending').toLowerCase();
      const sev = (r.severity || '').toUpperCase();

      if (st.includes('pending')) pending++;
      else if (st.includes('review')) underReview++;
      else if (st.includes('dispatch')) dispatched++;
      else if (st.includes('progress')) inProgress++;
      else if (st.includes('resolve')) resolved++;

      if (sev === 'CRITICAL' || r.priority === 'CRITICAL') critical++;
    }

    return {
      total,
      pending,
      underReview,
      dispatched,
      inProgress,
      resolved,
      critical
    };
  },

  /**
   * Get reports submitted by a specific citizen
   */
  async getCitizenReports(userId = null) {
    const allReports = await this.getReports();
    let mySubmissions = [];
    try {
      mySubmissions = JSON.parse(localStorage.getItem('my_submitted_report_ids') || '[]');
    } catch (e) {}

    // Match by user_id OR by submitted report IDs stored in local session
    return allReports.filter(r => {
      if (userId && (r.user_id === userId || r.user_id === String(userId))) return true;
      if (mySubmissions.includes(String(r.id)) || mySubmissions.includes(String(r.incident_id))) return true;
      // In demo mode for citizen role, also match 'You (Citizen Report)'
      if (r.user_name?.includes('You') || r.user_name?.includes('Citizen')) return true;
      return false;
    });
  }
};
