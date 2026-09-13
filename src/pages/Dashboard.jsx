import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar/Navbar';
import { DibrugarhMap } from '../components/Map/DibrugarhMap';
import { AreaDetailsPanel } from '../components/AreaDetails/AreaDetailsPanel';
import { ReportModal } from '../components/ReportForm/ReportModal';
import { FloodSafeRoutePage } from './FloodSafeRoutePage';
import { areaService } from '../services/areaService';
import { rainfallService } from '../services/rainfallService';
import { predictionService } from '../services/predictionService';
import { drainageService } from '../services/drainageService';
import { reportService } from '../services/reportService';
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
  Navigation
} from 'lucide-react';

export const Dashboard = () => {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [rainfall, setRainfall] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [roads, setRoads] = useState([]);
  const [drainage, setDrainage] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);

  // Map layer toggle state
  const [activeLayers, setActiveLayers] = useState({
    risk: true,
    rainfall: true,
    roads: false,
    drainage: true,
    elevation: false,
    reports: true
  });

  // Load initial datasets
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const areaList = await areaService.getAreas();
      setAreas(areaList);

      const defaultArea = areaList[0]; // Lachit Nagar
      setSelectedArea(defaultArea);

      const [rainData, predData, roadsData, drainData, alertsData, reportsData] = await Promise.all([
        rainfallService.getRainfallByArea(defaultArea.id),
        predictionService.predict(defaultArea.id),
        drainageService.getRoads(),
        drainageService.getDrainageNetwork(),
        drainageService.getAlerts(),
        reportService.getReports()
      ]);

      setRainfall(rainData);
      setPrediction(predData);
      setRoads(roadsData);
      setDrainage(drainData);
      setAlerts(alertsData);
      setReports(reportsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

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
                />

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
                <span className="text-xs font-semibold text-brand-teal bg-[#E8F3ED] px-2.5 py-0.5 rounded-full">
                  Peak +3h
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
                    <span className="font-bold text-brand-ink">42%</span>
                    <span className="text-[10px] text-brand-ink/40 mt-0.5">Now</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium">61%</span>
                    <span className="text-[10px] text-brand-ink/40 mt-0.5">+1 hr</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-brand-teal">78%</span>
                    <span className="text-[10px] text-brand-ink/40 mt-0.5">+2 hr</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-brand-teal">86%</span>
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
                <h3 className="text-sm font-bold text-brand-ink tracking-tight">Active Dispatches</h3>
                <span className="text-[11px] font-semibold text-brand-teal">2 Scheduled</span>
              </div>

              {/* Priority Item 01 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-sage/25 flex items-center justify-between gap-3 hover:border-brand-teal/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-brand-teal/50 font-mono">01</span>
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

              {/* Priority Item 02 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-sage/25 flex items-center justify-between gap-3 hover:border-brand-teal/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-brand-ink/30 font-mono">02</span>
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
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
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
        </div>
      </nav>

      {/* Report Waterlogging Modal */}
      <ReportModal
        areas={areas}
        defaultArea={selectedArea}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportSubmitted={handleReportSubmitted}
      />
    </div>
  );
};
