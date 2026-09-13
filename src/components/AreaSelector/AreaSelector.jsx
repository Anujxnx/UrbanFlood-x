import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, Check, X } from 'lucide-react';

export const AreaSelector = ({ areas, selectedArea, onSelectArea }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredAreas = areas.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
        <span>Select Area / Locality</span>
        <span className="text-[10px] font-normal text-slate-500">Dibrugarh, Assam</span>
      </label>

      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer text-slate-200 shadow-sm transition-all"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
            {selectedArea ? (
              <span className="font-semibold text-sm text-white truncate">
                {selectedArea.name}
              </span>
            ) : (
              <span className="text-sm text-slate-400 truncate">
                Select or search locality...
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedArea && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskColor(selectedArea.risk_level)}`}>
                {selectedArea.risk_level}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur">
            {/* Search Input inside Dropdown */}
            <div className="p-2 border-b border-slate-700/80 bg-slate-900/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Dibrugarh area..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-sky-500"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Locality Items List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-700/40">
              {filteredAreas.length > 0 ? (
                filteredAreas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => {
                      onSelectArea(area);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-700/50 ${
                      selectedArea?.id === area.id ? 'bg-sky-500/10 text-sky-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-3.5 h-3.5 ${selectedArea?.id === area.id ? 'text-sky-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="font-medium text-slate-200">{area.name}</div>
                        <div className="text-[10px] text-slate-400">{area.district}, {area.state}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRiskColor(area.risk_level)}`}>
                        {area.waterlogging_probability}% Risk
                      </span>
                      {selectedArea?.id === area.id && (
                        <Check className="w-4 h-4 text-sky-400 shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-400 text-center">
                  No matching Dibrugarh locality found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
