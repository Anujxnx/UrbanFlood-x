import React from 'react';
import { GitFork, AlertOctagon, Activity, CheckCircle2 } from 'lucide-react';

export const DrainageCard = ({ area }) => {
  const drainageRisk = area?.drainage_risk || 'HIGH';
  const action = area?.recommended_action || 'Prioritize municipal pump deployment and clearance of trunk drain B3.';

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg backdrop-blur flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <GitFork className="w-4 h-4 text-blue-400" />
            Drainage & Response Priority
          </span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${
            drainageRisk === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            drainageRisk === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          }`}>
            {drainageRisk} Priority
          </span>
        </div>

        <div className="my-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            Recommended Response
          </span>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {action}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-blue-400" />
          DTP Trunk Canal: Impaired
        </span>
        <span className="flex items-center gap-1 text-amber-400 font-medium">
          <CheckCircle2 className="w-3 h-3" /> 2 Blockages Detected
        </span>
      </div>
    </div>
  );
};
