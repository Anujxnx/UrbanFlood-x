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
  Zap,
  RotateCw
} from 'lucide-react';
import { routingService } from '../../services/routingService';

export const FloodSafeRoutePlanner = ({ 
  areas = [], 
  onRoutesCalculated, 
  onSelectRoute, 
  activeRouteId 
}) => {
  const [originId, setOriginId] = useState(areas[1]?.id || areas[0]?.id || ''); // Dibrugarh University default
  const [destinationId, setDestinationId] = useState(areas[6]?.id || areas[0]?.id || ''); // Graham Bazar default
  const [routeResult, setRouteResult] = useState(null);
  const [isReroutingAlertActive, setIsReroutingAlertActive] = useState(true);

  // Calculate routes whenever origin or destination changes
  const handleFindRoute = () => {
    const result = routingService.findFloodSafeRoutes(originId, destinationId, areas);
    setRouteResult(result);
    if (onRoutesCalculated) {
      onRoutesCalculated(result);
    }
    if (onSelectRoute) {
      onSelectRoute(result.recommended);
    }
  };

  useEffect(() => {
    if (areas.length > 0) {
      handleFindRoute();
    }
  }, [areas, originId, destinationId]);

  const handleSwap = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
  };

  const activeSelectedRoute = routeResult?.routes.find(r => r.id === activeRouteId) || routeResult?.recommended;

  return (
    <div className="space-y-4">
      {/* 1. Dynamic Rerouting Alert Banner */}
      {isReroutingAlertActive && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-amber-500/20 rounded-xl text-amber-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                  ⚠️ Route Risk Increased
                </span>
                <p className="text-xs text-brand-ink/80 font-medium leading-relaxed mt-0.5">
                  Waterlogging is predicted on Assam Trunk Road. A safer alternative route has been found.
                </p>
              </div>
            </div>
            <button
              onClick={handleFindRoute}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Reroute</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Citizen Route Planner Form */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-brand-sage/25 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-teal/10 rounded-xl text-brand-teal">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-ink tracking-tight">Flood-Safe Route Planner</h3>
              <p className="text-[11px] text-brand-ink/50">AI Risk-Aware Navigation for Citizens</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
            Citizen Mode
          </span>
        </div>

        {/* Origin & Destination Inputs */}
        <div className="space-y-2.5 relative">
          {/* Origin Picker */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-ink/50 mb-1">
              Current Location (Start)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-brand-emerald absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#F6FAF8] border border-brand-sage/30 rounded-xl text-xs font-medium text-brand-ink focus:outline-none focus:border-brand-teal"
              >
                {areas.map(a => (
                  <option key={`org-${a.id}`} value={a.id}>
                    {a.name} ({a.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwap}
              className="p-1.5 rounded-full bg-white border border-brand-sage/40 text-brand-ink/60 hover:text-brand-teal hover:border-brand-teal shadow-xs transition-all"
              title="Swap Start and Destination"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
            </button>
          </div>

          {/* Destination Picker */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-ink/50 mb-1">
              Destination
            </label>
            <div className="relative">
              <Navigation className="w-4 h-4 text-brand-teal absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#F6FAF8] border border-brand-sage/30 rounded-xl text-xs font-medium text-brand-ink focus:outline-none focus:border-brand-teal"
              >
                {areas.map(a => (
                  <option key={`dest-${a.id}`} value={a.id}>
                    {a.name} ({a.district})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Find Safer Route Button */}
        <button
          onClick={handleFindRoute}
          className="w-full py-3 px-4 bg-brand-teal hover:bg-brand-teal/95 active:scale-[0.99] text-white font-bold text-xs tracking-wide rounded-2xl shadow-sm shadow-brand-teal/20 flex items-center justify-center gap-2 transition-all"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Find Safer Route</span>
        </button>
      </div>

      {/* 3. Safety Explanation Box ("Why this route is safer") */}
      {routeResult?.recommended && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-brand-emerald/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-brand-emerald/15 rounded-xl text-brand-emerald shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-emerald block">
                Why This Route Is Recommended
              </span>
              <p className="text-xs text-brand-ink font-medium leading-relaxed mt-1">
                {routeResult.recommended.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Route Comparison Cards */}
      {routeResult && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-ink/60 px-1">
            Available Route Options ({routeResult.routes.length})
          </h4>

          {routeResult.routes.map((route) => {
            const isSelected = activeSelectedRoute?.id === route.id;
            const isSafe = route.type === 'RECOMMENDED';
            const isAlt = route.type === 'ALTERNATIVE';
            const isAvoid = route.type === 'AVOID';

            return (
              <div
                key={route.id}
                onClick={() => onSelectRoute && onSelectRoute(route)}
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
                      <h5 className="text-xs font-bold text-brand-ink">{route.name}</h5>
                    </div>
                    <span className="text-[10px] text-brand-ink/50 font-medium ml-4">
                      {route.distanceKm} km · Est. {route.estimatedTimeMin} mins
                    </span>
                  </div>

                  {/* Risk Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    isSafe ? 'bg-emerald-50 text-brand-emerald border-brand-emerald/30' :
                    isAlt ? 'bg-amber-50 text-amber-700 border-amber-300' :
                    'bg-red-50 text-red-700 border-red-300'
                  }`}>
                    {route.riskLevel} Risk
                  </span>
                </div>

                {/* Telemetry Breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-brand-sage/15 text-[11px]">
                  <div className="flex justify-between items-center text-brand-ink/70">
                    <span>Waterlogging Prob:</span>
                    <span className={`font-bold ${isSafe ? 'text-brand-emerald' : isAlt ? 'text-amber-700' : 'text-red-600'}`}>
                      {route.waterloggingProbability}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-brand-ink/70">
                    <span>Est. Water Depth:</span>
                    <span className="font-semibold text-brand-ink">
                      {route.waterDepthCm} cm
                    </span>
                  </div>
                </div>

                {/* Select Button */}
                {isSafe && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectRoute) onSelectRoute(route);
                    }}
                    className="mt-3 w-full py-2 px-3 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Use Safer Route</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
