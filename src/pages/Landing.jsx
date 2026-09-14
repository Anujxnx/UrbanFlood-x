import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Cpu, ArrowRight, Layers, Activity } from 'lucide-react';
import { Navbar } from '../components/Navbar/Navbar';
import { AdvancedMap } from '@/components/ui/interactive-map';
import HeroText from '@/components/ui/hero-shutter-text';

export const Landing = () => {
  const [markers] = useState([
    {
      id: 1,
      position: [27.4728, 94.9120], // Lachit Nagar
      color: "orange",
      size: "medium",
      popup: {
        title: "Lachit Nagar (Dibrugarh)",
        content: "Waterlogging Probability: 78% | High Municipal Priority",
        image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80",
      },
    },
    {
      id: 2,
      position: [27.4880, 94.9075], // Graham Bazar
      color: "red",
      size: "large",
      popup: {
        title: "Graham Bazar Corridor",
        content: "CRITICAL RISK (89%) | DTP Trunk Canal Overflow",
        image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80",
      },
    },
    {
      id: 3,
      position: [27.4479, 94.8911], // Dibrugarh University
      color: "green",
      size: "medium",
      popup: {
        title: "Dibrugarh University Campus",
        content: "LOW RISK (22%) | Normal Drainage Flow",
        image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80",
      },
    },
    {
      id: 4,
      position: [27.4812, 94.8985], // Dibrugarh West
      color: "orange",
      size: "medium",
      popup: {
        title: "Dibrugarh West Sector",
        content: "HIGH RISK (68%) | Mankotta Road Accumulation",
      },
    },
    {
      id: 5,
      position: [27.4350, 94.8520], // Barbaruah Chuk
      color: "gold",
      size: "medium",
      popup: {
        title: "Barbaruah Chuk",
        content: "MEDIUM RISK (54%) | Roadside Culvert Debris Monitoring",
      },
    },
    {
      id: 6,
      position: [27.4610, 95.0320], // Panitola
      color: "green",
      size: "medium",
      popup: {
        title: "Panitola Outer Sector",
        content: "LOW RISK (15%) | Normal Elevation & Drainage Flow",
      },
    },
    {
      id: 7,
      position: [27.4795, 94.9180], // Chowkidinghee
      color: "gold",
      size: "medium",
      popup: {
        title: "Chowkidinghee Junction",
        content: "MEDIUM RISK (48%) | Roundabout Drainage Outlet Flow",
      },
    }
  ]);

  const polygons = [
    {
      id: 1,
      positions: [
        [27.4830, 94.9010],
        [27.4930, 94.9010],
        [27.4930, 94.9130],
        [27.4830, 94.9130],
      ],
      style: { color: "#12544F", weight: 2, fillOpacity: 0.25 },
      popup: "Graham Bazar Low-Elevation Zone (Critical Risk)",
    },
  ];

  const circles = [
    {
      id: 1,
      center: [27.4728, 94.9120],
      radius: 500,
      style: { color: "#2A835F", fillOpacity: 0.2 },
      popup: "Lachit Nagar 500m Predicted Runoff Buffer",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6FAF8] text-brand-ink flex flex-col selection:bg-brand-sage/30">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-10 text-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-sage/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          
          {/* Location pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Target Location: Dibrugarh, Assam, India</span>
          </div>

          {/* DYNAMIC SHUTTER HERO TEXT */}
          <div className="w-full my-2">
            <HeroText text="URBAN FLOOD-X" />
          </div>

          <p className="text-xl sm:text-2xl font-bold text-brand-teal tracking-wide uppercase">
            Predict. Prioritize. Respond.
          </p>

          <p className="text-base sm:text-lg text-brand-ink/80 max-w-2xl mx-auto font-medium leading-relaxed">
            AI-powered hyper-local urban waterlogging prediction and drainage response system designed specifically for Dibrugarh.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-sm shadow-xl shadow-brand-teal/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
              data-magnetic
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-brand-sage-light text-brand-ink font-bold text-sm border border-brand-sage/40 shadow-sm transition-all"
              data-magnetic
            >
              Sign In to System
            </Link>
          </div>

        </div>

        {/* HERO INTERACTIVE MAP COMPONENT */}
        <section className="max-w-6xl w-full mx-auto mt-12 mb-8 relative z-10 px-2 sm:px-4">
          <div className="p-4 bg-white border border-brand-sage/30 rounded-3xl shadow-lg backdrop-blur">
            <div className="flex items-center justify-between px-3 py-2 border-b border-brand-sage/20 mb-3 text-left">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-emerald"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-ink">
                  Live Dibrugarh Flood Risk Intelligence Map
                </span>
              </div>
              <span className="text-[11px] text-brand-ink/60 font-medium hidden sm:inline">
                Click pins to explore locality risk profiles
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-brand-sage/30 shadow-inner">
              <AdvancedMap
                center={[27.4728, 94.9120]}
                zoom={13}
                markers={markers}
                polygons={polygons}
                circles={circles}
                enableClustering={true}
                enableSearch={true}
                enableControls={true}
                style={{ height: "480px", width: "100%" }}
              />
            </div>
          </div>
        </section>

        {/* 3 Core Feature Blocks */}
        <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 relative z-10 px-4">
          
          <div className="bg-white border border-brand-sage/30 p-6 rounded-2xl text-left hover:border-brand-teal/40 transition-colors shadow-sm">
            <div className="p-3 bg-brand-teal/10 border border-brand-teal/20 rounded-xl text-brand-teal w-fit mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-ink mb-2">Hyper-local Prediction</h3>
            <p className="text-xs text-brand-ink/70 leading-relaxed">
              Combines rainfall nowcasting, DEM slope indices, drainage discharge capacity, and XGBoost machine learning models down to specific Dibrugarh localities.
            </p>
          </div>

          <div className="bg-white border border-brand-sage/30 p-6 rounded-2xl text-left hover:border-brand-teal/40 transition-colors shadow-sm">
            <div className="p-3 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl text-brand-emerald w-fit mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-ink mb-2">Real-time Risk Mapping</h3>
            <p className="text-xs text-brand-ink/70 leading-relaxed">
              Interactive Leaflet geospatial mapping featuring live layer toggles for risk zones, road corridor vulnerability, drainage blockage points, and crowdsourced reports.
            </p>
          </div>

          <div className="bg-white border border-brand-sage/30 p-6 rounded-2xl text-left hover:border-brand-teal/40 transition-colors shadow-sm">
            <div className="p-3 bg-brand-sage-light border border-brand-sage/30 rounded-xl text-brand-teal w-fit mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-ink mb-2">Smart Response Prioritization</h3>
            <p className="text-xs text-brand-ink/70 leading-relaxed">
              Equips municipal officers and citizens with automated action recommendations, early emergency alerts, and pump deployment prioritization before flooding escalates.
            </p>
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-brand-sage/20 py-6 text-center text-xs text-brand-ink/60">
        <p>HydroCommand AI &copy; 2026 | Built for Dibrugarh Municipal Corporation & Smart Infrastructure</p>
      </footer>
    </div>
  );
};
