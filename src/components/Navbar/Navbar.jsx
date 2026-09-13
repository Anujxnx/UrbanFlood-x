import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, ShieldAlert, Database } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isDemoMode } from '../../lib/supabase';

export const Navbar = ({ activeTab = 'Overview', onTabChange, onOpenReportModal }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'EB';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F6FAF8]/95 backdrop-blur-md pt-safe border-b border-brand-sage/20 transition-all">
      {/* 1. Top Bar */}
      <div className="max-w-md md:max-w-4xl mx-auto px-5 py-3.5 flex items-center justify-between">
        
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm border border-brand-sage/30 bg-brand-ink flex items-center justify-center text-white font-black text-sm">
              <div className="w-full h-full bg-gradient-to-tr from-brand-teal to-brand-emerald flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">water_ec</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-brand-ink tracking-tight leading-tight">
                  HydroCommand
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-brand-emerald border border-brand-emerald/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse"></span>
                  Live
                </span>
              </div>
              <p className="text-[11px] font-medium text-brand-ink/60 leading-none mt-0.5 flex items-center gap-1">
                Brahmaputra: <span className="text-brand-emerald font-semibold">Normal (+0.4m)</span>
              </p>
            </div>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200" title="Offline Demo Mode">
              <Database className="w-3 h-3 text-amber-600" />
              Demo
            </span>
          )}

          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
              title="Report Waterlogging Incident"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}

          <button aria-label="Notifications" className="w-9 h-9 rounded-xl flex items-center justify-center text-brand-ink/70 hover:text-brand-teal hover:bg-brand-sage/10 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-teal ring-2 ring-[#F6FAF8]"></span>
          </button>

          {user ? (
            <div className="flex items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-brand-teal/10 border border-brand-teal/20 text-brand-teal flex items-center justify-center font-bold text-xs">
                {userInitials}
              </div>
              <button
                onClick={handleSignOut}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-brand-ink/50 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-xl bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal/90 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>

      {/* 2. Clean Segmented Mode Switch */}
      {onTabChange && (
        <div className="max-w-md md:max-w-4xl mx-auto px-5 pb-3">
          <div className="bg-brand-ink/5 p-1 rounded-2xl flex items-center gap-1">
            {[
              { id: 'Overview', label: 'Overview' },
              { id: 'Map View', label: 'Map View' },
              { id: 'Flood-Safe Route', label: 'Flood-Safe Route' },
              { id: 'Nowcast', label: 'Nowcast' },
              { id: 'Dispatches', label: 'Dispatches' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 py-1.5 text-[11px] sm:text-xs font-semibold rounded-xl transition-all text-center truncate ${
                  activeTab === tab.id
                    ? 'text-white bg-brand-teal shadow-sm'
                    : 'text-brand-ink/70 hover:text-brand-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
