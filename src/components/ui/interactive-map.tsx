import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Search component
const SearchControl = ({ onSearch }: any) => {
  const [query, setQuery] = useState("");
  const map = useMap();

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      // Using Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latLng: [number, number] = [parseFloat(lat), parseFloat(lon)];
        map.flyTo(latLng, 13);
        onSearch && onSearch({ latLng, name: display_name });
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  useEffect(() => {
    const control = new (L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create("div", "search-control");
        div.innerHTML = `
          <div style="background: white; padding: 8px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.25); display: flex; gap: 5px; color: #0f172a;">
            <input 
              id="search-input" 
              type="text" 
              placeholder="Search places in Dibrugarh..." 
              style="padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 5px; width: 220px; font-size: 12px;"
            />
            <button 
              id="search-btn" 
              style="padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; background: #0284c7; color: white; font-weight: 600; font-size: 12px;"
            >
              🔍
            </button>
          </div>
        `;

        L.DomEvent.disableClickPropagation(div);

        const input = div.querySelector("#search-input") as HTMLInputElement;
        const button = div.querySelector("#search-btn") as HTMLButtonElement;

        if (input) {
          input.addEventListener("input", (e: any) => setQuery(e.target.value));
          input.addEventListener("keypress", (e: any) => {
            if (e.key === "Enter") handleSearch();
          });
        }
        if (button) {
          button.addEventListener("click", handleSearch);
        }

        return div;
      }
    }))({ position: "topleft" });

    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map]);

  return null;
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
            position={searchResult.latLng}
            icon={createCustomIcon("green", "large")}
          >
            <Popup>{searchResult.name}</Popup>
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
