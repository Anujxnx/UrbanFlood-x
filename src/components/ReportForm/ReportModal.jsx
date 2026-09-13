import React, { useState } from 'react';
import { X, ShieldAlert, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../hooks/useAuth';

export const ReportModal = ({ areas, defaultArea, isOpen, onClose, onReportSubmitted }) => {
  const { user } = useAuth();
  const [areaId, setAreaId] = useState(defaultArea?.id || areas[0]?.id || '');
  const [severity, setSeverity] = useState('HIGH');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedAreaObj = areas.find(a => a.id === areaId) || defaultArea || areas[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a short description of the waterlogging situation.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lat = selectedAreaObj?.latitude || 27.4728;
      const lng = selectedAreaObj?.longitude || 94.9120;

      await reportService.createReport({
        area_id: areaId,
        area_name: selectedAreaObj?.name || 'Dibrugarh Sector',
        description,
        severity,
        latitude: lat + (Math.random() - 0.5) * 0.005, // Slight offset for precise spot
        longitude: lng + (Math.random() - 0.5) * 0.005,
        userId: user?.id || 'demo-user-123'
      });

      setSuccess(true);
      if (onReportSubmitted) onReportSubmitted();
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setDescription('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Unable to save waterlogging report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Report Waterlogging</h3>
              <p className="text-xs text-slate-400">Crowdsourced municipal incident logging for Dibrugarh</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Notice */}
        {success ? (
          <div className="my-8 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 animate-bounce" />
            <h4 className="text-base font-bold text-white">Report Submitted Successfully!</h4>
            <p className="text-xs text-slate-400 mt-1">Your report has been logged and added to the interactive flood map.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Area Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Dibrugarh Area / Locality
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Severity Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Observed Severity Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { level: 'LOW', color: 'border-green-500/40 text-green-400 bg-green-500/10' },
                  { level: 'MEDIUM', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
                  { level: 'HIGH', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
                  { level: 'CRITICAL', color: 'border-red-500/40 text-red-400 bg-red-500/10' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.level}
                    onClick={() => setSeverity(item.level)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      severity === item.level
                        ? `${item.color} ring-2 ring-sky-500/50 shadow-md`
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.level}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Incident Description & Landmark
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe water depth (e.g. 1 ft), blocked drains, submerged streets or key landmarks..."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Saving Report...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
