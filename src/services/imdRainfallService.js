/**
 * Client-Side Service for India Meteorological Department (IMD) District-wise Rainfall Integration.
 * 
 * Fetches district rainfall from the server-side proxy endpoint (/api/imd/districtrainfall).
 * No API keys or tokens are stored or exposed on the client.
 * 
 * Identifier for Dibrugarh:
 *   - District: 'DIBRUGARH'
 *   - District Code: 310
 *   - State: 'ASSAM'
 */

// In-memory cache with 10-minute TTL
let cachedData = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

export const imdRainfallService = {
  /**
   * Fetches district rainfall data for Dibrugarh (or specified district).
   * Automatically handles cache, backend proxy request, and resilient fallbacks.
   */
  async getDistrictRainfall(district = 'DIBRUGARH', forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedData && (now - lastFetchTime < CACHE_TTL_MS)) {
      return cachedData;
    }

    try {
      const response = await fetch(`/api/imd/districtrainfall?district=${encodeURIComponent(district)}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result && result.data) {
        const payload = {
          ...result.data,
          isFallback: Boolean(result.isFallback),
          fallbackReason: result.fallbackReason || null,
          lastUpdated: result.timestamp || new Date().toISOString(),
          // Derived hydrologic factors
          severityLevel: this.getIMDSeverityCategory(result.data.daily_actual),
          riskMultiplier: this.getFloodRiskMultiplier(result.data)
        };

        cachedData = payload;
        lastFetchTime = now;
        return payload;
      }

      throw new Error('Malformed payload from IMD proxy');
    } catch (err) {
      console.warn('[imdRainfallService] Failed to load IMD data, using client resilience fallback:', err.message);

      // Graceful client fallback conforming strictly to IMD District Rainfall schema
      const fallback = {
        district: 'DIBRUGARH',
        district_code: 310,
        state: 'ASSAM',
        date: new Date().toISOString().split('T')[0],
        daily_actual: 54.0,
        daily_normal: 24.2,
        daily_departure_percentage: 123.1,
        daily_category: 'Large Excess',
        weekly_actual: 175.4,
        weekly_normal: 112.0,
        weekly_departure_percentage: 56.6,
        weekly_category: 'Excess',
        monthly_actual: 395.0,
        monthly_normal: 335.5,
        monthly_departure_percentage: 17.7,
        monthly_category: 'Normal',
        cumulative_actual: 1210.0,
        cumulative_normal: 1080.4,
        cumulative_departure_percentage: 12.0,
        cumulative_category: 'Normal',
        isFallback: true,
        fallbackReason: `Client network error: ${err.message}`,
        lastUpdated: new Date().toISOString(),
        severityLevel: 'Moderate to Heavy',
        riskMultiplier: 1.35
      };

      cachedData = fallback;
      lastFetchTime = now;
      return fallback;
    }
  },

  /**
   * Official IMD Rainfall Classification:
   *  - Very Light Rain: 0.1 to 2.4 mm
   *  - Light Rain: 2.5 to 15.5 mm
   *  - Moderate Rain: 15.6 to 64.4 mm
   *  - Heavy Rain: 64.5 to 115.5 mm
   *  - Very Heavy Rain: 115.6 to 204.4 mm
   *  - Extremely Heavy Rain: >= 204.5 mm
   */
  getIMDSeverityCategory(actualMm = 0) {
    const val = Number(actualMm);
    if (val <= 0) return 'No Rain';
    if (val < 2.5) return 'Very Light';
    if (val < 15.6) return 'Light';
    if (val < 64.5) return 'Moderate';
    if (val < 115.6) return 'Heavy';
    if (val < 204.5) return 'Very Heavy';
    return 'Extremely Heavy';
  },

  /**
   * Computes a dynamic flood-risk multiplier based on IMD daily actual and departure percentage.
   * Baseline = 1.0 (Normal conditions)
   */
  getFloodRiskMultiplier(data) {
    if (!data) return 1.0;
    const actual = Number(data.daily_actual || 0);
    const departure = Number(data.daily_departure_percentage || 0);

    let multiplier = 1.0;

    // Intensity scaling
    if (actual >= 115.6) {
      multiplier += 0.55; // Very heavy / extreme
    } else if (actual >= 64.5) {
      multiplier += 0.35; // Heavy
    } else if (actual >= 35.0) {
      multiplier += 0.20; // Moderate-high
    } else if (actual < 5.0) {
      multiplier -= 0.25; // Light/none
    }

    // Departure percentage scaling (e.g. Large Excess >= +60%)
    if (departure >= 60) {
      multiplier += 0.20;
    } else if (departure >= 20) {
      multiplier += 0.10;
    } else if (departure <= -60) {
      multiplier -= 0.15;
    }

    return Math.max(0.4, Math.min(2.0, multiplier));
  }
};
