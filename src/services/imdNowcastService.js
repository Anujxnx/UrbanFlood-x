/**
 * Modular Client-Side Service for IMD District-wise Nowcast API
 * 
 * Provides 3-hour localized convective nowcast bulletins including:
 *  - Rainfall Intensity Category (Light <5 mm/h, Moderate 5–15 mm/h, Heavy >15 mm/h)
 *  - Thunderstorm and Lightning Warnings
 *  - Color-coded severity (Red, Orange, Yellow, Green)
 *  - Issue time and validity window
 * 
 * District Identifier: 310 (Dibrugarh, Assam)
 */

export const DEFAULT_NOWCAST_DISTRICT_ID = '310';

let cachedNowcast = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute cache

export const imdNowcastService = {
  /**
   * Fetches the active 3-hour district nowcast for Dibrugarh (or specified district ID)
   */
  async getDistrictNowcast(districtId = DEFAULT_NOWCAST_DISTRICT_ID, forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedNowcast && (now - lastFetchTime < CACHE_TTL_MS)) {
      return cachedNowcast;
    }

    try {
      const response = await fetch(`/api/imd/districtnowcast?id=${encodeURIComponent(districtId)}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result && result.data) {
        const enriched = {
          ...result.data,
          isFallback: Boolean(result.isFallback),
          fallbackReason: result.fallbackReason || null,
          riskMultiplier: this.getNowcastRiskMultiplier(result.data),
          isActive: new Date(result.data.valid_until) > new Date(),
          formattedValidity: this.formatValidityWindow(result.data),
          provider: 'India Meteorological Department (IMD Nowcast)'
        };

        cachedNowcast = enriched;
        lastFetchTime = now;
        return enriched;
      }

      throw new Error('Malformed payload from IMD nowcast proxy');
    } catch (err) {
      console.warn('[imdNowcastService] Failed to fetch nowcast from proxy, using client fallback:', err.message);

      const validUntil = new Date(Date.now() + 3 * 3600 * 1000);
      const fallback = {
        district_id: String(districtId),
        district_name: 'Dibrugarh',
        state_name: 'Assam',
        warning_severity: 'Orange',
        severity_color: '#f97316',
        rainfall_intensity_category: 'Moderate rain: 5–15 mm/hr',
        rainfall_rate_mm_hr: 12.5,
        thunderstorm_warning: true,
        lightning_warning: true,
        warning_message: 'Moderate to Heavy spells of rain (5–15 mm/hr) accompanied with thunderstorm and gusty surface winds likely over Dibrugarh during next 3 hours.',
        issue_time: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        validity_hours: 3,
        isFallback: true,
        fallbackReason: `Client fetch fallback: ${err.message}`,
        riskMultiplier: 1.25,
        isActive: true,
        formattedValidity: 'Next 3 hrs',
        provider: 'IMD Nowcast (Fallback)'
      };

      cachedNowcast = fallback;
      lastFetchTime = now;
      return fallback;
    }
  },

  /**
   * Computes nowcast flood-risk weighting based on immediate rainfall rate and thunderstorm activity
   */
  getNowcastRiskMultiplier(data) {
    if (!data) return 1.0;
    let multiplier = 1.0;

    const rate = Number(data.rainfall_rate_mm_hr || 0);
    const category = String(data.rainfall_intensity_category || '').toLowerCase();
    const severity = String(data.warning_severity || '').toUpperCase();

    // 1. Rainfall Intensity Classification
    if (rate > 15.0 || category.includes('heavy') || severity === 'RED') {
      multiplier += 0.35; // Severe convective downpour
    } else if (rate >= 5.0 || category.includes('moderate') || severity === 'ORANGE') {
      multiplier += 0.20; // Moderate convective rain
    } else if (category.includes('light') || severity === 'YELLOW') {
      multiplier += 0.05;
    }

    // 2. Thunderstorm & Lightning convective cells
    if (data.thunderstorm_warning || data.lightning_warning) {
      multiplier += 0.10;
    }

    return Math.max(0.8, Math.min(1.7, multiplier));
  },

  /**
   * Human-readable validity window
   */
  formatValidityWindow(data) {
    if (!data || !data.valid_until) return 'Next 3 hrs';
    try {
      const until = new Date(data.valid_until);
      const hours = until.getHours().toString().padStart(2, '0');
      const mins = until.getMinutes().toString().padStart(2, '0');
      return `Valid until ${hours}:${mins} IST`;
    } catch {
      return 'Next 3 hrs';
    }
  }
};
