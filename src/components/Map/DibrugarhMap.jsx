import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default Leaflet icon paths in Vite / React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create custom SVG Leaflet icons for Dibrugarh risk levels
const createRiskIcon = (riskLevel) => {
  let color = '#2A835F'; // LOW (Emerald)
  if (riskLevel === 'CRITICAL') color = '#ef4444';
  else if (riskLevel === 'HIGH') color = '#f97316';
  else if (riskLevel === 'MEDIUM') color = '#eab308';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="34" viewBox="0 0 24 24" fill="${color}" stroke="#092328" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="filter drop-shadow-md"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#ffffff"></circle></svg>`;
  return L.divIcon({
    className: 'custom-risk-marker',
    html: svg,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30]
  });
};

const createReportIcon = (severity) => {
  let color = '#ef4444'; // CRITICAL
  const sev = (severity || 'HIGH').toUpperCase();
  if (sev === 'LOW') color = '#2A835F';
  else if (sev === 'MODERATE' || sev === 'MEDIUM') color = '#eab308';
  else if (sev === 'HIGH') color = '#f97316';
  else if (sev === 'CRITICAL') color = '#ef4444';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="2.5" class="filter drop-shadow-md animate-pulse"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>`;
  return L.divIcon({
    className: 'custom-report-marker',
    html: svg,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

// Custom route origin/destination pin
const createRoutePinIcon = (label, isOrigin = true) => {
  const color = isOrigin ? '#2A835F' : '#12544F';
  const svg = `<div style="background:${color}; color:white; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:12px; border:2px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-family: sans-serif;">${label}</div>`;
  return L.divIcon({
    className: 'custom-route-pin',
    html: svg,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
};

// Component to dynamically re-center map when area changes
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

export const DibrugarhMap = ({
  areas = [],
  selectedArea,
  onSelectArea,
  activeLayers = {},
  roads = [],
  drainage = [],
  reports = [],
  activeRoutes = [],
  selectedRoute,
  onSelectReport
}) => {
  const dibrugarhCenter = [27.4728, 94.9120];
  const activeCenter = selectedArea
    ? [selectedArea.latitude, selectedArea.longitude]
    : dibrugarhCenter;

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      default: return '#2A835F';
    }
  };

  return (
    <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-brand-sage/30 shadow-md relative">
      <MapContainer
        center={dibrugarhCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ background: '#EAF2ED' }}
      >
        <MapRecenter center={activeCenter} />

        {/* OpenStreetMap Map Tiles (Free, no API key required) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* FLOOD-SAFE ROUTES LAYER (🔵 Recommended, 🟠 Alternative, 🔴 Avoid) */}
        {activeRoutes && activeRoutes.length > 0 && activeRoutes.map((route) => {
          const isSelected = selectedRoute ? selectedRoute.id === route.id : route.type === 'RECOMMENDED';
          return (
            <Polyline
              key={`route-${route.id}`}
              positions={route.path}
              pathOptions={{
                color: route.color,
                weight: isSelected ? 7 : 4,
                opacity: isSelected ? 0.95 : 0.5,
                dashArray: route.dashArray
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-sans font-bold">
                  <div>{route.name}</div>
                  <div style={{ color: route.color }}>
                    {route.type}: {route.distanceKm} km ({route.estimatedTimeMin} min) - Risk: {route.riskLevel} ({route.waterloggingProbability}%)
                  </div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Route Start and Destination Pins */}
        {selectedRoute && selectedRoute.path && selectedRoute.path.length > 0 && (
          <>
            <Marker
              position={selectedRoute.path[0]}
              icon={createRoutePinIcon('Start Location', true)}
            />
            <Marker
              position={selectedRoute.path[selectedRoute.path.length - 1]}
              icon={createRoutePinIcon('Destination', false)}
            />
          </>
        )}

        {/* LAYER 1: Risk Zones (Circles around Dibrugarh Localities) */}
        {activeLayers.risk && areas.map((area) => {
          const color = getRiskColor(area.risk_level);
          const isSelected = selectedArea?.id === area.id;

          return (
            <React.Fragment key={`risk-${area.id}`}>
              <Circle
                center={[area.latitude, area.longitude]}
                radius={isSelected ? 650 : 500}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.35 : 0.18,
                  weight: isSelected ? 3 : 1.5,
                  dashArray: isSelected ? '4, 4' : null
                }}
                eventHandlers={{
                  click: () => onSelectArea(area)
                }}
              >
                <Tooltip sticky direction="top">
                  <div className="text-xs font-bold font-sans">
                    <div>{area.name}</div>
                    <div style={{ color }}>{area.waterlogging_probability}% Waterlogging Risk ({area.risk_level})</div>
                  </div>
                </Tooltip>
              </Circle>

              <Marker
                position={[area.latitude, area.longitude]}
                icon={createRiskIcon(area.risk_level)}
                eventHandlers={{
                  click: () => onSelectArea(area)
                }}
              >
                <Popup>
                  <div className="p-1 text-slate-900 font-sans text-xs">
                    <div className="font-extrabold text-sm text-slate-900">{area.name}</div>
                    <div className="text-slate-600 font-medium">Dibrugarh, Assam</div>
                    <hr className="my-1.5 border-slate-200" />
                    <div className="font-bold text-slate-800">
                      Waterlogging Risk: <span style={{ color }}>{area.risk_level} ({area.waterlogging_probability}%)</span>
                    </div>
                    <div className="text-slate-600">Rainfall: {area.rainfall_mm} mm</div>
                    <button
                      onClick={() => onSelectArea(area)}
                      className="mt-2 w-full py-1 px-2 bg-brand-teal hover:bg-brand-teal/90 text-white rounded text-[11px] font-bold"
                    >
                      Select Locality
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* LAYER 2: Rainfall Overlay */}
        {activeLayers.rainfall && areas.map((area) => (
          <Circle
            key={`rain-${area.id}`}
            center={[area.latitude, area.longitude]}
            radius={area.rainfall_mm * 18}
            pathOptions={{
              color: '#38bdf8',
              fillColor: '#0284c7',
              fillOpacity: 0.12,
              weight: 1
            }}
          />
        ))}

        {/* LAYER 3: Drainage Network */}
        {activeLayers.drainage && drainage.map((drain) => (
          <Polyline
            key={`drain-${drain.id}`}
            positions={drain.coordinates}
            pathOptions={{
              color: drain.status === 'Overflowing' ? '#ef4444' : drain.status === 'Impaired' ? '#f97316' : '#2A835F',
              weight: 4,
              dashArray: drain.blockage_status === 'Severe' ? '6, 6' : null,
              opacity: 0.85
            }}
          >
            <Tooltip sticky>
              <span className="text-xs font-bold">{drain.name} | Status: {drain.status}</span>
            </Tooltip>
          </Polyline>
        ))}

        {/* LAYER 4: Crowdsourced User Reports */}
        {activeLayers.reports && reports.map((rep) => {
          const sev = (rep.severity || 'HIGH').toUpperCase();
          const sevColor = sev === 'CRITICAL' ? '#ef4444' : sev === 'HIGH' ? '#f97316' : sev === 'MODERATE' || sev === 'MEDIUM' ? '#eab308' : '#2A835F';
          const formattedDate = rep.created_at
            ? new Date(rep.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : 'Recent';

          return (
            <Marker
              key={`rep-${rep.incident_id || rep.id}`}
              position={[rep.latitude, rep.longitude]}
              icon={createReportIcon(rep.severity)}
            >
              <Popup>
                <div className="p-1 font-sans text-xs text-slate-900 min-w-[210px] max-w-[260px]">
                  <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1.5 mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-1.5 py-0.5 rounded">
                      {rep.incident_id || 'WF-INCIDENT'}
                    </span>
                    <span 
                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: sevColor }}
                    >
                      {sev}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900 mb-0.5">
                    📍 {rep.location_name || rep.area_name}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                    <span>Status: <strong className="text-slate-700">{rep.status || 'Pending'}</strong></span>
                    <span>{formattedDate}</span>
                  </div>

                  {rep.image_url && (
                    <div className="my-1.5 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                      <img
                        src={rep.image_url}
                        alt="Incident"
                        className="w-full h-24 object-cover"
                      />
                    </div>
                  )}

                  <p className="my-1 text-slate-700 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 leading-snug">
                    "{rep.description}"
                  </p>

                  {onSelectReport && (
                    <button
                      type="button"
                      onClick={() => onSelectReport(rep)}
                      className="w-full mt-2 py-1.5 bg-brand-teal hover:bg-brand-teal/90 text-white text-[11px] font-bold rounded-lg transition-colors text-center cursor-pointer shadow-xs"
                    >
                      View Report Details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 border border-brand-sage/30 p-2.5 rounded-xl backdrop-blur shadow-md text-xs text-brand-ink pointer-events-auto">
        <span className="font-bold text-[10px] uppercase tracking-wider text-brand-ink/60 block mb-1.5">
          Map Legend
        </span>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-[#0284c7] rounded"></span>
            <span>🔵 Safe Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-[#f97316] rounded"></span>
            <span>🟠 Alternative Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-[#ef4444] rounded"></span>
            <span>🔴 Avoid Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>🟢 Low Flood Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};
