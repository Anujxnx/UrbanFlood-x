import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Navigation, 
  ArrowRightLeft, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Info,
  RotateCw,
  LocateFixed,
  Search,
  Sparkles,
  Zap,
  X
} from 'lucide-react';
import { DibrugarhMap } from '../components/Map/DibrugarhMap';
import { routingService } from '../services/routingService';

export const FloodSafeRoutePage = ({ areas = [], roads = [], drainage = [], reports = [] }) => {
  const [originId, setOriginId] = useState(areas[1]?.id || areas[0]?.id || ''); // Dibrugarh University
  const [destinationId, setDestinationId] = useState(areas[6]?.id || areas[0]?.id || ''); // Graham Bazar

  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');

  const [isLocating, setIsLocating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isRerouteAlertVisible, setIsRerouteAlertVisible] = useState(true);

  // Filtered dropdown suggestions
  const originSuggestions = areas.filter(a => a.name.toLowerCase().includes(originQuery.toLowerCase()));
  const destSuggestions = areas.filter(a => a.name.toLowerCase().includes(destQuery.toLowerCase()));

  const originAreaObj = areas.find(a => a.id === originId) || areas[1] || areas[0];
  const destAreaObj = areas.find(a => a.id === destinationId) || areas[6] || areas[0];

  useEffect(() => {
    if (originAreaObj) setOriginQuery(originAreaObj.name);
    if (destAreaObj) setDestQuery(destAreaObj.name);
  }, [originId, destinationId]);

  // Handle Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        // Find nearest Dibrugarh area in list
        if (areas.length > 0) {
          setOriginId(areas[0].id);
          setOriginQuery(areas[0].name);
        }
      },
      (error) => {
        setIsLocating(false);
        console.error('Geolocation error:', error);
        alert('Unable to fetch location. Using selected Dibrugarh start location.');
      }
    );
  };

  const handleSwap = () => {
    const tempId = originId;
    const tempQuery = originQuery;
    setOriginId(destinationId);
    setOriginQuery(destQuery);
    setDestinationId(tempId);
    setDestQuery(tempQuery);
  };

  const handleFindSaferRoute = (e) => {
    if (e) e.preventDefault();
    const result = routingService.findFloodSafeRoutes(originId, destinationId, areas);
    setRouteResult(result);
    setSelectedRoute(result.recommended);
    setIsCalculated(true);
  };

  // Run initial calculation when mounted so page opens with a clean initial calculation state
  useEffect(() => {
    if (areas.length > 0 && !isCalculated) {
      handleFindSaferRoute();
    }
  }, [areas]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* 1. TOP PROMINENT ROUTE-PLANNING CARD */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-brand-sage/25 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-teal/10 rounded-2xl text-brand-teal">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-brand-ink tracking-tight">Flood-Safe Route Planner</h2>
              <p className="text-[11px] text-brand-ink/60 font-medium">AI Risk-Aware Navigation for Citizens</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
            Citizen Mode
          </span>
        </div>

        <form onSubmit={handleFindSaferRoute} className="space-y-3">
          {/* Start Location Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">
                📍 Current Location (Start)
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="text-[11px] font-semibold text-brand-teal hover:underline flex items-center gap-1"
              >
                <LocateFixed className="w-3 h-3 text-brand-emerald" />
                <span>{isLocating ? 'Locating...' : 'Use my location'}</span>
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-brand-emerald absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={originId}
                onChange={(e) => {
                  setOriginId(e.target.value);
                  const selected = areas.find(a => a.id === e.target.value);
                  if (selected) setOriginQuery(selected.name);
                }}
                className="w-full pl-9 pr-4 py-3 bg-[#F6FAF8] border border-brand-sage/30 rounded-xl text-xs font-semibold text-brand-ink focus:outline-none focus:border-brand-teal"
              >
                {areas.map((a) => (
                  <option key={`start-${a.id}`} value={a.id}>
                    {a.name} ({a.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-full bg-white border border-brand-sage/40 text-brand-ink/60 hover:text-brand-teal hover:border-brand-teal shadow-sm transition-all hover:scale-105"
              title="Swap Start & Destination"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
            </button>
          </div>

          {/* Destination Input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/60 mb-1">
              🏁 Final Destination
            </label>
            <div className="relative">
              <Navigation className="w-4 h-4 text-brand-teal absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={destinationId}
                onChange={(e) => {
                  setDestinationId(e.target.value);
                  const selected = areas.find(a => a.id === e.target.value);
                  if (selected) setDestQuery(selected.name);
                }}
                className="w-full pl-9 pr-4 py-3 bg-[#F6FAF8] border border-brand-sage/30 rounded-xl text-xs font-semibold text-brand-ink focus:outline-none focus:border-brand-teal"
              >
                {areas.map((a) => (
                  <option key={`dest-${a.id}`} value={a.id}>
                    {a.name} ({a.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-brand-teal hover:bg-brand-teal/95 active:scale-[0.99] text-white font-bold text-xs tracking-wide rounded-2xl shadow-sm shadow-brand-teal/20 flex items-center justify-center gap-2 transition-all mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Find Safer Route</span>
          </button>
        </form>
      </section>

      {/* 2. DYNAMIC REROUTING ALERT BANNER */}
      {isRerouteAlertVisible && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block">
                  ⚠️ Route Risk Increased
                </span>
                <p className="text-xs text-brand-ink/80 font-medium leading-relaxed mt-0.5">
                  Waterlogging is predicted on your current route (Assam Trunk Road corridor).
                </p>
              </div>
            </div>
            <button
              onClick={handleFindSaferRoute}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Find Safer Alternative</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAP CONTAINER WITH ROUTE OVERLAY */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-brand-sage/25 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-brand-ink tracking-tight">Interactive Route Map</h3>
            <p className="text-[11px] text-brand-ink/50">
              Showing origin, destination, safe bypass, and high-risk avoid segments
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-teal bg-[#E8F3ED] px-2.5 py-0.5 rounded-full">
            Live Geospatial
          </span>
        </div>

        <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-brand-sage/30 shadow-inner">
          <DibrugarhMap
            areas={areas}
            selectedArea={originAreaObj}
            onSelectArea={() => {}}
            activeLayers={{ risk: true, rainfall: true, drainage: true, reports: true }}
            roads={roads}
            drainage={drainage}
            reports={reports}
            activeRoutes={routeResult?.routes || []}
            selectedRoute={selectedRoute || routeResult?.recommended}
          />

          {/* Active Route Pill Badge */}
          {selectedRoute && (
            <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-brand-sage/30 shadow-md flex items-center gap-2 text-xs font-bold text-brand-ink">
              <span className={`w-2.5 h-2.5 rounded-full ${
                selectedRoute.type === 'RECOMMENDED' ? 'bg-emerald-500' :
                selectedRoute.type === 'ALTERNATIVE' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span>{selectedRoute.name} ({selectedRoute.distanceKm} km)</span>
            </div>
          )}
        </div>
      </section>

      {/* 4. WHY THIS ROUTE EXPLANATION BOX */}
      {routeResult?.recommended && (
        <section className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-brand-emerald/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-emerald/15 rounded-xl text-brand-emerald shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-emerald block">
                Why This Route?
              </h4>
              <p className="text-xs text-brand-ink font-medium leading-relaxed mt-1">
                "{routeResult.recommended.explanation}"
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 5. ROUTE COMPARISON RESULTS PANEL */}
      {routeResult && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-ink/60">
              Evaluated Route Options ({routeResult.routes.length})
            </h3>
            <span className="text-[10px] text-brand-ink/40 font-medium">
              Weighted Safety Cost Algorithm Active
            </span>
          </div>

          {routeResult.routes.map((route) => {
            const isSelected = selectedRoute?.id === route.id;
            const isSafe = route.type === 'RECOMMENDED';
            const isAlt = route.type === 'ALTERNATIVE';
            const isAvoid = route.type === 'AVOID';

            return (
              <div
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-brand-teal ring-2 ring-brand-teal/20 shadow-md'
                    : 'border-brand-sage/25 hover:border-brand-teal/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isSafe ? 'bg-emerald-500' : isAlt ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <h4 className="text-xs font-bold text-brand-ink">{route.name}</h4>
                    </div>
                    <p className="text-[11px] text-brand-ink/60 font-medium ml-4 mt-0.5">
                      {route.distanceKm} km · {route.estimatedTimeMin} min
                    </p>
                  </div>

                  {/* Flood Risk Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    isSafe ? 'bg-emerald-50 text-brand-emerald border-brand-emerald/30' :
                    isAlt ? 'bg-amber-50 text-amber-700 border-amber-300' :
                    'bg-red-50 text-red-700 border-red-300'
                  }`}>
                    {isSafe ? '🟢 Low Flood Risk' : isAlt ? '🟡 Moderate Flood Risk' : '🔴 Critical Flood Risk'}
                  </span>
                </div>

                {/* Telemetry Breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-brand-sage/15 text-[11px]">
                  <div className="flex justify-between items-center text-brand-ink/70">
                    <span>Waterlogging prob:</span>
                    <span className={`font-bold ${isSafe ? 'text-brand-emerald' : isAlt ? 'text-amber-700' : 'text-red-600'}`}>
                      {route.waterloggingProbability}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-brand-ink/70">
                    <span>Road risk:</span>
                    <span className="font-semibold text-brand-ink capitalize">
                      {route.riskLevel.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                {isSelected ? (
                  <div className="mt-3 w-full py-2 px-3 bg-brand-teal text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSafe ? 'Safest Route Selected' : 'Route Selected'}</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoute(route);
                    }}
                    className="mt-3 w-full py-2 px-3 bg-[#F6FAF8] hover:bg-brand-teal/10 text-brand-teal border border-brand-sage/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Select This Route</span>
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

    </div>
  );
};
