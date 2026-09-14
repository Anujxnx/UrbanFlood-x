import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';
import { reportService } from '../../services/reportService';

export const ReportDetailsModal = ({ report, isOpen, onClose, onStatusUpdated, onReportDeleted }) => {
  const [currentStatus, setCurrentStatus] = useState(report?.status || 'Pending');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  if (!isOpen || !report) return null;

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus) return;
    setUpdating(true);
    setFeedbackMsg(null);

    try {
      await reportService.updateReportStatus(report.id || report.incident_id, newStatus);
      setCurrentStatus(newStatus);
      setFeedbackMsg(`Status updated to ${newStatus}`);
      if (onStatusUpdated) {
        onStatusUpdated({ ...report, status: newStatus });
      }
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error('Status update failed:', err);
      setFeedbackMsg('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickDispatch = () => {
    handleStatusChange('Dispatched');
  };

  const handleDelete = async () => {
    const reportId = report.incident_id || report.id;
    setDeleting(true);
    try {
      if (onReportDeleted) {
        await onReportDeleted(report);
      } else {
        await reportService.deleteReport(reportId);
      }
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
      setFeedbackMsg('Failed to delete report.');
      setDeleting(false);
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

  const severityColor = 
    report.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
    report.severity === 'HIGH' ? 'bg-orange-500 text-white' :
    report.severity === 'MODERATE' || report.severity === 'MEDIUM' ? 'bg-yellow-500 text-slate-900' :
    'bg-emerald-600 text-white';

  const statusColor = 
    currentStatus === 'Dispatched' ? 'bg-brand-teal text-white border-brand-teal' :
    currentStatus === 'Resolved' ? 'bg-emerald-600 text-white border-emerald-600' :
    currentStatus === 'Under Review' ? 'bg-amber-500 text-white border-amber-500' :
    'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-brand-sage/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-brand-sage/20 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded border border-brand-teal/30">
                {report.incident_id || 'WF-2026-INCIDENT'}
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${severityColor}`}>
                {report.severity}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-brand-ink mt-1">
              {report.location_name || report.area_name || 'Dibrugarh Sector'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-brand-ink/40 hover:text-brand-ink rounded-lg hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          
          {/* Status Feedback Notice */}
          {feedbackMsg && (
            <div className="p-2.5 bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Incident Image View */}
          {report.image_url ? (
            <div className="rounded-xl overflow-hidden border border-brand-sage/30 relative bg-slate-900 group">
              <img
                src={report.image_url}
                alt={`Waterlogging at ${report.location_name}`}
                className="w-full max-h-60 sm:max-h-72 object-cover"
              />
              <a
                href={report.image_url}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm transition-colors"
              >
                <span>Full Image</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
              No photo attached to this report.
            </div>
          )}

          {/* Incident Description */}
          <div className="bg-slate-50 border border-brand-sage/20 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-ink/50 block mb-1">
              Field Description & Landmarks
            </span>
            <p className="text-xs text-brand-ink font-medium leading-relaxed">
              "{report.description}"
            </p>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-brand-sage/20 flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-brand-ink/50 flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand-teal" /> Reported Time
              </span>
              <span className="font-semibold text-brand-ink mt-0.5 text-[11px] truncate">
                {formattedDate}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-brand-sage/20 flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-brand-ink/50 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand-teal" /> Coordinates
              </span>
              <span className="font-mono font-semibold text-brand-ink mt-0.5 text-[11px]">
                {Number(report.latitude).toFixed(4)}, {Number(report.longitude).toFixed(4)}
              </span>
            </div>
          </div>

          {/* Status Management Workflow */}
          <div className="p-4 rounded-xl border border-brand-sage/30 bg-[#F6FAF8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                Municipal Dispatch Status
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusColor}`}>
                {currentStatus}
              </span>
            </div>

            <p className="text-[11px] text-brand-ink/60 mb-3">
              Update status to notify municipal response squads and update GIS dispatch maps:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {['Pending', 'Under Review', 'Dispatched', 'Resolved'].map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    currentStatus === st
                      ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                      : 'bg-white border-brand-sage/40 text-brand-ink/70 hover:border-brand-teal hover:text-brand-teal'
                  } disabled:opacity-50`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-brand-sage/20 mt-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-ink/60 hover:text-brand-ink hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer animate-pulse shadow-sm"
                  id="modal-confirm-delete-btn"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete?'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={deleting || updating}
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                title="Delete Incident Report"
                id="modal-delete-report-btn"
              >
                {deleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Report</span>
              </button>
            )}
          </div>

          {currentStatus !== 'Dispatched' && currentStatus !== 'Resolved' && (
            <button
              type="button"
              disabled={updating || deleting}
              onClick={handleQuickDispatch}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal hover:bg-brand-teal/90 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {updating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Truck className="w-3.5 h-3.5" />
              )}
              <span>Dispatch Dewatering Squad</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
