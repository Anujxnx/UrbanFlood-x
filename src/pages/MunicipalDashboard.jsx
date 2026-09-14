import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Droplets, 
  MapPin, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Clock, 
  Search, 
  Filter, 
  Camera, 
  Eye, 
  Trash2, 
  ArrowRight, 
  Building2, 
  Activity, 
  User, 
  LogOut, 
  Flame, 
  ExternalLink,
  Layers,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { areaService } from '../services/areaService';
import { drainageService } from '../services/drainageService';
import { weatherService } from '../services/weatherService';
import { imdNowcastService } from '../services/imdNowcastService';
import { DibrugarhMap } from '../components/Map/DibrugarhMap';
import { MunicipalIncidentModal } from '../components/Municipal/MunicipalIncidentModal';
import { useAuth } from '../hooks/useAuth';

const DIBRUGARH_LOCALITIES = [
  'Lachit Nagar',
  'Dibrugarh West',
  'Dibrugarh University',
  'Barbaruah Chuk',
  'Panitola',
  'Chowkidinghee',
  'Gram Bazar'
];

export const MunicipalDashboard = () => {
  const { user, signOut, switchRole } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    dispatched: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0
  });

  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [roads, setRoads] = useState([]);
  const [drainage, setDrainage] = useState([]);
  const [nowcastWarning, setNowcastWarning] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Active layers for map
  const [activeLayers] = useState({
    risk: true,
    rainfall: true,
    roads: true,
    drainage: true,
    reports: true
  });

  const loadData = async () => {
    try {
      const [reps, st, areaList, roadsData, drainData, nowcastData] = await Promise.all([
        reportService.getReports(),
        reportService.getMunicipalStats(),
        areaService.getAreas(),
        drainageService.getRoads(),
        drainageService.getDrainageNetwork(),
        imdNowcastService.getDistrictNowcast('310')
      ]);

      setReports(reps || []);
      setStats(st || {
        total: reps?.length || 0,
        pending: 0,
        underReview: 0,
        dispatched: 0,
        inProgress: 0,
        resolved: 0,
        critical: 0
      });
      setAreas(areaList || []);
      if (areaList?.length > 0 && !selectedArea) {
        setSelectedArea(areaList[0]);
      }
      setRoads(roadsData || []);
      setDrainage(drainData || []);
      setNowcastWarning(nowcastData || null);
    } catch (err) {
      console.error('Error loading municipal data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30s to keep municipal dispatch synchronized
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleIncidentUpdated = async (updated) => {
    await loadData();
    if (selectedIncident && (selectedIncident.id === updated.id || selectedIncident.incident_id === updated.incident_id)) {
      setSelectedIncident(updated);
    }
  };

  const handleDeleteReport = async (report) => {
    const reportId = report.incident_id || report.id;
    try {
      await reportService.deleteReport(reportId);
      await loadData();
      if (selectedIncident && (selectedIncident.id === report.id || selectedIncident.incident_id === report.incident_id)) {
        setSelectedIncident(null);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const handleSwitchToCitizen = async () => {
    await switchRole('citizen');
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Filtered reports
  const filteredReports = reports.filter((rep) => {
    // 1. Search term (matches Incident ID, location name, description, assigned team)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = (rep.incident_id || '').toLowerCase().includes(term);
      const matchLoc = (rep.location_name || rep.area_name || '').toLowerCase().includes(term);
      const matchDesc = (rep.description || '').toLowerCase().includes(term);
      const matchTeam = (rep.assigned_team || '').toLowerCase().includes(term);
      if (!matchId && !matchLoc && !matchDesc && !matchTeam) return false;
    }

    // 2. Location filter
    if (filterLocation !== 'ALL') {
      const locName = (rep.location_name || rep.area_name || '').toLowerCase();
      if (!locName.includes(filterLocation.toLowerCase())) return false;
    }

    // 3. Severity filter
    if (filterSeverity !== 'ALL') {
      if ((rep.severity || '').toUpperCase() !== filterSeverity) return false;
    }

    // 4. Status filter
    if (filterStatus !== 'ALL') {
      const st = (rep.status || 'Pending').toLowerCase();
      if (filterStatus === 'PENDING' && !st.includes('pending')) return false;
      if (filterStatus === 'UNDER REVIEW' && !st.includes('review')) return false;
      if (filterStatus === 'TEAM DISPATCHED' && !st.includes('dispatch')) return false;
      if (filterStatus === 'IN PROGRESS' && !st.includes('progress')) return false;
      if (filterStatus === 'RESOLVED' && !st.includes('resolve')) return false;
      if (filterStatus === 'REJECTED' && !st.includes('reject')) return false;
    }

    return true;
  });

  // Sort critical unresolved incidents to the top
  const sortedReports = [...filteredReports].sort((a, b) => {
    const isCritA = (a.severity === 'CRITICAL' || a.priority === 'CRITICAL') && a.status !== 'Resolved';
    const isCritB = (b.severity === 'CRITICAL' || b.priority === 'CRITICAL') && b.status !== 'Resolved';
    if (isCritA && !isCritB) return -1;
    if (!isCritA && isCritB) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="min-h-screen bg-[#092328] text-white flex flex-col font-sans selection:bg-[#2A835F]/30">
      
      {/* 1. TOP COMMAND HEADER */}
      <header className="sticky top-0 z-40 w-full bg-[#092328]/95 backdrop-blur-md border-b border-[#12544F] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Operational Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#12544F] to-[#2A835F] flex items-center justify-center text-white font-black shadow-md shadow-[#12544F]/40 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Dibrugarh Municipal Corporation (DMC)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#12544F]/60 text-[#8BBB92] border border-[#2A835F]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2A835F] animate-pulse"></span>
                  Command Ops
                </span>
              </div>
              <p className="text-xs text-[#8BBB92] font-medium flex items-center gap-2 mt-0.5">
                <span>Flood Emergency Operations & Incident Dispatch Center</span>
                <span className="hidden sm:inline text-[#8BBB92]/40">•</span>
                <span className="hidden sm:inline text-[#2A835F] font-bold">Brahmaputra Gauge: Normal (+0.4m)</span>
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-[#0c2e35] hover:bg-[#12544F] text-[#8BBB92] border border-[#12544F] transition-colors cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#2A835F]' : ''}`} />
            </button>

            {/* Switch to Citizen Dashboard */}
            <button
              onClick={handleSwitchToCitizen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12544F] hover:bg-[#16625c] text-white border border-[#2A835F]/50 text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Switch to Citizen Portal View"
            >
              <User className="w-3.5 h-3.5 text-[#8BBB92]" />
              <span className="hidden sm:inline">Citizen Portal</span>
            </button>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-[#12544F]">
              <div className="w-8 h-8 rounded-xl bg-[#12544F] border border-[#2A835F]/40 text-[#8BBB92] font-bold text-xs flex items-center justify-center">
                DMC
              </div>
              <button
                onClick={handleSignOut}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8BBB92]/70 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* MAIN OPERATIONS VIEW */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-[#8BBB92] space-y-3">
          <RefreshCw className="w-8 h-8 text-[#2A835F] animate-spin" />
          <p className="text-sm font-semibold">Loading Municipal Telemetry & Citizen Incident Feeds...</p>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
          
          {/* 2. OVERVIEW / KPI STATISTICS CARDS (Dynamic from Supabase) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#8BBB92]">
                  Real-Time Incident Statistics (Supabase Live)
                </h2>
                <p className="text-xs text-[#8BBB92]/70">Live operational telemetry across all 7 monitored Dibrugarh wards</p>
              </div>
              <span className="text-[11px] font-mono text-[#8BBB92]/80">
                Last Synced: {new Date().toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              
              {/* Card 1: Total Reports */}
              <div className="bg-[#0c2e35] border border-[#12544F] hover:border-[#2A835F]/60 rounded-2xl p-4 shadow-sm transition-colors">
                <span className="text-[11px] font-semibold text-[#8BBB92] uppercase tracking-wider block">
                  Total Reports
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-white font-mono">{stats.total}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#12544F] text-[#8BBB92] text-xs font-bold border border-[#2A835F]/30">All</span>
                </div>
              </div>

              {/* Card 2: Pending */}
              <div className="bg-[#0c2e35] border border-red-500/30 hover:border-red-500/50 rounded-2xl p-4 shadow-sm transition-colors">
                <span className="text-[11px] font-semibold text-red-300 uppercase tracking-wider block">
                  Pending
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-red-400 font-mono">{stats.pending}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-red-950/40 text-red-300 text-xs font-bold border border-red-500/30">Action Req.</span>
                </div>
              </div>

              {/* Card 3: Under Review */}
              <div className="bg-[#0c2e35] border border-amber-500/30 hover:border-amber-500/50 rounded-2xl p-4 shadow-sm transition-colors">
                <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
                  Under Review
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-amber-400 font-mono">{stats.underReview}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-950/40 text-amber-300 text-xs font-bold border border-amber-500/30">Assessing</span>
                </div>
              </div>

              {/* Card 4: Teams Dispatched */}
              <div className="bg-[#0c2e35] border border-[#2A835F]/40 hover:border-[#2A835F]/70 rounded-2xl p-4 shadow-sm transition-colors">
                <span className="text-[11px] font-semibold text-[#8BBB92] uppercase tracking-wider block">
                  Teams Dispatched
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-[#8BBB92] font-mono">{stats.dispatched}</span>
                  <div className="p-1.5 rounded-lg bg-[#12544F] text-[#8BBB92] border border-[#2A835F]/30">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Card 5: Resolved */}
              <div className="bg-[#0c2e35] border border-[#2A835F]/50 hover:border-[#2A835F] rounded-2xl p-4 shadow-sm transition-colors">
                <span className="text-[11px] font-semibold text-[#2A835F] uppercase tracking-wider block">
                  Resolved
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-[#2A835F] font-mono">{stats.resolved}</span>
                  <div className="p-1.5 rounded-lg bg-[#12544F] text-[#2A835F] border border-[#2A835F]/40">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Card 6: Critical Incidents */}
              <div className="bg-gradient-to-br from-red-950/30 via-[#0c2e35] to-[#0c2e35] border border-red-500/40 hover:border-red-500/70 rounded-2xl p-4 shadow-sm transition-colors">
                <span className="text-[11px] font-semibold text-red-300 uppercase tracking-wider block flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" /> Critical
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-red-400 font-mono">{stats.critical}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/30">
                    High Risk
                  </span>
                </div>
              </div>

            </div>
          </section>

          {/* 3. COMBINED SITUATIONAL AWARENESS & MAP SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Interactive Leaflet Map (2 cols on desktop) */}
            <div className="lg:col-span-2 bg-[#0c2e35] border border-[#12544F] rounded-3xl p-5 shadow-sm flex flex-col space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2A835F]" />
                    <span>Live Dibrugarh Municipal GIS Dispatch Map</span>
                  </h3>
                  <p className="text-xs text-[#8BBB92]">
                    Incident markers with color-coded severity. Click marker to open dispatch controls.
                  </p>
                </div>

                {nowcastWarning && (
                  <div className="px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                    <span>IMD Nowcast: {nowcastWarning.warning_severity} Alert</span>
                  </div>
                )}
              </div>

              {/* Map Canvas */}
              <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#12544F] shadow-inner">
                <DibrugarhMap
                  areas={areas}
                  selectedArea={selectedArea}
                  onSelectArea={setSelectedArea}
                  activeLayers={activeLayers}
                  roads={roads}
                  drainage={drainage}
                  reports={reports}
                  onSelectReport={(rep) => setSelectedIncident(rep)}
                />
              </div>

              {/* Map Legend */}
              <div className="flex items-center justify-between text-[11px] text-[#8BBB92] pt-1 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Moderate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2A835F]"></span> Low
                  </span>
                </div>
                <span className="text-[#8BBB92]/60">Free OpenStreetMap GIS Layer</span>
              </div>
            </div>

            {/* AI Risk + Ground Observation Prioritization (1 col on desktop) */}
            <div className="bg-[#0c2e35] border border-[#12544F] rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-[#12544F] rounded-lg text-[#8BBB92] border border-[#2A835F]/40">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">AI Prediction & Ground Synergy</h3>
                </div>
                <p className="text-xs text-[#8BBB92]/80 leading-relaxed">
                  Correlating XGBoost predictive flood probability with ground truth citizen reports to guide municipal resources.
                </p>
              </div>

              {/* Localities Summary List */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-72">
                {DIBRUGARH_LOCALITIES.map((locName) => {
                  const locReports = reports.filter(r => 
                    (r.location_name || r.area_name || '').toLowerCase().includes(locName.toLowerCase())
                  );
                  const hasCritical = locReports.some(r => (r.severity === 'CRITICAL' || r.priority === 'CRITICAL') && r.status !== 'Resolved');
                  const unresolvedCount = locReports.filter(r => r.status !== 'Resolved').length;

                  return (
                    <div 
                      key={locName}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        hasCritical 
                          ? 'bg-red-950/30 border-red-500/40' 
                          : unresolvedCount > 0 
                            ? 'bg-[#092328] border-[#2A835F]/50' 
                            : 'bg-[#092328]/60 border-[#12544F] opacity-80'
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{locName}</h4>
                        <span className="text-[10px] text-[#8BBB92]">
                          {unresolvedCount > 0 ? `${unresolvedCount} Active Incident${unresolvedCount > 1 ? 's' : ''}` : 'No open incidents'}
                        </span>
                      </div>

                      {hasCritical ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-red-500 text-white animate-pulse">
                          CRITICAL SQUAD REQ.
                        </span>
                      ) : unresolvedCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950/40 text-amber-300 border border-amber-500/30">
                          MONITORED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#12544F]/60 text-[#8BBB92] border border-[#2A835F]/40">
                          CLEAR
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-[#092328] rounded-xl border border-[#12544F] text-[11px] text-[#8BBB92]">
                💡 <span className="font-semibold text-white">Operations Protocol:</span> When high AI risk coincides with citizen ground reports, dispatch pump units immediately.
              </div>
            </div>

          </div>

          {/* 4. WATERLOGGING INCIDENT REPORTS QUEUE & DISPATCH MANAGEMENT */}
          <section className="bg-[#0c2e35] border border-[#12544F] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#12544F]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#2A835F]" />
                  <span>Waterlogging Incident Reports & Dispatch Queue</span>
                </h3>
                <p className="text-xs text-[#8BBB92]">
                  Review citizen observations, assign response teams, update statuses, and log official actions.
                </p>
              </div>

              <span className="text-xs text-[#8BBB92] font-semibold self-start md:self-auto bg-[#092328] px-3 py-1 rounded-xl border border-[#12544F]">
                Showing {sortedReports.length} of {reports.length} Reports
              </span>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8BBB92] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Incident ID, location..."
                  className="w-full pl-9 pr-3 py-2 bg-[#092328] border border-[#12544F] rounded-xl text-xs text-white placeholder-[#8BBB92]/50 focus:outline-none focus:border-[#2A835F]"
                  id="municipal-search-input"
                />
              </div>

              {/* Location Filter */}
              <div>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full py-2 px-3 bg-[#092328] border border-[#12544F] rounded-xl text-xs text-white focus:outline-none focus:border-[#2A835F] cursor-pointer"
                  id="municipal-filter-location"
                >
                  <option value="ALL">📍 All Locations (Dibrugarh)</option>
                  {DIBRUGARH_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full py-2 px-3 bg-[#092328] border border-[#12544F] rounded-xl text-xs text-white focus:outline-none focus:border-[#2A835F] cursor-pointer"
                  id="municipal-filter-severity"
                >
                  <option value="ALL">⚠️ All Severity Levels</option>
                  <option value="CRITICAL">🔴 Critical Only</option>
                  <option value="HIGH">🟠 High Only</option>
                  <option value="MODERATE">🟡 Moderate Only</option>
                  <option value="LOW">🟢 Low Only</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full py-2 px-3 bg-[#092328] border border-[#12544F] rounded-xl text-xs text-white focus:outline-none focus:border-[#2A835F] cursor-pointer"
                  id="municipal-filter-status"
                >
                  <option value="ALL">📋 All Statuses</option>
                  <option value="PENDING">⚪ Pending</option>
                  <option value="UNDER REVIEW">🟡 Under Review</option>
                  <option value="TEAM DISPATCHED">🔵 Team Dispatched</option>
                  <option value="IN PROGRESS">🟣 In Progress</option>
                  <option value="RESOLVED">🟢 Resolved</option>
                  <option value="REJECTED">🔴 Rejected</option>
                </select>
              </div>

            </div>

            {/* Reports List */}
            {sortedReports.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#12544F] rounded-2xl">
                <p className="text-sm font-semibold text-[#8BBB92]">No incident reports match your current filter.</p>
                <button
                  onClick={() => { setSearchTerm(''); setFilterLocation('ALL'); setFilterSeverity('ALL'); setFilterStatus('ALL'); }}
                  className="mt-2 text-xs text-[#2A835F] hover:underline cursor-pointer font-bold"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedReports.map((rep) => {
                  const sev = (rep.severity || 'HIGH').toUpperCase();
                  const sevColor = 
                    sev === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                    sev === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                    sev === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                    'bg-[#2A835F]/20 text-[#8BBB92] border-[#2A835F]/40';

                  const st = rep.status || 'Pending';
                  const statusBg = 
                    st === 'Team Dispatched' || st === 'Dispatched' ? 'bg-[#12544F] text-[#8BBB92] border-[#2A835F]/50' :
                    st === 'Resolved' ? 'bg-[#2A835F]/30 text-[#2A835F] border-[#2A835F]' :
                    st === 'In Progress' ? 'bg-purple-950/40 text-purple-300 border-purple-500/40' :
                    st === 'Under Review' ? 'bg-amber-950/40 text-amber-300 border-amber-500/40' :
                    st === 'Rejected' ? 'bg-red-950/40 text-red-300 border-red-500/40' :
                    'bg-[#092328] text-[#8BBB92] border-[#12544F]';

                  const isCriticalUnresolved = sev === 'CRITICAL' && st !== 'Resolved';

                  return (
                    <div
                      key={`muni-rep-${rep.incident_id || rep.id}`}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCriticalUnresolved
                          ? 'bg-gradient-to-r from-red-950/30 to-[#092328] border-red-500/40 shadow-sm'
                          : 'bg-[#092328] border-[#12544F] hover:border-[#2A835F]/70'
                      }`}
                    >
                      {/* Left: Image + Info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        
                        {/* Image Thumbnail */}
                        {rep.image_url ? (
                          <div 
                            onClick={() => setSelectedIncident(rep)}
                            className="w-14 h-14 rounded-xl overflow-hidden border border-[#12544F] bg-[#071a1e] shrink-0 relative group cursor-pointer"
                          >
                            <img
                              src={rep.image_url}
                              alt="Incident"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#0c2e35] border border-[#12544F] flex items-center justify-center text-[#8BBB92] shrink-0">
                            <ShieldAlert className="w-6 h-6 text-[#2A835F]" />
                          </div>
                        )}

                        {/* Text Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-mono text-xs font-bold text-[#8BBB92] bg-[#12544F]/50 px-2 py-0.5 rounded border border-[#2A835F]/40">
                              {rep.incident_id || 'WF-INCIDENT'}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${sevColor}`}>
                              {sev}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBg}`}>
                              {st}
                            </span>
                            {rep.assigned_team && (
                              <span className="text-[10px] font-semibold text-[#8BBB92] bg-[#12544F]/40 px-2 py-0.5 rounded-full border border-[#12544F] flex items-center gap-1">
                                <Truck className="w-3 h-3 text-[#2A835F]" />
                                <span>{rep.assigned_team}</span>
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            📍 {rep.location_name || rep.area_name || 'Dibrugarh Locality'}
                          </h4>

                          <p className="text-xs text-[#8BBB92] line-clamp-2 mt-0.5 font-medium leading-snug bg-[#071a1e]/60 p-2 rounded-lg border border-[#12544F]/40">
                            "{rep.description || 'No description'}"
                          </p>

                          {/* Municipal Action Remarks Notice */}
                          {rep.municipal_action && (
                            <div className="mt-1.5 text-[11px] text-[#8BBB92] bg-[#0c2e35] border border-[#2A835F]/40 px-2.5 py-1 rounded-lg">
                              <span className="font-bold text-[#2A835F]">Action: </span>
                              <span>{rep.municipal_action}</span>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedIncident(rep)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#12544F] to-[#2A835F] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#12544F]/40 transition-all cursor-pointer"
                          id={`manage-incident-${rep.incident_id || rep.id}`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Dispatch / Action</span>
                        </button>

                        {/* Inline Delete Confirmation */}
                        {confirmDeleteId === (rep.incident_id || rep.id) ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(rep)}
                              className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm animate-pulse"
                            >
                              Confirm?
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-xl bg-[#12544F] hover:bg-[#16625c] text-[#8BBB92] text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(rep.incident_id || rep.id)}
                            className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 transition-colors cursor-pointer"
                            title="Delete Incident Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </section>

        </main>
      )}

      {/* Incident Review & Dispatch Modal */}
      <MunicipalIncidentModal
        report={selectedIncident}
        isOpen={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        onIncidentUpdated={handleIncidentUpdated}
      />

    </div>
  );
};
