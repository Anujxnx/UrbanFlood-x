import React from 'react';
import { X, MapPin, Droplets, Mountain, GitFork, Navigation, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';

export const AreaDetailsPanel = ({ area, onClose, onReportClick }) => {
  if (!area) return null;

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default: return 'bg-green-500/20 text-green-400 border-green-500/40';
    }
  };

  return (
    <div className="bg-slate-800/95 border border-slate-700/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur relative overflow-y-auto max-h-[85vh]">
      {/* Panel Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-700/80">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Selected Locality
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
            {area.name}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {area.district}, {area.state}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 my-4">
        {/* Risk Probability Box */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Waterlogging Risk
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-white">{area.waterlogging_probability}%</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${getRiskBadge(area.risk_level)}`}>
              {area.risk_level}
            </span>
          </div>
        </div>

        {/* Current Rainfall Box */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Current Rainfall
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-sky-400">{area.rainfall_mm}</span>
            <span className="text-xs font-bold text-slate-300">mm</span>
          </div>
        </div>
      </div>

      {/* Geospatial & Feature Parameters */}
      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/50 space-y-2.5 mb-4 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Mountain className="w-3.5 h-3.5 text-emerald-400" /> Elevation (MSL):
          </span>
          <span className="font-semibold text-white">{area.elevation || 99.2} meters</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Mountain className="w-3.5 h-3.5 text-emerald-400" /> Slope Gradient:
          </span>
          <span className="font-semibold text-white">{area.slope || 0.45}°</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <GitFork className="w-3.5 h-3.5 text-blue-400" /> Drainage Risk:
          </span>
          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] border ${getRiskBadge(area.drainage_risk || 'HIGH')}`}>
            {area.drainage_risk || 'HIGH'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Navigation className="w-3.5 h-3.5 text-amber-400" /> Road Corridor Risk:
          </span>
          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] border ${getRiskBadge(area.road_risk || 'MEDIUM')}`}>
            {area.road_risk || 'MEDIUM'}
          </span>
        </div>
      </div>

      {/* Hourly Forecast Projection */}
      <div className="mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-2">
          3-Hour Forecast Breakdown
        </span>
        <div className="grid grid-cols-3 gap-2">
          {(area.hourly_forecast || [
            { hour: '0-1 hr', rainfall_mm: 15, probability: 72 },
            { hour: '1-2 hr', rainfall_mm: 18, probability: 78 },
            { hour: '2-3 hr', rainfall_mm: 9, probability: 64 }
          ]).map((item, idx) => (
            <div key={idx} className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/60 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block">{item.hour}</span>
              <span className="text-sm font-extrabold text-white block my-0.5">{item.rainfall_mm} mm</span>
              <span className="text-[10px] font-bold text-sky-400">{item.probability}% Risk</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Municipal Response */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3.5 rounded-xl border border-sky-500/30 mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 block mb-1 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Recommended Municipal Response
        </span>
        <p className="text-xs text-slate-200 font-medium leading-relaxed">
          {area.recommended_action || 'Prioritize drainage inspection and traffic management.'}
        </p>
      </div>

      {/* Submit Local Report Button */}
      {onReportClick && (
        <button
          onClick={() => onReportClick(area)}
          className="w-full py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <Droplets className="w-4 h-4 text-red-400" />
          <span>Report Waterlogging in {area.name}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
