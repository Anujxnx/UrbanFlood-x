/**
 * Modular Weather Service Architecture
 * 
 * Provides an extensible Provider Interface (IWeatherProvider) so that the IMD
 * integration can be swapped or augmented with other weather providers in the future.
 * 
 * Default Station: 42410 (Dibrugarh / Mohanbari Synoptic Station)
 */

export const DEFAULT_STATION_ID = '42410';

// ---------------------------------------------------------------------------
// 1. Provider Abstraction (Adapter Pattern)
// ---------------------------------------------------------------------------

export class BaseWeatherProvider {
  /**
   * Fetches current surface weather observation for a given station.
   * @param {string} stationId - WMO or national station code
   * @returns {Promise<WeatherObservation>}
   */
  async fetchCurrentWeather(stationId) {
    throw new Error('fetchCurrentWeather() must be implemented by subclass');
  }
}

/**
 * Official India Meteorological Department (IMD) Provider
 * Calls server-side proxy endpoint (/api/imd/current_wx) to ensure zero credential leakage.
 */
export class ImdWeatherProvider extends BaseWeatherProvider {
  constructor(apiBaseUrl = '/api/imd/current_wx') {
    super();
    this.apiBaseUrl = apiBaseUrl;
  }

  async fetchCurrentWeather(stationId = DEFAULT_STATION_ID) {
    const response = await fetch(`${this.apiBaseUrl}?station=${encodeURIComponent(stationId)}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`IMD Weather HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result || !result.data) {
      throw new Error('Malformed payload from IMD current weather proxy');
    }

    return {
      ...result.data,
      isFallback: Boolean(result.isFallback),
      fallbackReason: result.fallbackReason || null,
      provider: 'India Meteorological Department (IMD)',
      fetchedAt: result.timestamp || new Date().toISOString()
    };
  }
}

// ---------------------------------------------------------------------------
// 2. Weather Service Manager with In-Memory Caching & Analytics
// ---------------------------------------------------------------------------

class WeatherServiceManager {
  constructor(defaultProvider = new ImdWeatherProvider()) {
    this.provider = defaultProvider;
    this.cache = new Map(); // stationId -> { data, timestamp }
    this.cacheTtlMs = 5 * 60 * 1000; // 5 minutes TTL
  }

  /**
   * Modular hot-swap method: Replace the weather provider at runtime if needed.
   * @param {BaseWeatherProvider} newProvider 
   */
  setProvider(newProvider) {
    if (!(newProvider instanceof BaseWeatherProvider)) {
      console.warn('[WeatherService] Provider does not inherit from BaseWeatherProvider');
    }
    this.provider = newProvider;
    this.cache.clear();
  }

  /**
   * Get current weather observation for a station.
   * Uses caching with TTL and graceful fallback on errors.
   */
  async getCurrentWeather(stationId = DEFAULT_STATION_ID, forceRefresh = false) {
    const key = String(stationId).trim();
    const now = Date.now();

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (now - cached.timestamp < this.cacheTtlMs) {
        return cached.data;
      }
    }

    try {
      const observation = await this.provider.fetchCurrentWeather(key);
      
      const enriched = {
        ...observation,
        // Computed flood-risk factors
        riskMultiplier: this.getWeatherRiskMultiplier(observation),
        humidityLevel: observation.humidity >= 85 ? 'Saturated' : observation.humidity >= 65 ? 'Elevated' : 'Normal',
        windDescription: `${observation.wind_speed} km/h ${observation.wind_direction}`
      };

      this.cache.set(key, { data: enriched, timestamp: now });
      return enriched;
    } catch (err) {
      console.warn(`[WeatherService] Provider failed for station '${key}':`, err.message);

      // Client-side graceful fallback
      const fallback = {
        station_id: key,
        station_name: 'Dibrugarh (Mohanbari Airport)',
        observation_time: new Date().toISOString(),
        temperature: 28.4,
        humidity: 86.0,
        wind_speed: 14.5,
        wind_direction: 'ENE',
        weather_code: 'Thunderstorm with Moderate Rain',
        rainfall_24h: 58.4,
        source: 'IMD Telemetry (Client Fallback)',
        isFallback: true,
        fallbackReason: `Client fetch failure: ${err.message}`,
        provider: 'IMD (Fallback)',
        riskMultiplier: 1.25,
        humidityLevel: 'Saturated',
        windDescription: '14.5 km/h ENE'
      };

      this.cache.set(key, { data: fallback, timestamp: now });
      return fallback;
    }
  }

  /**
   * Evaluates surface weather factors for Urban Flood Nowcasting:
   * - High ambient humidity (>85%) indicates saturated air and reduced ground evaporation.
   * - Significant 24h antecedent rainfall primes urban catchment soils to 100% saturation.
   * - Convective weather code indicates active storm cell overhead.
   */
  getWeatherRiskMultiplier(data) {
    if (!data) return 1.0;
    let multiplier = 1.0;

    // 1. Antecedent 24-hour rainfall saturation
    const rain24 = Number(data.rainfall_24h || 0);
    if (rain24 >= 100) {
      multiplier += 0.35; // Extreme catchment saturation
    } else if (rain24 >= 50) {
      multiplier += 0.20; // High saturation
    } else if (rain24 >= 20) {
      multiplier += 0.10; // Moderate saturation
    }

    // 2. Relative Humidity (slows drainage evapotranspiration)
    const humidity = Number(data.humidity || 0);
    if (humidity >= 90) {
      multiplier += 0.10;
    } else if (humidity >= 80) {
      multiplier += 0.05;
    }

    // 3. Convective Storm Indicator
    const code = String(data.weather_code || '').toLowerCase();
    if (code.includes('thunder') || code.includes('squall') || code.includes('heavy')) {
      multiplier += 0.15;
    }

    return Math.max(0.7, Math.min(1.8, multiplier));
  }
}

export const weatherService = new WeatherServiceManager();
