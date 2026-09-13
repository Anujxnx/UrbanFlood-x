import React from 'react';
import { AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export const RiskCard = ({ area, prediction }) => {
  if (!area) return null;

  const riskLevel = prediction?.risk_level || area.risk_level || 'LOW';
  const prob = prediction?.waterlogging_probability ?? area.waterlogging_probability ?? 0;
  const modelName = prediction?.model_name || 'XGBoost-Dibrugarh-v1';

  const getRiskBadgeStyles = (risk) => {
    switch (risk) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
          text: 'CRITICAL RISK',
          accent: 'from-red-600 to-rose-600',
          desc: 'Severe waterlogging expected / immediate attention required'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
          text: 'HIGH RISK',
          accent: 'from-orange-600 to-amber-600',
          desc: 'High probability of localized urban waterlogging'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
          text: 'MEDIUM RISK',
          accent: 'from-yellow-600 to-amber-500',
          desc: 'Potential water accumulation in low-lying corridors'
        };
      default:
        return {
          bg: 'bg-green-500/10 border-green-500/30 text-green-400',
          text: 'LOW RISK',
          accent: 'from-emerald-600 to-teal-600',
          desc: 'Safe / Low waterlogging probability'
        };
    }
  };

  const style = getRiskBadgeStyles(riskLevel);

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg backdrop-blur flex flex-col justify-between relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.accent} opacity-10 blur-2xl pointer-events-none rounded-full`} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            {riskLevel === 'LOW' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            Current Risk Level
          </span>

          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${style.bg}`}>
            {style.text}
          </span>
        </div>

        {/* Big Probability Metric */}
        <div className="my-2 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-white tracking-tight">
            {prob}%
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Waterlogging Probability
          </span>
        </div>

        <p className="text-xs text-slate-300 font-normal leading-relaxed mt-1">
          {style.desc}
        </p>
      </div>

      {/* Model Metadata Footer */}
      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 font-mono text-slate-400">
          <Cpu className="w-3 h-3 text-sky-400" />
          {modelName}
        </span>
        <span className="text-emerald-400 font-medium">Verified Active</span>
      </div>
    </div>
  );
};
