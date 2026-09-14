import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar/Navbar';
import { DibrugarhMap } from '../components/Map/DibrugarhMap';
import { AreaDetailsPanel } from '../components/AreaDetails/AreaDetailsPanel';
import { ReportModal } from '../components/ReportForm/ReportModal';
import { ReportDetailsModal } from '../components/ReportDetails/ReportDetailsModal';
import { FloodSafeRoutePage } from './FloodSafeRoutePage';
import { areaService } from '../services/areaService';
import { rainfallService } from '../services/rainfallService';
import { predictionService } from '../services/predictionService';
import { drainageService } from '../services/drainageService';
import { reportService } from '../services/reportService';
import { weatherService } from '../services/weatherService';
import { imdNowcastService } from '../services/imdNowcastService';
import { useAuth } from '../hooks/useAuth';
import { 
  Droplets, 
  Map as MapIcon, 
  TrendingUp, 
  GitFork, 
  Settings, 
  Send, 
  ChevronRight, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Navigation,
  Camera,
  ShieldAlert,
  Eye,
  Truck,
  Trash2,
  FileText,
  Building2,
  Clock,
  MapPin,
  Users
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [rainfall, setRainfall] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [nowcastWarning, setNowcastWarning] = useState(null);
  const [roads, setRoads] = useState([]);
  const [drainage, setDrainage] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportForView, setSelectedReportForView] = useState(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Map layer toggle state
  const [activeLayers, setActiveLayers] = useState({
    risk: true,
    rainfall: true,
    roads: false,
    drainage: true,
    elevation: false,
    reports: true
  });

  // Helper to determine active step in 5-step response progression
  const getProgressStepIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('resolve')) return 4;
    if (s.includes('progress')) return 3;
    if (s.includes('dispatch')) return 2;
    if (s.includes('review')) return 1;
    return 0; // Submitted / Pending
  };

  // Load initial datasets
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const areaList = await areaService.getAreas();
      setAreas(areaList);

      const defaultArea = areaList[0]; // Lachit Nagar
      setSelectedArea(defaultArea);

      const [rainData, predData, roadsData, drainData, alertsData, reportsData, wxData, nowcastData, citizenReportsData] = await Promise.all([
        rainfallService.getRainfallByArea(defaultArea.id),
        predictionService.predict(defaultArea.id),
        drainageService.getRoads(),
        drainageService.getDrainageNetwork(),
        drainageService.getAlerts(),
        reportService.getReports(),
        weatherService.getCurrentWeather(),
        imdNowcastService.getDistrictNowcast('310'),
        reportService.getCitizenReports(user?.id)
      ]);

      setRainfall(rainData);
      setPrediction(predData);
      setRoads(roadsData);
      setDrainage(drainData);
      setAlerts(alertsData);
      setReports(reportsData);
      setMyReports(citizenReportsData);
      setCurrentWeather(wxData);
      setNowcastWarning(nowcastData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Handle area selection change
  const handleSelectArea = async (area) => {
    setSelectedArea(area);
    try {
      const [rainData, predData] = await Promise.all([
        rainfallService.getRainfallByArea(area.id),
        predictionService.predict(area.id)
      ]);
      setRainfall(rainData);
      setPrediction(predData);
      if (rainData?.current_weather) {
        setCurrentWeather(rainData.current_weather);
      }
      if (predData?.nowcast_telemetry) {
        setNowcastWarning(predData.nowcast_telemetry);
      }
    } catch (err) {
      console.error('Error updating area metrics:', err);
    }
  };

  const handleDeployUnit = () => {
    setDeploySuccess(true);
    setTimeout(() => setDeploySuccess(false), 3000);
  };

  const handleReportSubmitted = async () => {
    const updatedReports = await reportService.getReports();
    setReports(updatedReports);
    const updatedCitizenReports = await reportService.getCitizenReports(user?.id);
    setMyReports(updatedCitizenReports);
  };

  const handleReportStatusUpdated = (updated) => {
    setReports(prev => prev.map(r => ((r.id === updated.id || r.incident_id === updated.incident_id) ? updated : r)));
    setMyReports(prev => prev.map(r => ((r.id === updated.id || r.incident_id === updated.incident_id) ? updated : r)));
    if (selectedReportForView && (selectedReportForView.id === updated.id || selectedReportForView.incident_id === updated.incident_id)) {
      setSelectedReportForView(updated);
    }
  };

  const handleQuickDispatchReport = async (report) => {
    try {
      await reportService.updateReportStatus(report.id || report.incident_id, 'Dispatched');
      const updated = { ...report, status: 'Dispatched' };
      handleReportStatusUpdated(updated);
    } catch (err) {
      console.error('Quick dispatch failed:', err);
    }
  };

  const handleDeleteReport = async (report) => {
    const reportId = report.incident_id || report.id;
    try {
      await reportService.deleteReport(reportId);
      setReports(prev => prev.filter(r => 
        String(r.id) !== String(reportId) && 
        String(r.incident_id) !== String(reportId) && 
        String(r.id) !== String(report.id) && 
        String(r.incident_id) !== String(report.incident_id)
      ));
      setMyReports(prev => prev.filter(r => 
        String(r.id) !== String(reportId) && 
        String(r.incident_id) !== String(reportId) && 
        String(r.id) !== String(report.id) && 
        String(r.incident_id) !== String(report.incident_id)
      ));
      if (selectedReportForView && (
        String(selectedReportForView.id) === String(report.id) || 
        String(selectedReportForView.incident_id) === String(report.incident_id) || 
        String(selectedReportForView.incident_id) === String(reportId)
      )) {
        setSelectedReportForView(null);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const riskProb = prediction?.waterlogging_probability ?? selectedArea?.waterlogging_probability ?? 78;

  return (
    <div className="min-h-screen bg-[#F6FAF8] text-brand-ink flex flex-col font-sans selection:bg-brand-sage/30 relative pb-safe">
      
      {/* 1. Header Navbar with Mode Switcher */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main Content View */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-brand-ink/60 space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-teal animate-spin" />
          <p className="text-sm font-semibold">Loading HydroCommand Telemetry & Predictions...</p>
        </div>
      ) : (
        <main className="flex-1 px-4 sm:px-5 pt-3 pb-28 flex flex-col gap-5 max-w-md md:max-w-4xl mx-auto w-full">
          
          {/* FLOOD-SAFE ROUTE PLANNER TEASER BANNER (Overview tab) */}
          {activeTab === 'Overview' && (
            <div 
              onClick={() => setActiveTab('Flood-Safe Route')}
              className="bg-gradient-to-r from-brand-teal to-brand-emerald text-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight">Flood-Safe Route Planner</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                      Citizen Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 font-medium mt-0.5">
                    Find AI-calculated safe paths avoiding submerged road segments
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          )}

          {/* CITIZEN SUBMITTED REPORTS QUICK TRACKER BANNER (Overview tab) */}
          {activeTab === 'Overview' && myReports.length > 0 && (
            <div 
              onClick={() => setActiveTab('My Reports')}
              className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl p-4 shadow-sm border border-blue-700/40 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-2xl border border-blue-400/30 shrink-0">
                  <Building2 className="w-5 h-5 text-blue-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight">My Incident Reports</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200">
                      {myReports.length} {myReports.length === 1 ? 'Report' : 'Reports'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Latest: {myReports[0]?.status || 'Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5 truncate">
                    {myReports[0]?.municipal_action 
                      ? `Municipal remark: "${myReports[0]?.municipal_action}"`
                      : `Incident at ${myReports[0]?.location_name || 'Dibrugarh'} is ${myReports[0]?.status || 'Under Review'}. Tap to track progression.`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-300/70 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          )}

          {/* DEDICATED FLOOD-SAFE ROUTE PAGE TAB CONTENT */}
          {activeTab === 'Flood-Safe Route' && (
            <FloodSafeRoutePage
              areas={areas}
              roads={roads}
              drainage={drainage}
              reports={reports}
            />
          )}

          {/* PRIMARY HERO METRIC CARD (Shown on Overview & Nowcast tabs) */}
          {(activeTab === 'Overview' || activeTab === 'Nowcast') && (
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-brand-sage/25 flex flex-col gap-5 relative overflow-hidden">
              {/* Background gentle glow */}
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-brand-sage/15 rounded-full blur-2xl pointer-events-none"></div>

              {/* Top Row: Ward + Status */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-brand-teal uppercase">High Priority Focus</span>
                  <h2 className="text-base font-bold text-brand-ink">{selectedArea?.name || 'Lachit Nagar'} · Ward 07</h2>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                  Inundation Risk
                </span>
              </div>

              {/* Main Dial & Risk Value */}
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight text-brand-ink">{riskProb}</span>
                    <span className="text-2xl font-bold text-brand-teal">%</span>
                  </div>
                  <p className="text-xs font-medium text-brand-ink/60 mt-1">Projected Peak: 17:45 IST (+2h)</p>
                </div>

                {/* Refined circular gauge progress */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" fill="transparent" r="26" stroke="#E8F3ED" strokeWidth="5"></circle>
                    <circle 
                      cx="32" 
                      cy="32" 
                      fill="transparent" 
                      r="26" 
                      stroke="#12544F" 
                      strokeDasharray="163.36" 
                      strokeDashoffset={163.36 - (163.36 * riskProb) / 100} 
                      strokeLinecap="round" 
                      strokeWidth="5"
                    ></circle>
                  </svg>
                  <span className="material-symbols-outlined absolute text-brand-teal text-[22px]">water_drop</span>
                </div>
              </div>

              {/* Secondary Telemetry Line Items */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-brand-sage/20 text-center">
                <div className="flex flex-col p-2 rounded-xl bg-[#F6FAF8]">
                  <span className="text-[10px] uppercase font-semibold text-brand-ink/50 tracking-wider">Rainfall</span>
                  <span className="text-xs font-bold text-brand-ink mt-0.5">{rainfall?.current_mm || 82} mm/h</span>
                </div>
                <div className="flex flex-col p-2 rounded-xl bg-[#F6FAF8]">
                  <span className="text-[10px] uppercase font-semibold text-brand-ink/50 tracking-wider">Choke Load</span>
                  <span className="text-xs font-bold text-brand-ink mt-0.5">84%</span>
                </div>
                <div className="flex flex-col p-2 rounded-xl bg-[#F6FAF8]">
                  <span className="text-[10px] uppercase font-semibold text-brand-ink/50 tracking-wider">Water Depth</span>
                  <span className="text-xs font-bold text-brand-ink mt-0.5">28 cm</span>
                </div>
              </div>

              {/* IMD Live Synoptic Weather Observation Strip */}
              {currentWeather && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F6FAF8] border border-brand-sage/20 text-[11px] text-brand-ink/70">
                  <div className="flex items-center gap-1.5 font-medium truncate">
                    <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse shrink-0"></span>
                    <span className="font-semibold text-brand-ink shrink-0">IMD {currentWeather.station_id || '42410'}:</span>
                    <span>{currentWeather.temperature ?? 28.4}°C</span>
                    <span className="text-brand-ink/40">·</span>
                    <span>{currentWeather.humidity ?? 86}% RH</span>
                    <span className="text-brand-ink/40">·</span>
                    <span className="truncate">{currentWeather.wind_speed ?? 14.5} km/h {currentWeather.wind_direction || 'ENE'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-brand-teal shrink-0 pl-2">
                    <span>24h: {currentWeather.rainfall_24h ?? 58.4} mm</span>
                  </div>
                </div>
              )}

              {/* Deploy Action Button */}
              <button
                onClick={handleDeployUnit}
                className={`w-full py-3 px-4 font-semibold text-xs tracking-wide rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all ${
                  deploySuccess 
                    ? 'bg-brand-emerald text-white shadow-brand-emerald/20'
                    : 'bg-brand-teal hover:bg-brand-teal/95 active:scale-[0.99] text-white shadow-brand-teal/20'
                }`}
              >
                {deploySuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dewatering Unit Dispatched!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Deploy Dewatering Unit</span>
                  </>
                )}
              </button>
            </section>
          )}

          {/* GIS MAP VIEW CONTAINER (Shown on Overview & Map View tabs) */}
          {(activeTab === 'Overview' || activeTab === 'Map View') && (
            <section className="bg-white rounded-3xl p-5 shadow-sm border border-brand-sage/25 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-brand-ink tracking-tight">Dibrugarh GIS Siphon Network</h3>
                  <p className="text-[11px] text-brand-ink/50">Drainage conduits & catchment sinks</p>
                </div>
                <button
                  onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                  className="text-xs font-semibold text-brand-teal flex items-center gap-0.5 hover:underline"
                >
                  <span>{showDetailsPanel ? 'Collapse' : 'Expand'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Locality Switcher Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => handleSelectArea(area)}
                    className={`px-3 py-1 rounded-full text-xs shrink-0 transition-all ${
                      selectedArea?.id === area.id
                        ? 'font-semibold bg-brand-teal text-white shadow-sm'
                        : 'font-medium bg-[#F6FAF8] text-brand-ink/70 border border-brand-sage/30 hover:border-brand-teal/40'
                    }`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>

              {/* Map View Frame */}
              <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-brand-sage/30 shadow-inner">
                <DibrugarhMap
                  areas={areas}
                  selectedArea={selectedArea}
                  onSelectArea={handleSelectArea}
                  activeLayers={activeLayers}
                  roads={roads}
                  drainage={drainage}
                  reports={reports}
                  onSelectReport={(rep) => setSelectedReportForView(rep)}
                />

                {/* IMD District Nowcast Alert Badge */}
                {nowcastWarning && (
                  <div className="absolute top-2 left-2 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-brand-sage/30 flex items-center gap-1.5 text-[10px] font-semibold text-brand-ink shadow-sm pointer-events-none max-w-[200px] sm:max-w-xs truncate">
                    <span 
                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                      style={{ backgroundColor: nowcastWarning.severity_color || '#f97316' }}
                    ></span>
                    <span className="truncate">
                      IMD Nowcast: {nowcastWarning.warning_severity} ({nowcastWarning.rainfall_intensity_category?.split(':')[0] || 'Convective Rain'})
                    </span>
                  </div>
                )}

                {/* Sluice Status Badge */}
                <div className="absolute top-2 right-2 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-brand-sage/30 flex items-center gap-1.5 text-[10px] font-semibold text-brand-ink shadow-sm pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse"></span>
                  Sluice #04: Discharge Active
                </div>
              </div>
            </section>
          )}

          {/* 3-HOUR PREDICTIVE TIMELINE (Shown on Overview & Nowcast tabs) */}
          {(activeTab === 'Overview' || activeTab === 'Nowcast') && (
            <section className="bg-white rounded-3xl p-5 shadow-sm border border-brand-sage/25 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-brand-ink">Inundation Timeline</h3>
                  <p className="text-[11px] text-brand-ink/50">Next 3 hours AI predictive curve</p>
                </div>
                <span 
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: nowcastWarning ? `${nowcastWarning.severity_color}15` : '#E8F3ED',
                    color: nowcastWarning ? nowcastWarning.severity_color : '#12544F'
                  }}
                >
                  {nowcastWarning ? `${nowcastWarning.warning_severity} Alert · Peak +3h` : 'Peak +3h'}
                </span>
              </div>

              {/* Spacious Sparkline Area Chart */}
              <div className="w-full pt-2">
                <div className="relative h-28 w-full">
                  <svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 320 80">
                    <defs>
                      <linearGradient id="sageGradient" x1="0" x2="0" y1="0" y2="80" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#8BBB92" stopOpacity="0.45"></stop>
                        <stop offset="100%" stopColor="#8BBB92" stopOpacity="0.0"></stop>
                      </linearGradient>
                    </defs>
                    <line stroke="#8BBB92" strokeDasharray="3 3" strokeOpacity="0.3" x1="0" x2="320" y1="20" y2="20"></line>
                    <path d="M 20 62 C 90 52, 160 36, 230 22 C 265 15, 290 10, 300 8 L 300 80 L 20 80 Z" fill="url(#sageGradient)"></path>
                    <path d="M 20 62 C 90 52, 160 36, 230 22 C 265 15, 290 10, 300 8" stroke="#2A835F" strokeLinecap="round" strokeWidth="2.5"></path>
                    <circle cx="20" cy="62" fill="#FFFFFF" r="3.5" stroke="#2A835F" strokeWidth="2"></circle>
                    <circle cx="110" cy="46" fill="#FFFFFF" r="3.5" stroke="#2A835F" strokeWidth="2"></circle>
                    <circle cx="205" cy="27" fill="#FFFFFF" r="3.5" stroke="#2A835F" strokeWidth="2"></circle>
                    <circle cx="300" cy="8" fill="#12544F" r="4" stroke="#FFFFFF" strokeWidth="2"></circle>
                  </svg>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-brand-sage/15 text-brand-ink/70">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-brand-ink">{prediction?.timeline_forecast?.[0]?.prob ?? 42}%</span>
                    <span className="text-[10px] text-brand-ink/40 mt-0.5">Now</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium">{prediction?.timeline_forecast?.[1]?.prob ?? 61}%</span>
                    <span className="text-[10px] text-brand-ink/40 mt-0.5">+1 hr</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-brand-teal">{prediction?.timeline_forecast?.[2]?.prob ?? 78}%</span>
                    <span className="text-[10px] text-brand-ink/40 mt-0.5">+2 hr</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-brand-teal">{prediction?.timeline_forecast?.[3]?.prob ?? 86}%</span>
                    <span className="text-[10px] text-brand-teal font-semibold mt-0.5">+3 hr</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ACTIVE DISPATCHES / RESPONSE PRIORITIES */}
          {(activeTab === 'Overview' || activeTab === 'Dispatches') && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-bold text-brand-ink tracking-tight">Active Dispatches & Incident Reports</h3>
                  <p className="text-[11px] text-brand-ink/50">Municipal response squads & citizen waterlogging dispatches</p>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  id="dispatch-report-btn"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Report Incident</span>
                </button>
              </div>

              {/* Crowdsourced Citizen Incident Reports */}
              {reports && reports.length > 0 && reports.map((rep) => {
                const sev = (rep.severity || 'HIGH').toUpperCase();
                const sevColor = sev === 'CRITICAL' ? 'bg-red-500/15 text-red-600 border-red-500/30' :
                  sev === 'HIGH' ? 'bg-orange-500/15 text-orange-600 border-orange-500/30' :
                  sev === 'MODERATE' || sev === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30' :
                  'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
                
                const statusBadge = 
                  rep.status === 'Dispatched' ? 'bg-brand-teal text-white' :
                  rep.status === 'Resolved' ? 'bg-emerald-600 text-white' :
                  rep.status === 'Under Review' ? 'bg-amber-500 text-white' :
                  'bg-red-500 text-white';

                return (
                  <div 
                    key={`dispatch-rep-${rep.incident_id || rep.id}`}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-brand-sage/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-teal/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {rep.image_url ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-900 group">
                          <img 
                            src={rep.image_url} 
                            alt="Incident" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-[9px]">
                            <Camera className="w-3.5 h-3.5 text-white/90" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="font-mono text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-1.5 py-0.5 rounded border border-brand-teal/20">
                            {rep.incident_id || 'WF-INCIDENT'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sevColor}`}>
                            {sev}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>
                            {rep.status || 'Pending'}
                          </span>
                          {rep.image_url && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5 font-medium">
                              📷 Image attached
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-brand-ink truncate">
                          📍 {rep.location_name || rep.area_name}
                        </h4>
                        <p className="text-[11px] text-brand-ink/70 line-clamp-2 mt-0.5 leading-snug">
                          "{rep.description}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedReportForView(rep)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Report Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {rep.status !== 'Dispatched' && rep.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() => handleQuickDispatchReport(rep)}
                          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-brand-teal hover:bg-brand-teal/90 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                          title="Dispatch Team"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Dispatch</span>
                        </button>
                      )}

                      {confirmDeleteId === (rep.incident_id || rep.id) ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(rep)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm animate-pulse"
                            id={`confirm-delete-${rep.incident_id || rep.id}`}
                          >
                            Confirm?
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(rep.incident_id || rep.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Delete Incident Report"
                          id={`delete-report-${rep.incident_id || rep.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {(!reports || reports.length === 0) && (
                <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-brand-sage/40">
                  <p className="text-xs font-semibold text-brand-ink/60">No active waterlogging reports.</p>
                  <p className="text-[11px] text-brand-ink/40 mt-1">All monitored zones are currently clear or reported incidents have been resolved.</p>
                </div>
              )}

              {/* Scheduled Priority Item 01 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-sage/25 flex items-center justify-between gap-3 hover:border-brand-teal/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-brand-teal/50 font-mono">P-01</span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-brand-ink truncate">Lachit Nagar · Pump Unit 04</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-teal/10 text-brand-teal">
                        Action Required
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-ink/60 truncate mt-0.5">PWD Team tasked to clear culvert choke</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-8 h-8 rounded-xl bg-[#F6FAF8] hover:bg-brand-teal hover:text-white text-brand-teal border border-brand-sage/30 flex items-center justify-center shrink-0 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Scheduled Priority Item 02 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-sage/25 flex items-center justify-between gap-3 hover:border-brand-teal/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-brand-ink/30 font-mono">P-02</span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-brand-ink truncate">Mancotta Sluice Gate #02</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E8F3ED] text-brand-emerald">
                        Standby
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-ink/60 truncate mt-0.5">Automated telemetry monitoring levels</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-8 h-8 rounded-xl bg-[#F6FAF8] hover:bg-brand-teal hover:text-white text-brand-ink/60 border border-brand-sage/30 flex items-center justify-center shrink-0 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* DEDICATED "MY WATERLOGGING REPORTS" CITIZEN TRACKING TAB */}
          {activeTab === 'My Reports' && (
            <section className="flex flex-col gap-5">
              {/* Header Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-sage/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                      Citizen Action Hub
                    </span>
                    <span className="text-xs text-brand-ink/50 font-medium">
                      {myReports.length} {myReports.length === 1 ? 'Report' : 'Reports'} Logged
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-brand-ink">My Waterlogging Reports</h2>
                  <p className="text-xs text-brand-ink/60 mt-0.5">
                    Track official municipal review, response squad dispatches, and real-time resolution status.
                  </p>
                </div>

                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                  id="my-reports-new-btn"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Report New Incident</span>
                </button>
              </div>

              {/* List of citizen's submitted reports */}
              {myReports.length > 0 ? (
                <div className="space-y-4">
                  {myReports.map((rep) => {
                    const stepIndex = getProgressStepIndex(rep.status);
                    const steps = ['Submitted', 'Under Review', 'Dispatched', 'In Progress', 'Resolved'];
                    const sev = (rep.severity || 'HIGH').toUpperCase();
                    const sevColor = sev === 'CRITICAL' ? 'bg-red-500/15 text-red-600 border-red-500/30' :
                      sev === 'HIGH' ? 'bg-orange-500/15 text-orange-600 border-orange-500/30' :
                      sev === 'MODERATE' || sev === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30' :
                      'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';

                    return (
                      <div
                        key={`my-rep-${rep.incident_id || rep.id}`}
                        className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-brand-sage/25 flex flex-col gap-4 transition-all hover:border-brand-teal/40"
                      >
                        {/* Header row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-sage/20 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-brand-teal bg-brand-teal/10 px-2 py-1 rounded-lg border border-brand-teal/20">
                              {rep.incident_id || 'WF-INCIDENT'}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sevColor}`}>
                              {sev} Priority
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-brand-ink/50 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(rep.created_at || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>

                        {/* Body: Location, Description & Photo Preview */}
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                          {rep.image_url ? (
                            <div 
                              onClick={() => setSelectedReportForView(rep)}
                              className="relative w-full sm:w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-900 group cursor-pointer shadow-sm"
                            >
                              <img 
                                src={rep.image_url} 
                                alt="Incident evidence" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ) : null}

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-brand-ink flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                              <span>{rep.location_name || rep.area_name}</span>
                            </h3>
                            <p className="text-xs sm:text-sm text-brand-ink/75 mt-1.5 leading-relaxed bg-[#F6FAF8] p-3 rounded-xl border border-brand-sage/20">
                              "{rep.description}"
                            </p>
                          </div>
                        </div>

                        {/* 5-Step Visual Progress Stepper */}
                        <div className="bg-[#F8FCFA] p-4 rounded-2xl border border-brand-sage/20">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-brand-teal uppercase tracking-wider">
                              Incident Response Progression
                            </span>
                            <span className="text-xs font-bold text-brand-ink">
                              Current Status: <span className="text-brand-teal">{rep.status || 'Pending'}</span>
                            </span>
                          </div>

                          {/* Progress track */}
                          <div className="relative flex items-center justify-between px-2">
                            <div className="absolute top-3 left-4 right-4 h-1 bg-brand-sage/20 -translate-y-1/2 z-0 rounded-full" />
                            <div 
                              className="absolute top-3 left-4 h-1 bg-brand-teal -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                              style={{ width: `${(stepIndex / (steps.length - 1)) * 100}%` }}
                            />

                            {steps.map((stepName, sIdx) => {
                              const isCompleted = sIdx < stepIndex;
                              const isCurrent = sIdx === stepIndex;

                              return (
                                <div key={stepName} className="relative z-10 flex flex-col items-center">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-sm ${
                                      isCompleted
                                        ? 'bg-brand-emerald text-white'
                                        : isCurrent
                                        ? 'bg-brand-teal text-white ring-4 ring-brand-teal/20 animate-pulse'
                                        : 'bg-white text-brand-ink/40 border border-brand-sage/40'
                                    }`}
                                  >
                                    {isCompleted ? '✓' : sIdx + 1}
                                  </div>
                                  <span 
                                    className={`text-[9px] sm:text-[10px] font-semibold mt-1.5 text-center truncate max-w-[55px] sm:max-w-none ${
                                      isCurrent
                                        ? 'text-brand-teal font-bold'
                                        : isCompleted
                                        ? 'text-brand-emerald'
                                        : 'text-brand-ink/40'
                                    }`}
                                  >
                                    {stepName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Municipal Action Taken & Squad Info Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Official remarks */}
                          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                              <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                              <span>Municipal Official Remarks</span>
                            </div>
                            <p className="text-xs text-blue-800/90 leading-snug mt-0.5">
                              {rep.municipal_action || 'Report logged in Municipal Operations Queue. Rapid response teams assessing site drainage.'}
                            </p>
                          </div>

                          {/* Assigned Squad & ETA */}
                          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>Assigned Response Squad</span>
                            </div>
                            <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                              {rep.assigned_team || 'Pending Squad Assignment'}
                            </p>
                            <p className="text-[11px] text-emerald-700/80">
                              {rep.status === 'Resolved'
                                ? 'Incident marked as successfully resolved.'
                                : rep.assigned_team
                                ? 'Squad dispatched on-site for water drainage.'
                                : 'High priority dispatch queue.'}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-brand-sage/20">
                          <button
                            type="button"
                            onClick={() => setSelectedReportForView(rep)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>

                          {confirmDeleteId === (rep.incident_id || rep.id) ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-red-600 font-bold">Confirm delete?</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(rep)}
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(rep.incident_id || rep.id)}
                              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete My Report</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-brand-sage/40 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-brand-ink">No Waterlogging Reports Yet</h3>
                  <p className="text-xs text-brand-ink/60 max-w-sm mt-1 mb-4 leading-relaxed">
                    You haven't submitted any incident reports. When you encounter submerged streets or blocked drainage in Dibrugarh, report it here for immediate municipal attention.
                  </p>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="px-4 py-2.5 rounded-2xl bg-brand-teal hover:bg-brand-teal/90 text-white text-xs font-bold shadow-md shadow-brand-teal/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Report Incident Now</span>
                  </button>
                </div>
              )}
            </section>
          )}

        </main>
      )}

      {/* Floating Area Details Overlay */}
      {showDetailsPanel && selectedArea && (
        <div className="fixed inset-x-4 bottom-20 z-40 max-w-md mx-auto shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
          <AreaDetailsPanel
            area={selectedArea}
            onClose={() => setShowDetailsPanel(false)}
            onReportClick={() => setIsReportModalOpen(true)}
          />
        </div>
      )}

      {/* 7. BOTTOM NAVIGATION BAR (Clean minimal floating dock) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-t border-brand-sage/20 pb-safe shadow-[0_-2px_12px_rgba(9,35,40,0.03)]">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('Overview')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'Overview' || activeTab === 'Map View' ? 'text-brand-teal' : 'text-brand-ink/50 hover:text-brand-teal'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Map</span>
          </button>

          <button 
            onClick={() => setActiveTab('Flood-Safe Route')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'Flood-Safe Route' ? 'text-brand-teal' : 'text-brand-ink/50 hover:text-brand-teal'
            }`}
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px] font-medium">Routes</span>
          </button>

          <button 
            onClick={() => setActiveTab('Nowcast')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'Nowcast' ? 'text-brand-teal' : 'text-brand-ink/50 hover:text-brand-teal'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-medium">Nowcast</span>
          </button>

          <button 
            onClick={() => setActiveTab('Dispatches')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'Dispatches' ? 'text-brand-teal' : 'text-brand-ink/50 hover:text-brand-teal'
            }`}
          >
            <GitFork className="w-5 h-5" />
            <span className="text-[10px] font-medium">Dispatches</span>
          </button>

          <button 
            onClick={() => setActiveTab('My Reports')}
            className={`flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === 'My Reports' ? 'text-brand-teal' : 'text-brand-ink/50 hover:text-brand-teal'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">My Reports</span>
            {myReports.length > 0 && (
              <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-brand-teal ring-2 ring-white"></span>
            )}
          </button>
        </div>
      </nav>

      {/* Report Waterlogging Modal */}
      <ReportModal
        areas={areas}
        defaultArea={selectedArea}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportSubmitted={handleReportSubmitted}
        onReportDeleted={handleReportSubmitted}
      />

      {/* Report Details & Status Management Modal */}
      <ReportDetailsModal
        report={selectedReportForView}
        isOpen={Boolean(selectedReportForView)}
        onClose={() => setSelectedReportForView(null)}
        onStatusUpdated={handleReportStatusUpdated}
        onReportDeleted={handleDeleteReport}
      />
    </div>
  );
};
