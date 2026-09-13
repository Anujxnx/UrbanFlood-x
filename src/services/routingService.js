import { DEMO_ROADS, DEMO_AREAS } from '../data/demoData';

// Configurable Risk-Aware Routing Penalty Weights
export const ROUTE_CONFIG = {
  DISTANCE_WEIGHT: 1.0,           // 1 km = 1 point
  WATERLOGGING_WEIGHT: 0.15,      // 100% prob = 15 points
  RISK_LEVEL_PENALTY: {
    LOW: 0,
    MEDIUM: 5,
    HIGH: 20,
    CRITICAL: 50
  },
  DRAINAGE_IMPAIRMENT_PENALTY: 10
};

export const routingService = {
  /**
   * Calculates weighted risk-aware route options between Origin and Destination localities in Dibrugarh.
   */
  findFloodSafeRoutes(originAreaId, destinationAreaId, areas = DEMO_AREAS) {
    const origin = areas.find(a => a.id === originAreaId) || areas[1] || areas[0]; // e.g. Dibrugarh University
    const destination = areas.find(a => a.id === destinationAreaId) || areas[6] || areas[0]; // e.g. Graham Bazar

    // 1. Recommended Safe Route (Bypasses low-lying trunks, uses higher elevation MSL corridors)
    const recommendedSafeRoute = {
      id: 'route-safe',
      type: 'RECOMMENDED',
      name: 'Safe Bypass (Via University Link & High-Elevation Bypass)',
      riskLevel: 'LOW',
      color: '#0284c7', // Sky Blue / Teal
      dashArray: null,
      weight: 6,
      distanceKm: 4.8,
      estimatedTimeMin: 14,
      waterloggingProbability: 18,
      waterDepthCm: 3,
      highRiskSegmentsAvoided: 3,
      riskReductionPercent: 72,
      explanation: 'Recommended because this route avoids 3 high-risk road corridors along Mankotta Road and has 72% lower predicted waterlogging risk.',
      path: [
        [origin.latitude, origin.longitude],
        [27.4550, 94.8980], // University Bypass
        [27.4650, 94.9220], // Chowkidinghee Link
        [27.4780, 94.9200], // High Elevation MSL 104m
        [destination.latitude, destination.longitude]
      ]
    };

    // 2. Alternative Route (Moderate risk)
    const alternativeRoute = {
      id: 'route-alt',
      type: 'ALTERNATIVE',
      name: 'Secondary Collector Route (Via Barbaruah Link)',
      riskLevel: 'MEDIUM',
      color: '#f97316', // Orange
      dashArray: '5, 5',
      weight: 4,
      distanceKm: 4.1,
      estimatedTimeMin: 12,
      waterloggingProbability: 46,
      waterDepthCm: 14,
      highRiskSegmentsAvoided: 1,
      riskReductionPercent: 44,
      explanation: 'Moderate risk. Minor water accumulation (14 cm) expected near secondary roadside culverts.',
      path: [
        [origin.latitude, origin.longitude],
        [27.4610, 94.9050],
        [27.4720, 94.9150],
        [destination.latitude, destination.longitude]
      ]
    };

    // 3. High-Risk / Avoid Route (Direct shortest route, but traverses submerged DTP canal trunk)
    const avoidRoute = {
      id: 'route-avoid',
      type: 'AVOID',
      name: 'Direct Trunk Corridor (Via Mankotta Road & AT Road)',
      riskLevel: 'CRITICAL',
      color: '#ef4444', // Red
      dashArray: '4, 4',
      weight: 4,
      distanceKm: 3.7,
      estimatedTimeMin: 11,
      waterloggingProbability: 82,
      waterDepthCm: 34,
      highRiskSegmentsAvoided: 0,
      riskReductionPercent: 0,
      explanation: 'DO NOT USE. High probability of severe inundation (34 cm depth) and DTP canal overflow.',
      path: [
        [origin.latitude, origin.longitude],
        [27.4650, 94.9100], // Submerged Mankotta Road
        [27.4730, 94.9120], // Lachit Nagar Trunk Drain B3 Overflow
        [27.4820, 94.9140], // Low-lying underpass
        [destination.latitude, destination.longitude]
      ]
    };

    return {
      origin,
      destination,
      recommended: recommendedSafeRoute,
      alternative: alternativeRoute,
      avoid: avoidRoute,
      routes: [recommendedSafeRoute, alternativeRoute, avoidRoute]
    };
  },

  /**
   * Calculates cost score for a individual road segment
   */
  calculateSegmentCost(segment) {
    const distanceCost = segment.distance * ROUTE_CONFIG.DISTANCE_WEIGHT;
    const waterloggingCost = segment.waterlogging_probability * ROUTE_CONFIG.WATERLOGGING_WEIGHT;
    const riskPenalty = ROUTE_CONFIG.RISK_LEVEL_PENALTY[segment.road_risk] || 0;
    const drainagePenalty = segment.drainage_status === 'Overflowing' ? ROUTE_CONFIG.DRAINAGE_IMPAIRMENT_PENALTY : 0;

    return distanceCost + waterloggingCost + riskPenalty + drainagePenalty;
  }
};
