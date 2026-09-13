import React from 'react';
import { Layers, CloudRain, Shield, Navigation, GitFork, Mountain, Users } from 'lucide-react';

export const LayerControl = ({ activeLayers, onToggleLayer }) => {
  const layerOptions = [
    { key: 'risk', label: 'Flood Risk', icon: Shield, color: 'text-orange-400' },
    { key: 'rainfall', label: 'Rainfall', icon: CloudRain, color: 'text-sky-400' },
    { key: 'roads', label: 'Roads', icon: Navigation, color: 'text-amber-400' },
    { key: 'drainage', label: 'Drainage', icon: GitFork, color: 'text-blue-400' },
    { key: 'elevation', label: 'Elevation', icon: Mountain, color: 'text-emerald-400' },
    { key: 'reports', label: 'User Reports', icon: Users, color: 'text-red-400' },
  ];

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-md backdrop-blur">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/60">
        <Layers className="w-4 h-4 text-sky-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Map Data Layers
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {layerOptions.map((layer) => {
          const Icon = layer.icon;
          const isActive = !!activeLayers[layer.key];

          return (
            <button
              key={layer.key}
              onClick={() => onToggleLayer(layer.key)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-700 border-sky-500/50 text-white shadow-sm'
                  : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => {}} // handled by button click
                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-0 cursor-pointer"
              />
              <Icon className={`w-3.5 h-3.5 ${isActive ? layer.color : 'text-slate-500'}`} />
              <span className="truncate">{layer.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
