import React from 'react';
import { CloudRain, TrendingUp, Compass } from 'lucide-react';

export const RainfallCard = ({ rainfall }) => {
  const currentMm = rainfall?.current_mm ?? 42;
  const intensity = rainfall?.intensity || 'Heavy';
  const forecast = rainfall?.forecast || [
    { hour: '0-1 hr', rainfall_mm: 15, probability: 72 },
    { hour: '1-2 hr', rainfall_mm: 18, probability: 78 },
    { hour: '2-3 hr', rainfall_mm: 9, probability: 64 }
  ];

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg backdrop-blur flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CloudRain className="w-4 h-4 text-sky-400" />
            Rainfall & Forecast
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {intensity}
          </span>
        </div>

        <div className="my-2 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-white tracking-tight">
            {currentMm} <span className="text-xl font-bold text-sky-400">mm</span>
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Current Rate
          </span>
        </div>

        {/* Forecast Hours Breakdown */}
        <div className="mt-3 grid grid-cols-3 gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-700/50">
          {forecast.map((f, i) => (
            <div key={i} className="text-center">
              <span className="text-[10px] font-medium text-slate-400 block">{f.hour}</span>
              <span className="text-xs font-bold text-white block mt-0.5">{f.rainfall_mm} mm</span>
              <span className="text-[10px] text-sky-400 font-semibold">{f.probability}% risk</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-sky-400" />
          Accumulated 24h: {rainfall?.accumulated_24h || 118} mm
        </span>
        <span className="flex items-center gap-1">
          <Compass className="w-3 h-3 text-slate-400" /> AWS Station
        </span>
      </div>
    </div>
  );
};
