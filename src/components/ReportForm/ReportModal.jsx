import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  MapPin, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../hooks/useAuth';

// 7 Primary Monitored Dibrugarh Locations
const DIBRUGARH_LOCATIONS = [
  { name: 'Lachit Nagar', lat: 27.4728, lng: 94.9120, sector: 'Ward 07 · High Priority' },
  { name: 'Dibrugarh West', lat: 27.4812, lng: 94.8985, sector: 'Mankotta Road Underpass' },
  { name: 'Dibrugarh University', lat: 27.4479, lng: 94.8911, sector: 'NH-37 Campus Sector' },
  { name: 'Barbaruah Chuk', lat: 27.4350, lng: 94.8520, sector: 'Southwest Drainage Sector' },
  { name: 'Panitola', lat: 27.4610, lng: 95.0320, sector: 'East Outer Basin' },
  { name: 'Chowkidinghee', lat: 27.4795, lng: 94.9180, sector: 'Central Roundabout / Bus Stand' },
  { name: 'Gram Bazar', lat: 27.4880, lng: 94.9075, sector: 'DTP Trunk Canal Overflow' },
];

export const ReportModal = ({ areas = [], defaultArea, isOpen, onClose, onReportSubmitted, onReportDeleted }) => {
  const { user } = useAuth();
  
  // Initial location selection
  const initialLocation = defaultArea?.name 
    ? DIBRUGARH_LOCATIONS.find(l => l.name.toLowerCase() === defaultArea.name.toLowerCase()) || DIBRUGARH_LOCATIONS[0]
    : DIBRUGARH_LOCATIONS[0];

  const [selectedLocation, setSelectedLocation] = useState(initialLocation.name);
  const [severity, setSeverity] = useState('CRITICAL');
  const [description, setDescription] = useState('');
  
  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [modalTab, setModalTab] = useState('new'); // 'new' | 'manage'
  const [existingReports, setExistingReports] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteSubmitted, setConfirmDeleteSubmitted] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      reportService.getReports().then(reps => setExistingReports(reps || []));
    }
  }, [isOpen, modalTab]);

  if (!isOpen) return null;

  // Process chosen image file
  const handleFileSelect = (file) => {
    setError(null);
    if (!file) return;

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setError('Unsupported file type. Please select a JPG, JPEG, or PNG image.');
      return;
    }

    // Validate size (10 MB maximum)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Limit is 10 MB.`);
      return;
    }

    setImageFile(file);

    // Create live object URL for instant preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetAndClose = () => {
    removeImage();
    setDescription('');
    setSeverity('CRITICAL');
    setError(null);
    setSubmittedReport(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (!selectedLocation) {
      setError('Please select an incident location in Dibrugarh.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a brief description of the waterlogging incident.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload image to Supabase Storage if an image was provided
      let finalImageUrl = null;
      if (imageFile) {
        const uploadResult = await reportService.uploadReportImage(imageFile);
        finalImageUrl = uploadResult.url;
      }

      // 2. Resolve latitude and longitude from the selected Dibrugarh location
      const locObj = DIBRUGARH_LOCATIONS.find(l => l.name.toLowerCase() === selectedLocation.toLowerCase()) || DIBRUGARH_LOCATIONS[0];
      
      // Slight offset for micro-locality point realism
      const latOffset = (Math.random() - 0.5) * 0.002;
      const lngOffset = (Math.random() - 0.5) * 0.002;

      // 3. Create the database record (Supabase + localStorage persistent demo fallback)
      const report = await reportService.createReport({
        location_name: locObj.name,
        area_name: locObj.name,
        description: description.trim(),
        severity: severity,
        latitude: locObj.lat + latOffset,
        longitude: locObj.lng + lngOffset,
        image_url: finalImageUrl,
        userId: user?.id || null,
        userName: user?.user_metadata?.full_name || 'Citizen Report'
      });

      setSubmittedReport(report);
      if (onReportSubmitted) {
        onReportSubmitted(report);
      }
    } catch (err) {
      console.error('Submit report error:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReportFromModal = async (report) => {
    const reportId = report.incident_id || report.id;
    setDeletingId(reportId);
    try {
      await reportService.deleteReport(reportId);
      setExistingReports(prev => prev.filter(r => 
        String(r.id) !== String(reportId) && 
        String(r.incident_id) !== String(reportId) &&
        String(r.id) !== String(report.id) &&
        String(r.incident_id) !== String(report.incident_id)
      ));
      if (submittedReport && (
        String(submittedReport.incident_id) === String(reportId) || 
        String(submittedReport.id) === String(reportId)
      )) {
        setSubmittedReport(null);
      }
      setConfirmDeleteId(null);
      setConfirmDeleteSubmitted(false);
      if (onReportDeleted) {
        onReportDeleted();
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
      alert('Failed to delete report.');
    } finally {
      setDeletingId(null);
    }
  };

  const activeLocationObj = DIBRUGARH_LOCATIONS.find(l => l.name.toLowerCase() === selectedLocation.toLowerCase()) || DIBRUGARH_LOCATIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Report Waterlogging Incident</h3>
              <p className="text-xs text-slate-400">Citizen crowdsourced reporting for Dibrugarh Municipal Corporation</p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs (New Report vs Manage Reports) */}
        {!submittedReport && (
          <div className="flex items-center gap-2 mt-3 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 shrink-0">
            <button
              type="button"
              onClick={() => setModalTab('new')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                modalTab === 'new'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="tab-new-report"
            >
              ➕ Report Incident
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab('manage');
                reportService.getReports().then(reps => setExistingReports(reps || []));
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                modalTab === 'manage'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="tab-manage-reports"
            >
              📋 Manage Reports ({existingReports.length})
            </button>
          </div>
        )}

        {/* Success Confirmation View */}
        {submittedReport ? (
          <div className="py-6 px-2 text-center flex-1 flex flex-col justify-center items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            
            <h4 className="text-lg font-bold text-white">Waterlogging Report Submitted</h4>
            <p className="text-xs text-slate-300 max-w-sm mt-1 mb-4 leading-relaxed">
              Your report has been successfully submitted and is now available to the response team.
            </p>

            {/* Generated Incident ID Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3.5 max-w-sm w-full text-left space-y-2 mb-5">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <span className="text-[11px] font-medium text-slate-400">Incident Reference ID</span>
                <span className="font-mono text-xs font-bold text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded border border-brand-emerald/30">
                  {submittedReport.incident_id}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">Location:</span>
                <span className="font-semibold text-white">📍 {submittedReport.location_name}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">Severity:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  submittedReport.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  submittedReport.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                  submittedReport.severity === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {submittedReport.severity}
                </span>
              </div>

              {submittedReport.image_url && (
                <div className="pt-1.5 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-700/60">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Photo stored in Supabase Storage</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full max-w-sm">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex-1 py-2.5 px-4 bg-brand-teal hover:bg-brand-teal/90 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Done
              </button>
              {confirmDeleteSubmitted ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteReportFromModal(submittedReport)}
                    className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl animate-pulse cursor-pointer shadow-sm"
                    id="confirm-delete-submitted-btn"
                  >
                    Confirm?
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteSubmitted(false)}
                    className="py-2.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSubmitted(true)}
                  className="py-2.5 px-3 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete this submitted report"
                  id="delete-submitted-report-btn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        ) : modalTab === 'manage' ? (
          /* Manage Existing Reports List */
          <div className="mt-3 space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-[60vh]">
            {existingReports.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <p>No active waterlogging reports on record.</p>
                <button
                  type="button"
                  onClick={() => setModalTab('new')}
                  className="mt-2 text-brand-teal hover:underline font-semibold"
                >
                  Create a new report
                </button>
              </div>
            ) : (
              existingReports.map(rep => {
                const sev = (rep.severity || 'HIGH').toUpperCase();
                const sevColor = 
                  sev === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  sev === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  sev === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';

                return (
                  <div 
                    key={`modal-rep-${rep.incident_id || rep.id}`}
                    className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-start justify-between gap-3 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {rep.image_url ? (
                        <img 
                          src={rep.image_url} 
                          alt="Incident thumbnail" 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-700/50 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/50">
                            {rep.incident_id || 'WF-INCIDENT'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${sevColor}`}>
                            {sev}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">
                          📍 {rep.location_name || rep.area_name}
                        </h4>
                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                          "{rep.description}"
                        </p>
                      </div>
                    </div>

                    {confirmDeleteId === (rep.incident_id || rep.id) ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteReportFromModal(rep)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold animate-pulse cursor-pointer shadow-sm"
                          id={`confirm-modal-del-${rep.incident_id || rep.id}`}
                        >
                          Confirm?
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={deletingId === (rep.incident_id || rep.id)}
                        onClick={() => setConfirmDeleteId(rep.incident_id || rep.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                        title="Delete Report"
                        id={`modal-del-btn-${rep.incident_id || rep.id}`}
                      >
                        {deletingId === (rep.incident_id || rep.id) ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="mt-3 space-y-4 overflow-y-auto pr-1 flex-1">
            
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Location Selection (7 Monitored Dibrugarh Localities) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  📍 Incident Location (Dibrugarh)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeLocationObj.lat.toFixed(4)}, {activeLocationObj.lng.toFixed(4)}
                </span>
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal transition-colors appearance-none cursor-pointer"
                  id="report-location-select"
                >
                  {DIBRUGARH_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} — {loc.sector}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* 2. Image Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                📷 Upload Waterlogging Image
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleInputChange}
                className="hidden"
                id="report-image-input"
              />

              {imagePreview ? (
                /* Selected Image Preview */
                <div className="relative bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Waterlogging preview"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-slate-700 shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-white truncate">
                      {imageFile?.name || 'incident_photo.jpg'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {imageFile ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Attached Photo'} · Ready to upload
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        Change Image
                      </button>
                      <span className="text-slate-600">·</span>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Drag & Drop Upload Zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-sky-400 bg-sky-500/10'
                      : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <UploadCloud className="w-7 h-7 mx-auto mb-1.5 text-sky-400" />
                  <p className="text-xs font-semibold text-slate-200">
                    Click to browse or drag & drop an image here
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports JPG, JPEG, and PNG (Max 10 MB)
                  </p>
                </div>
              )}
            </div>

            {/* 3. Observed Severity Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                ⚠️ Waterlogging Severity Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { level: 'LOW', label: '🟢 Low', color: 'border-green-500/40 text-green-400 bg-green-500/10' },
                  { level: 'MODERATE', label: '🟡 Moderate', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
                  { level: 'HIGH', label: '🟠 High', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
                  { level: 'CRITICAL', label: '🔴 Critical', color: 'border-red-500/40 text-red-400 bg-red-500/10' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.level}
                    onClick={() => setSeverity(item.level)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                      severity === item.level
                        ? `${item.color} ring-2 ring-brand-teal shadow-md`
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                📝 Incident Description & Landmark
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe observed water depth (e.g. 1.5 ft), blocked roadside drains, submerged streets, or landmark points..."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-teal transition-colors"
                id="report-description-input"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-teal/90 text-white text-xs font-bold shadow-lg shadow-brand-teal/20 transition-all disabled:opacity-50 cursor-pointer"
                id="submit-waterlogging-report-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading & Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Waterlogging Report</span>
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
