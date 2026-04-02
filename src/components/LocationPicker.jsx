import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import debounce from 'lodash.debounce';
import L from 'leaflet';
import { Search, MapPin, X, Navigation } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import '../assets/MapStyles.css';

// Kurnool, Andhra Pradesh
const DEFAULT_CENTER = [15.8333, 78.0500];
const DEFAULT_ZOOM = 13;

// Fix Leaflet Marker Icon issue in React/Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Internal component to handle map movement/center update
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Component to handle marker dragging
const DraggableMarker = ({ position, onPositionChange }) => {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onPositionChange(latLng.lat.toFixed(6), latLng.lng.toFixed(6));
        }
      },
    }),
    [onPositionChange],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
};

// Main Location Picker Component
const LocationPicker = ({ label, value, onChange, placeholder }) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync query with value prop (for initial load)
  useEffect(() => {
    if (value && !query) setQuery(value);
  }, [value, query]);

  // Photon API search
  const fetchSuggestions = useCallback(
    debounce(async (searchValue) => {
      if (!searchValue || searchValue.length < 3) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        // Bias search towards Kurnool area for better local results
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchValue)}&lat=15.8333&lon=78.0500&limit=5`;
        const response = await fetch(url);
        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    fetchSuggestions(val);
    onChange(val); // Update parent state with manual text
  };

  const handleSelectSuggestion = (suggestion) => {
    const [lon, lat] = suggestion.geometry.coordinates;
    const name = suggestion.properties.name || suggestion.properties.city || 'Selected Location';
    const city = suggestion.properties.city ? `, ${suggestion.properties.city}` : '';
    const fullAddress = `${name}${city}`;
    
    setQuery(fullAddress);
    setSuggestions([]);
    setCenter([lat, lon]);
    setShowMap(true);
    onChange(fullAddress, lat, lon); // Send text and coordinates to parent
  };

  const handleMapClick = (lat, lng) => {
    setCenter([lat, lng]);
    // Reverse geocoding (simple approach: just update text to "Pinned location")
    // For a better user experience, we could use another Photon request for reverse geocoding if needed
    onChange(query || 'Pinned location', lat, lng);
  };

  const tileUrl = isDark 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" /> {label}
        </label>
        
        <div className="relative group/search">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLoading ? 'animate-spin text-blue-500' : 'text-text-muted'} transition-colors duration-300`} />
            <input 
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setShowMap(true)}
              placeholder={placeholder || "Search for a street, area in Kurnool..."}
              className="w-full bg-main-bg border border-border-main rounded-2xl py-4 pl-12 pr-12 text-text-main font-medium focus:border-blue-500 outline-none transition-all shadow-sm"
            />
            {query && (
              <button 
                onClick={() => { setQuery(''); setSuggestions([]); onChange(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-border-main/50 rounded-xl transition-all"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <div className="map-search-results animate-fade-in">
              {suggestions.map((s, idx) => (
                <div 
                  key={idx} 
                  className="map-search-item"
                  onClick={() => handleSelectSuggestion(s)}
                >
                  <p className="font-bold">{s.properties.name}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    {s.properties.street ? `${s.properties.street}, ` : ''}{s.properties.city || s.properties.state || ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showMap && (
        <div className={`map-picker-container shadow-2xl animate-scale-up ${isDark ? 'dark-map' : ''}`}>
          <MapContainer center={center} zoom={DEFAULT_ZOOM} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <ChangeView center={center} zoom={DEFAULT_ZOOM} />
            <TileLayer attribution={attribution} url={tileUrl} />
            <DraggableMarker 
              position={center} 
              onPositionChange={(lat, lon) => {
                setCenter([lat, lon]);
                onChange(query, lat, lon);
              }} 
            />
            <div className="absolute bottom-4 left-4 z-[1000]">
              <div className="px-3 py-1.5 bg-card-bg border border-border-main rounded-xl flex items-center gap-2 shadow-lg scale-90 md:scale-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted">Live Kurnool Map</span>
              </div>
            </div>
          </MapContainer>
        </div>
      )}
      
      {!showMap && (
        <button 
          type="button"
          onClick={() => setShowMap(true)}
          className="w-full py-3 border border-dashed border-border-main rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
        >
          <Navigation className="w-4 h-4" /> Open Interactive Map selector
        </button>
      )}
    </div>
  );
};

export default LocationPicker;
