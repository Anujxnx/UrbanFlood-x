// Rich Demo & Prototype Dataset for Dibrugarh, Assam, India
// Used for offline presentation & fallback when Supabase is not configured.

export const DEMO_AREAS = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    name: 'Lachit Nagar',
    district: 'Dibrugarh',
    state: 'Assam',
    latitude: 27.4728,
    longitude: 94.9120,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [94.9070, 27.4760],
        [94.9170, 27.4760],
        [94.9170, 27.4690],
        [94.9070, 27.4690],
        [94.9070, 27.4760]
      ]]
    },
    risk_level: 'HIGH',
    waterlogging_probability: 78,
    rainfall_mm: 42,
    elevation: 99.2,
    slope: 0.45,
    flow_accumulation: 1250.4,
    drainage_risk: 'HIGH',
    road_risk: 'MEDIUM',
    recommended_action: 'Prioritize municipal pump deployment and clearance of trunk drain B3.',
    hourly_forecast: [
      { hour: '0-1 hr', rainfall_mm: 15, probability: 72 },
      { hour: '1-2 hr', rainfall_mm: 18, probability: 78 },
      { hour: '2-3 hr', rainfall_mm: 9, probability: 64 }
    ]
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    name: 'Dibrugarh University',
    district: 'Dibrugarh',
    state: 'Assam',
    latitude: 27.4479,
    longitude: 94.8911,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [94.8850, 27.4520],
        [94.8970, 27.4520],
        [94.8970, 27.4430],
        [94.8850, 27.4430],
        [94.8850, 27.4520]
      ]]
    },
    risk_level: 'LOW',
    waterlogging_probability: 22,
    rainfall_mm: 18,
    elevation: 104.5,
    slope: 1.20,
    flow_accumulation: 420.1,
    drainage_risk: 'LOW',
    road_risk: 'LOW',
    recommended_action: 'Normal drainage capacity. Continue routine monitoring.',
    hourly_forecast: [
      { hour: '0-1 hr', rainfall_mm: 6, probability: 18 },
      { hour: '1-2 hr', rainfall_mm: 8, probability: 22 },
      { hour: '2-3 hr', rainfall_mm: 4, probability: 15 }
    ]
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    name: 'Dibrugarh West',
    district: 'Dibrugarh',
    state: 'Assam',
    latitude: 27.4812,
    longitude: 94.8985,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [94.8920, 27.4860],
        [94.9040, 27.4860],
        [94.9040, 27.4760],
        [94.8920, 27.4760],
        [94.8920, 27.4860]
      ]]
    },
    risk_level: 'HIGH',
    waterlogging_probability: 68,
    rainfall_mm: 36,
    elevation: 98.8,
    slope: 0.30,
    flow_accumulation: 1890.6,
    drainage_risk: 'HIGH',
    road_risk: 'HIGH',
    recommended_action: 'Alert traffic control regarding low-elevation underpass water accumulation.',
    hourly_forecast: [
      { hour: '0-1 hr', rainfall_mm: 12, probability: 60 },
      { hour: '1-2 hr', rainfall_mm: 16, probability: 68 },
      { hour: '2-3 hr', rainfall_mm: 8, probability: 55 }
    ]
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    name: 'Barbaruah Chuk',
    district: 'Dibrugarh',
    state: 'Assam',
    latitude: 27.4350,
    longitude: 94.8520,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [94.8450, 27.4400],
        [94.8590, 27.4400],
        [94.8590, 27.4300],
        [94.8450, 27.4300],
        [94.8450, 27.4400]
      ]]
    },
    risk_level: 'MEDIUM',
    waterlogging_probability: 54,
    rainfall_mm: 31,
    elevation: 101.1,
    slope: 0.80,
    flow_accumulation: 850.3,
    drainage_risk: 'MEDIUM',
    road_risk: 'LOW',
    recommended_action: 'Inspect secondary roadside culverts for debris blockage.',
    hourly_forecast: [
      { hour: '0-1 hr', rainfall_mm: 10, probability: 48 },
      { hour: '1-2 hr', rainfall_mm: 13, probability: 54 },
      { hour: '2-3 hr', rainfall_mm: 8, probability: 42 }
    ]
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    name: 'Panitola',
    district: 'Dibrugarh',
    state: 'Assam',
    latitude: 27.4610,
    longitude: 95.0320,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [95.0240, 27.4670],
        [95.0390, 27.4670],
        [95.0390, 27.4550],
        [95.0240, 27.4550],
        [95.0240, 27.4670]
      ]]
    },
    risk_level: 'LOW',
    waterlogging_probability: 15,
    rainfall_mm: 12,
    elevation: 106.3,
    slope: 1.50,
    flow_accumulation: 210.0,
    drainage_risk: 'LOW',
    road_risk: 'LOW',
    recommended_action: 'Clear conditions. No immediate intervention required.',
    hourly_forecast: [
      { hour: '0-1 hr', rainfall_mm: 4, probability: 12 },
      { hour: '1-2 hr', rainfall_mm: 5, probability: 15 },
      { hour: '2-3 hr', rainfall_mm: 3, probability: 10 }
    ]
  },
  {
    id: 'a6666666-6666-6666-6666-666666666666',
    name: 'Chowkidinghee',
    district: 'Dibrugarh',
    state: 'Assam',
    latitude: 27.4795,
    longitude: 94.9180,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [94.9130, 27.4840],
        [94.9230, 27.4840],
        [94.9230, 27.4750],
        [94.9130, 27.4750],
        [94.9130, 27.4840]
      ]]
    },
    risk_level: 'MEDIUM',
    waterlogging_probability: 48,
    rainfall_mm: 28,
    elevation: 100.1,
    slope: 0.50,
    flow_accumulation: 940.2,
    drainage_risk: 'MEDIUM',
    road_risk: 'MEDIUM',
    recommended_action: 'Monitor roundabout drainage outlet during peak rainfall hours.',
    hourly_forecast: [
      { hour: '0-1 hr', rainfall_mm: 9, probability: 42 },
      { hour: '1-2 hr', rainfall_mm: 12, probability: 48 },
      { hour: '2-3 hr', rainfall_mm: 7, probability: 38 }
    ]
  },
  {
    id: 'a7777777-7777-7777-7777-777777777777',
    name: 'Graham Bazar',
    district: 'Dibrugarh',
    state: 'Assam',
    latitude: 27.4880,
    longitude: 94.9075,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [94.9010, 27.4930],
        [94.9130, 27.4930],
        [94.9130, 27.4830],
        [94.9010, 27.4830],
        [94.9010, 27.4930]
      ]]
    },
    risk_level: 'CRITICAL',
    waterlogging_probability: 89,
    rainfall_mm: 48,
    elevation: 97.9,
    slope: 0.20,
    flow_accumulation: 2150.8,
    drainage_risk: 'CRITICAL',
    road_risk: 'CRITICAL',
    recommended_action: 'IMMEDIATE ACTION: Dispatch emergency drainage clearance squad and close low-lying market access road.',
    hourly_forecast: [
      { hour: '0-1 hr', rainfall_mm: 18, probability: 85 },
      { hour: '1-2 hr', rainfall_mm: 21, probability: 89 },
      { hour: '2-3 hr', rainfall_mm: 9, probability: 75 }
    ]
  }
];

export const DEMO_ROADS = [
  {
    id: 'r1',
    name: 'AT Road (NH-37 Segment)',
    road_type: 'Arterial',
    importance: 'High',
    risk_level: 'HIGH',
    coordinates: [
      [27.4720, 94.9050],
      [27.4750, 94.9150],
      [27.4790, 94.9250]
    ]
  },
  {
    id: 'r2',
    name: 'Mankotta Road',
    road_type: 'Collector',
    importance: 'High',
    risk_level: 'CRITICAL',
    coordinates: [
      [27.4650, 94.9100],
      [27.4730, 94.9120],
      [27.4820, 94.9140]
    ]
  },
  {
    id: 'r3',
    name: 'University Link Road',
    road_type: 'Residential',
    importance: 'Medium',
    risk_level: 'LOW',
    coordinates: [
      [27.4450, 94.8880],
      [27.4490, 94.8930],
      [27.4530, 94.8980]
    ]
  },
  {
    id: 'r4',
    name: 'Graham Bazar Main Street',
    road_type: 'Commercial',
    importance: 'High',
    risk_level: 'CRITICAL',
    coordinates: [
      [27.4850, 94.9030],
      [27.4880, 94.9080],
      [27.4910, 94.9120]
    ]
  }
];

export const DEMO_DRAINAGE = [
  {
    id: 'd1',
    name: 'Dibrugarh Town Protection Drain (DTP Canal)',
    drain_type: 'Primary Canal',
    capacity: 45.0,
    status: 'Impaired',
    blockage_status: 'Severe',
    coordinates: [
      [27.4700, 94.9000],
      [27.4760, 94.9110],
      [27.4850, 94.9200]
    ]
  },
  {
    id: 'd2',
    name: 'Lachit Nagar Secondary Outlet B3',
    drain_type: 'Storm Drain',
    capacity: 12.5,
    status: 'Overflowing',
    blockage_status: 'Partial',
    coordinates: [
      [27.4710, 94.9100],
      [27.4740, 94.9140]
    ]
  },
  {
    id: 'd3',
    name: 'University South Relief Sluice',
    drain_type: 'Secondary Drain',
    capacity: 28.0,
    status: 'Operational',
    blockage_status: 'None',
    coordinates: [
      [27.4420, 94.8860],
      [27.4480, 94.8940]
    ]
  }
];

export const DEMO_ALERTS = [
  {
    id: 'alt-1',
    area_name: 'Graham Bazar',
    severity: 'CRITICAL',
    message: 'Severe waterlogging (89% risk) expected within 60 mins due to high rainfall intensity and DTP canal impairment.',
    created_at: new Date().toISOString()
  },
  {
    id: 'alt-2',
    area_name: 'Lachit Nagar',
    severity: 'HIGH',
    message: 'Waterlogging probability exceeds 78%. Pump deployment alert activated for Municipal Ward 7.',
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'alt-3',
    area_name: 'Dibrugarh West',
    severity: 'HIGH',
    message: 'Runoff accumulation along Mankotta road corridor. Slow vehicular movement advised.',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

export const DEMO_REPORTS = [
  {
    id: 'rep-1',
    user_name: 'Animesh Gogoi',
    area_name: 'Lachit Nagar',
    severity: 'HIGH',
    description: 'Water accumulation of approx 1.5 ft near Lachit Nagar Girls High School street.',
    latitude: 27.4735,
    longitude: 94.9125,
    status: 'Verified',
    created_at: new Date(Date.now() - 2500000).toISOString()
  },
  {
    id: 'rep-2',
    user_name: 'Priyanka Saikia',
    area_name: 'Graham Bazar',
    severity: 'CRITICAL',
    description: 'Market road submerged completely. Drains backflowing into ground floor shops.',
    latitude: 27.4885,
    longitude: 94.9080,
    status: 'Pending',
    created_at: new Date(Date.now() - 1200000).toISOString()
  }
];
