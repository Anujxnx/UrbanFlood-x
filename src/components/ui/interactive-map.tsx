import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdn.21st.dev/assets/mirror/00/00179c4c1ee830d3a108412ae0d294f55776cfeb085c60129a39aa6fc4ae2528.png",
  iconUrl:
    "https://cdn.21st.dev/assets/mirror/57/574c3a5cca85f4114085b6841596d62f00d7c892c7b03f28cbfa301deb1dc437.png",
  shadowUrl:
    "https://cdn.21st.dev/assets/mirror/26/264f5c640339f042dd729062cfc04c17f8ea0f29882b538e3848ed8f10edb4da.png",
});

// Custom marker icons
const createCustomIcon = (color = "blue", size: "small" | "medium" | "large" = "medium") => {
  const sizes: Record<string, [number, number]> = {
    small: [20, 32],
    medium: [25, 41],
    large: [30, 50],
  };

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdn.21st.dev/assets/mirror/26/264f5c640339f042dd729062cfc04c17f8ea0f29882b538e3848ed8f10edb4da.png",
    iconSize: sizes[size] || sizes.medium,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Map event handler component
const MapEvents = ({ onMapClick, onLocationFound }: any) => {
  const map = useMapEvents({
    click: (e) => {
      onMapClick && onMapClick(e.latlng);
    },
    locationfound: (e) => {
      onLocationFound && onLocationFound(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return null;
};

// Custom control component
const CustomControls = ({ onLocate, onToggleLayer, layers }: any) => {
  const map = useMap();

  useEffect(() => {
    const control = new (L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create("div", "custom-controls");
        div.innerHTML = `
          <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.25); color: #0f172a;">
            <button id="locate-btn" style="margin: 2px; padding: 8px; border: none; border-radius: 5px; cursor: pointer; background: #e2e8f0; font-weight: 600; font-size: 12px;">📍 Locate Me</button>
            <button id="satellite-btn" style="margin: 2px; padding: 8px; border: none; border-radius: 5px; cursor: pointer; background: #e2e8f0; font-weight: 600; font-size: 12px;">🛰️ Satellite</button>
            <button id="traffic-btn" style="margin: 2px; padding: 8px; border: none; border-radius: 5px; cursor: pointer; background: #e2e8f0; font-weight: 600; font-size: 12px;">🚦 Traffic</button>
          </div>
        `;

        L.DomEvent.disableClickPropagation(div);

        const locateBtn = div.querySelector("#locate-btn") as HTMLButtonElement;
        const satelliteBtn = div.querySelector("#satellite-btn") as HTMLButtonElement;
        const trafficBtn = div.querySelector("#traffic-btn") as HTMLButtonElement;

        if (locateBtn) locateBtn.onclick = () => onLocate();
        if (satelliteBtn) satelliteBtn.onclick = () => onToggleLayer("satellite");
        if (trafficBtn) trafficBtn.onclick = () => onToggleLayer("traffic");

        return div;
      }
    }))({ position: "topright" });

    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, onLocate, onToggleLayer]);

  return null;
};

// 7 Monitored Dibrugarh Localities with risk information and aliases
interface DibrugarhLocation {
  id: string;
  name: string;
  displayName: string;
  aliases: string[];
  latLng: [number, number];
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  riskProbability: number;
  description: string;
}

const DIBRUGARH_LOCATIONS: DibrugarhLocation[] = [
  {
    id: "loc-1",
    name: "Lachit Nagar",
    displayName: "Lachit Nagar",
    aliases: ["lachit nagar", "lachit", "lachitnagar", "ward 7", "ward 07"],
    latLng: [27.4728, 94.9120],
    riskLevel: "HIGH",
    riskProbability: 78,
    description: "Ward 07 · High Municipal Priority · Trunk drain B3 overflow zone",
  },
  {
    id: "loc-2",
    name: "Dibrugarh West",
    displayName: "Dibrugarh West",
    aliases: ["dibrugarh west", "west dibrugarh", "dibrugarh west sector", "mankotta", "mankotta road"],
    latLng: [27.4812, 94.8985],
    riskLevel: "HIGH",
    riskProbability: 68,
    description: "Mankotta Road Corridor · High Priority · Low-elevation underpass accumulation",
  },
  {
    id: "loc-3",
    name: "Dibrugarh University",
    displayName: "Dibrugarh University",
    aliases: ["dibrugarh university", "du", "university", "du campus", "dibrugarh uni", "nh-37 campus"],
    latLng: [27.4479, 94.8911],
    riskLevel: "LOW",
    riskProbability: 22,
    description: "NH-37 Campus Zone · Routine Monitoring · Normal drainage flow",
  },
  {
    id: "loc-4",
    name: "Barbaruah Chuk",
    displayName: "Barbaruah Chuk",
    aliases: ["barbaruah chuk", "barbaruah", "barbarua chuk", "barbarua"],
    latLng: [27.4350, 94.8520],
    riskLevel: "MEDIUM",
    riskProbability: 54,
    description: "Southwest Sector · Roadside culvert debris monitoring & moderate runoff",
  },
  {
    id: "loc-5",
    name: "Panitola",
    displayName: "Panitola",
    aliases: ["panitola", "panitola town", "panitola chuk"],
    latLng: [27.4610, 95.0320],
    riskLevel: "LOW",
    riskProbability: 15,
    description: "East Dibrugarh Outer Sector · Clear drainage conditions & adequate gradient",
  },
  {
    id: "loc-6",
    name: "Chowkidinghee",
    displayName: "Chowkidinghee",
    aliases: ["chowkidinghee", "chowkidingi", "chowkidingee", "chowki dinghee", "chowkidinghi", "chowkidinghee field"],
    latLng: [27.4795, 94.9180],
    riskLevel: "MEDIUM",
    riskProbability: 48,
    description: "Central Bus Station / Field · Roundabout drainage outlet monitoring",
  },
  {
    id: "loc-7",
    name: "Gram Bazar",
    displayName: "Gram Bazar (Graham Bazar)",
    aliases: ["gram bazar", "graham bazar", "grambazar", "grahambazar", "gram bazaar", "graham bazaar", "bazar", "dtp trunk canal"],
    latLng: [27.4880, 94.9075],
    riskLevel: "CRITICAL",
    riskProbability: 89,
    description: "Low-Elevation Zone · DTP Trunk Canal Overflow · Critical Flood Risk",
  },
];

// Custom highlighted marker for searched Dibrugarh place
const createSearchResultIcon = (riskLevel = "HIGH") => {
  let badgeColor = "#2A835F"; // emerald / low
  if (riskLevel === "CRITICAL") badgeColor = "#ef4444";
  else if (riskLevel === "HIGH") badgeColor = "#f97316";
  else if (riskLevel === "MEDIUM") badgeColor = "#eab308";

  const svg = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="position: absolute; top: -6px; width: 36px; height: 36px; border-radius: 50%; background: ${badgeColor}; opacity: 0.4; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; z-index: 10; width: 34px; height: 34px; border-radius: 50%; background: #092328; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${badgeColor}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
        </svg>
      </div>
      <div style="margin-top: 3px; background: rgba(9, 35, 40, 0.95); color: #ffffff; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.4); white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-family: sans-serif;">
        📍 Selected
      </div>
    </div>
  `;

  return L.divIcon({
    className: "custom-search-marker",
    html: svg,
    iconSize: [80, 58],
    iconAnchor: [40, 19],
    popupAnchor: [0, -22],
  });
};

// Interactive Search Control Widget with autocomplete, keyboard navigation, and friendly fallback
const SearchBox: React.FC<{
  map: L.Map;
  onSearch: (result: any) => void;
}> = ({ map, onSearch }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DibrugarhLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setErrorMessage(null);

    if (!val.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const qLower = val.toLowerCase().trim();
    const qNorm = normalize(val);

    const matches = DIBRUGARH_LOCATIONS.filter((loc) => {
      if (loc.name.toLowerCase().includes(qLower)) return true;
      if (loc.displayName.toLowerCase().includes(qLower)) return true;
      if (normalize(loc.name).includes(qNorm)) return true;
      return loc.aliases.some(
        (alias) =>
          alias.toLowerCase().includes(qLower) || normalize(alias).includes(qNorm)
      );
    });

    setSuggestions(matches);
    setIsOpen(matches.length > 0);
    setSelectedIndex(-1);
  };

  const selectLocation = (loc: DibrugarhLocation) => {
    setQuery(loc.name);
    setSuggestions([]);
    setIsOpen(false);
    setErrorMessage(null);
    setSelectedIndex(-1);

    // Smoothly pan and zoom map to the selected Dibrugarh location
    map.flyTo(loc.latLng, 15, {
      animate: true,
      duration: 1.5,
    });

    onSearch({
      latLng: loc.latLng,
      name: loc.name,
      location: loc,
    });
  };

  const executeSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      selectLocation(suggestions[selectedIndex]);
      return;
    }

    if (suggestions.length > 0) {
      selectLocation(suggestions[0]);
      return;
    }

    const qLower = trimmed.toLowerCase();
    const qNorm = normalize(trimmed);
    const directMatch = DIBRUGARH_LOCATIONS.find(
      (loc) =>
        loc.name.toLowerCase() === qLower ||
        normalize(loc.name) === qNorm ||
        loc.aliases.some(
          (a) => a.toLowerCase() === qLower || normalize(a) === qNorm
        )
    );

    if (directMatch) {
      selectLocation(directMatch);
      return;
    }

    // Show friendly location not found message
    setIsOpen(false);
    setErrorMessage(`Location "${trimmed}" not found in Dibrugarh flood zones.`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        setIsOpen(true);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        setIsOpen(true);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeSearch();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative select-none font-sans"
      style={{ minWidth: "270px", maxWidth: "340px" }}
    >
      {/* Search Input Bar */}
      <div
        className="flex items-center gap-1.5 bg-white p-1.5 pl-2.5 rounded-xl border border-slate-300 shadow-md text-slate-800"
      >
        <span className="text-slate-400 text-sm">📍</span>
        <input
          ref={inputRef}
          id="dibrugarh-map-search-input"
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search places in Dibrugarh..."
          className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium py-1"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setIsOpen(false);
              setErrorMessage(null);
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors text-xs"
            title="Clear search"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          onClick={executeSearch}
          className="px-2.5 py-1.5 bg-brand-teal hover:bg-brand-teal/90 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer"
          title="Search Dibrugarh"
          id="dibrugarh-map-search-btn"
        >
          🔍
        </button>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-[1100] max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Dibrugarh Locations ({suggestions.length})</span>
            <span>Click to Locate</span>
          </div>
          {suggestions.map((loc, idx) => {
            const isSelected = idx === selectedIndex;
            const badgeBg =
              loc.riskLevel === "CRITICAL"
                ? "bg-red-500 text-white"
                : loc.riskLevel === "HIGH"
                ? "bg-orange-500 text-white"
                : loc.riskLevel === "MEDIUM"
                ? "bg-amber-500 text-white"
                : "bg-emerald-600 text-white";

            return (
              <div
                key={loc.id}
                onClick={() => selectLocation(loc)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-3 py-2 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 flex items-center justify-between gap-2 ${
                  isSelected ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {loc.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {loc.description.split("·")[0]}
                  </span>
                </div>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap ${badgeBg}`}>
                  {loc.riskLevel} {loc.riskProbability}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Friendly "Location not found" Notification */}
      {errorMessage && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white p-3 rounded-xl border border-amber-300 shadow-xl z-[1100] text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
            <span>⚠️</span>
            <span>Location not found in Dibrugarh</span>
          </div>
          <p className="text-[11px] text-slate-600 mb-2 leading-tight">
            Please search for one of the primary monitored flood zones:
          </p>
          <div className="flex flex-wrap gap-1">
            {DIBRUGARH_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => selectLocation(loc)}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-brand-teal/10 hover:text-brand-teal text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Search component mounted into Leaflet control container with event isolation
const SearchControl = ({ onSearch }: any) => {
  const map = useMap();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const control = new (L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create("div", "dibrugarh-search-control");
        // Disable Leaflet's map dragging and clicks while interacting with the search widget
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        return div;
      },
    }))({ position: "topleft" });

    control.addTo(map);
    setContainer(control.getContainer() || null);

    return () => {
      control.remove();
    };
  }, [map]);

  if (!container) return null;

  return createPortal(<SearchBox map={map} onSearch={onSearch} />, container);
};

export interface AdvancedMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: any[];
  polygons?: any[];
  circles?: any[];
  polylines?: any[];
  onMarkerClick?: (marker: any) => void;
  onMapClick?: (latlng: any) => void;
  enableClustering?: boolean;
  enableSearch?: boolean;
  enableControls?: boolean;
  enableDrawing?: boolean;
  mapLayers?: {
    openstreetmap?: boolean;
    satellite?: boolean;
    traffic?: boolean;
  };
  className?: string;
  style?: React.CSSProperties;
}

// Main AdvancedMap component
export const AdvancedMap: React.FC<AdvancedMapProps> = ({
  center = [27.4728, 94.9120], // Default center to Dibrugarh, Assam
  zoom = 13,
  markers = [],
  polygons = [],
  circles = [],
  polylines = [],
  onMarkerClick,
  onMapClick,
  enableClustering = true,
  enableSearch = true,
  enableControls = true,
  enableDrawing = false,
  mapLayers = {
    openstreetmap: true,
    satellite: false,
    traffic: false,
  },
  className = "",
  style = { height: "500px", width: "100%" },
}) => {
  const [currentLayers, setCurrentLayers] = useState(mapLayers);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [clickedLocation, setClickedLocation] = useState<any>(null);

  // Handle layer toggling
  const handleToggleLayer = useCallback((layerType: string) => {
    setCurrentLayers((prev: any) => ({
      ...prev,
      [layerType]: !prev[layerType],
    }));
  }, []);

  // Handle geolocation
  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
      );
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback(
    (latlng: any) => {
      setClickedLocation(latlng);
      onMapClick && onMapClick(latlng);
    },
    [onMapClick],
  );

  // Handle search results
  const handleSearch = useCallback((result: any) => {
    setSearchResult(result);
  }, []);

  return (
    <div className={`advanced-map ${className}`} style={style}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        {/* Base tile layers */}
        {currentLayers.openstreetmap && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {currentLayers.satellite && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* Map events */}
        <MapEvents
          onMapClick={handleMapClick}
          onLocationFound={setUserLocation}
        />

        {/* Search control */}
        {enableSearch && <SearchControl onSearch={handleSearch} />}

        {/* Custom controls */}
        {enableControls && (
          <CustomControls
            onLocate={handleLocate}
            onToggleLayer={handleToggleLayer}
            layers={currentLayers}
          />
        )}

        {/* Markers with clustering */}
        {enableClustering ? (
          <MarkerClusterGroup>
            {markers.map((marker, index) => (
              <Marker
                key={marker.id || index}
                position={marker.position}
                icon={
                  marker.icon || createCustomIcon(marker.color, marker.size)
                }
                eventHandlers={{
                  click: () => onMarkerClick && onMarkerClick(marker),
                }}
              >
                {marker.popup && (
                  <Popup>
                    <div className="p-1 text-slate-900 font-sans text-xs">
                      <h3 className="font-bold text-sm text-slate-900">{marker.popup.title}</h3>
                      <p className="text-slate-600 mt-1">{marker.popup.content}</p>
                      {marker.popup.image && (
                        <img
                          src={marker.popup.image}
                          alt={marker.popup.title}
                          className="mt-2 rounded-lg max-w-full h-auto shadow-md"
                        />
                      )}
                    </div>
                  </Popup>
                )}
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          markers.map((marker, index) => (
            <Marker
              key={marker.id || index}
              position={marker.position}
              icon={marker.icon || createCustomIcon(marker.color, marker.size)}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(marker),
              }}
            >
              {marker.popup && (
                <Popup>
                  <div className="p-1 text-slate-900 font-sans text-xs">
                    <h3 className="font-bold text-sm text-slate-900">{marker.popup.title}</h3>
                    <p className="text-slate-600 mt-1">{marker.popup.content}</p>
                  </div>
                </Popup>
              )}
            </Marker>
          ))
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={createCustomIcon("red", "medium")}
          >
            <Popup>Your current location</Popup>
          </Marker>
        )}

        {/* Search result marker */}
        {searchResult && (
          <Marker
            key={`search-${searchResult.name}-${searchResult.latLng[0]}-${searchResult.latLng[1]}`}
            position={searchResult.latLng}
            icon={createSearchResultIcon(searchResult.location?.riskLevel)}
            ref={(markerRef: any) => {
              if (markerRef) {
                setTimeout(() => {
                  try {
                    markerRef.openPopup();
                  } catch (e) {
                    // Ignore if map unmounted
                  }
                }, 350);
              }
            }}
          >
            <Popup autoClose={false} closeOnClick={false}>
              <div className="p-1 font-sans min-w-[210px] text-slate-900">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1">
                    📍 {searchResult.name}
                  </h3>
                  {searchResult.location && (
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white"
                      style={{
                        backgroundColor:
                          searchResult.location.riskLevel === "CRITICAL"
                            ? "#ef4444"
                            : searchResult.location.riskLevel === "HIGH"
                            ? "#f97316"
                            : searchResult.location.riskLevel === "MEDIUM"
                            ? "#eab308"
                            : "#2A835F",
                      }}
                    >
                      {searchResult.location.riskLevel} ({searchResult.location.riskProbability}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  {searchResult.location?.description ||
                    `Coordinates: ${searchResult.latLng[0].toFixed(4)}, ${searchResult.latLng[1].toFixed(4)}`}
                </p>
                <div className="mt-2 text-[10px] text-brand-teal font-semibold flex items-center gap-1">
                  <span>✓</span> Located via Dibrugarh Flood Risk Intelligence
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Clicked location marker */}
        {clickedLocation && (
          <Marker
            position={[clickedLocation.lat, clickedLocation.lng]}
            icon={createCustomIcon("orange", "small")}
          >
            <Popup>
              Lat: {clickedLocation.lat.toFixed(6)}
              <br />
              Lng: {clickedLocation.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}

        {/* Polygons */}
        {polygons.map((polygon, index) => (
          <Polygon
            key={polygon.id || index}
            positions={polygon.positions}
            pathOptions={
              polygon.style || { color: "purple", weight: 2, fillOpacity: 0.3 }
            }
          >
            {polygon.popup && <Popup>{polygon.popup}</Popup>}
          </Polygon>
        ))}

        {/* Circles */}
        {circles.map((circle, index) => (
          <Circle
            key={circle.id || index}
            center={circle.center}
            radius={circle.radius}
            pathOptions={
              circle.style || { color: "blue", weight: 2, fillOpacity: 0.2 }
            }
          >
            {circle.popup && <Popup>{circle.popup}</Popup>}
          </Circle>
        ))}

        {/* Polylines */}
        {polylines.map((polyline, index) => (
          <Polyline
            key={polyline.id || index}
            positions={polyline.positions}
            pathOptions={polyline.style || { color: "red", weight: 3 }}
          >
            {polyline.popup && <Popup>{polyline.popup}</Popup>}
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
};

export default AdvancedMap;
