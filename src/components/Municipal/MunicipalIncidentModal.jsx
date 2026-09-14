import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Truck, 
  Calendar,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  User,
  ShieldAlert,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';
import { reportService } from '../../services/reportService';

const RESPONSE_TEAMS = [
  'DMC Drainage Squad 01 (Central)',
  'DMC Drainage Squad 02 (Mankotta/Lachit)',
  'Mobile Dewatering Pump Unit 04',
  'SDRF Quick Response Flood Team',
  'PWD Culvert Clearance Crew',
  'Dibrugarh Fire & Emergency Water Rescue'
];

export const MunicipalIncidentModal = ({ report, isOpen, onClose, onIncidentUpdated }) => {
  const [status, setStatus] = useState(report?.status || 'Pending');
  const [assignedTeam, setAssignedTeam] = useState(report?.assigned_team || '');
  const [priority, setPriority] = useState(report?.priority || report?.severity || 'HIGH');
  const [municipalAction, setMunicipalAction] = useState(report?.municipal_action || '');
  
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (report) {
      setStatus(report.status || 'Pending');
      setAssignedTeam(report.assigned_team || '');
      setPriority(report.priority || (report.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH'));
      setMunicipalAction(report.municipal_action || '');
      setFeedback(null);
    }
  }, [report]);

  if (!isOpen || !report) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const updated = await reportService.updateMunicipalIncident(report.incident_id || report.id, {
        status,
        assigned_team: assignedTeam,
        priority,
        municipal_action: municipalAction.trim()
      });

      setFeedback({ type: 'success', text: `Incident ${report.incident_id} successfully updated.` });
      if (onIncidentUpdated) {
        onIncidentUpdated(updated);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error updating municipal incident:', err);
      setFeedback({ type: 'error', text: 'Failed to update incident in Supabase database.' });
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = report.created_at
    ? new Date(report.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recent';

  const severityBadgeColor = 
    report.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
    report.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
    report.severity === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[94vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-lg border border-sky-800/60">
                {report.incident_id || 'WF-INCIDENT'}
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${severityBadgeColor}`}>
                {report.severity} SEVERITY
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Priority: <span className="text-white font-bold">{priority}</span>
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <span>📍 {report.location_name || report.area_name || 'Dibrugarh Sector'}</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          
          {/* Feedback Alert */}
          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
                : 'bg-red-500/20 border border-red-500/40 text-red-300'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Top Grid: Photo & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Uploaded Citizen Photo */}
            <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 relative group">
              {report.image_url ? (
                <div className="relative h-48 sm:h-56">
                  <img
                    src={report.image_url}
                    alt={`Incident at ${report.location_name}`}
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={report.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black/90 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm transition-colors cursor-pointer"
                  >
                    <span>Inspect Full Photo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="h-48 sm:h-56 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <ShieldAlert className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs">No citizen image attached to this report.</p>
                </div>
              )}
            </div>

            {/* Incident Metadata Box */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Citizen Field Observation
                </span>
                <p className="text-xs text-slate-200 font-medium leading-relaxed italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  "{report.description || 'No description provided.'}"
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-sky-400" /> Reporter:
                  </span>
                  <span className="font-semibold text-white truncate max-w-[140px]">
                    {report.user_name || 'Citizen Contributor'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" /> Reported Time:
                  </span>
                  <span className="font-semibold text-white">{formattedDate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-400" /> GPS Location:
                  </span>
                  <span className="font-mono text-white text-[11px]">
                    {Number(report.latitude).toFixed(4)}° N, {Number(report.longitude).toFixed(4)}° E
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Form: Municipal Authority Action & Dispatch Controls */}
          <form onSubmit={handleUpdate} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4">
            
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/60 text-xs font-bold text-white uppercase tracking-wider">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Municipal Operations & Dispatch Action</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Incident Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                  id="municipal-status-select"
                >
                  <option value="Pending">⚪ PENDING</option>
                  <option value="Under Review">🟡 UNDER REVIEW</option>
                  <option value="Team Dispatched">🔵 TEAM DISPATCHED</option>
                  <option value="In Progress">🟣 IN PROGRESS</option>
                  <option value="Resolved">🟢 RESOLVED</option>
                  <option value="Rejected">🔴 REJECTED</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Response Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
                  id="municipal-priority-select"
                >
                  <option value="CRITICAL">🔴 CRITICAL</option>
                  <option value="HIGH">🟠 HIGH</option>
                  <option value="MEDIUM">🟡 MEDIUM</option>
                  <option value="LOW">🟢 LOW</option>
                </select>
              </div>

              {/* Response Squad Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Assigned Team
                </label>
                <input
                  type="text"
                  list="response-teams-list"
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  placeholder="Select or enter team..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  id="municipal-assigned-team-input"
                />
                <datalist id="response-teams-list">
                  {RESPONSE_TEAMS.map(team => (
                    <option key={team} value={team} />
                  ))}
                </datalist>
              </div>

            </div>

            {/* Action Taken Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Official Action Taken & Instructions
                </label>
                <span className="text-[10px] text-slate-400">
                  Visible to reporting citizen in "My Reports"
                </span>
              </div>
              <textarea
                rows="3"
                value={municipalAction}
                onChange={(e) => setMunicipalAction(e.target.value)}
                placeholder="Example: Drainage response team dispatched to Lachit Nagar to clear blocked drainage culverts..."
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 leading-relaxed font-medium"
                id="municipal-action-input"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/25 transition-all cursor-pointer disabled:opacity-50"
                id="submit-municipal-update-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Update Incident & Dispatch</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
