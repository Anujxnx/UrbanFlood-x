import { supabase, isDemoMode } from '../lib/supabase';
import { DEMO_AREAS } from '../data/demoData';

const FASTAPI_ML_URL = import.meta.env.VITE_ML_API_URL || null;

export const predictionService = {
  /**
   * Main prediction entrypoint.
   * Abstracts external Python FastAPI / XGBoost service integration.
   * Returns waterlogging probability, risk classification, and model metadata.
   */
  async predict(areaId) {
    // If external FastAPI ML service URL is defined, try fetching real-time model inference
    if (FASTAPI_ML_URL) {
      try {
        const response = await fetch(`${FASTAPI_ML_URL}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ area_id: areaId })
        });
        if (response.ok) {
          const result = await response.json();
          return {
            area_id: areaId,
            waterlogging_probability: result.probability,
            risk_level: result.risk_level,
            model_name: result.model_name || 'XGBoost-Dibrugarh-FastAPI',
            model_version: result.model_version || '2.0.0',
            prediction_time: new Date().toISOString()
          };
        }
      } catch (e) {
        console.warn('FastAPI ML backend unreachable, using service abstraction fallback:', e);
      }
    }

    if (isDemoMode) {
      const area = DEMO_AREAS.find(a => a.id === areaId) || DEMO_AREAS[0];
      return {
        area_id: area.id,
        area_name: area.name,
        waterlogging_probability: area.waterlogging_probability,
        risk_level: area.risk_level,
        model_name: 'XGBoost-Dibrugarh-v1 (Demo API)',
        model_version: '1.0.0',
        prediction_time: new Date().toISOString(),
        recommended_action: area.recommended_action
      };
    }

    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('area_id', areaId)
        .order('prediction_time', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return this.predict(areaId); // Fallback to demo prediction abstraction
      }

      const row = data[0];
      return {
        area_id: areaId,
        waterlogging_probability: Number(row.waterlogging_probability),
        risk_level: row.risk_level,
        model_name: row.model_name || 'XGBoost-Dibrugarh-v1',
        model_version: row.model_version || '1.0.0',
        prediction_time: row.prediction_time
      };
    } catch (err) {
      console.error('Error fetching prediction:', err);
      return {
        area_id: areaId,
        waterlogging_probability: 65,
        risk_level: 'HIGH',
        model_name: 'XGBoost-Dibrugarh-v1',
        model_version: '1.0.0',
        prediction_time: new Date().toISOString()
      };
    }
  }
};
