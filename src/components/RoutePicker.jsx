import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { createPortal } from 'react-dom';
import debounce from 'lodash.debounce';
import L from 'leaflet';
import { 
  Search, MapPin, X, Navigation, FlipVertical, 
  Check, History, Loader2, Compass, ArrowLeft, Target, 
  IndianRupee, Clock, Layers
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import '../assets/MapStyles.css';

// Kurnool, Andhra Pradesh
const DEFAULT_CENTER = [15.8333, 78.0500];
const INDIA_BBOX = '68.1,8.0,97.4,35.5';

// Cardinal Direction Helper
const getCardinalDirection = (p1, p2) => {
  if (!p1.lat || !p2.lat) return '';
  const lat1 = p1.lat * Math.PI / 180;
  const lat2 = p2.lat * Math.PI / 180;
  const lon1 = p1.lng * Math.PI / 180;
  const lon2 = p2.lng * Math.PI / 180;

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

  const directions = ['Northbound', 'North-Eastbound', 'Eastbound', 'South-Eastbound', 'Southbound', 'South-Westbound', 'Westbound', 'North-Westbound'];
  return directions[Math.round(bearing / 45) % 8];
};

// Layers
const TILE_STREET = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Custom Marker Icons for set points
const createIcon = (color) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(0,0,0,0.4);"></div>`,
  className: 'custom-marker-icon',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const PICKUP_ICON = createIcon('#10b981'); // Emerald
const DROP_ICON = createIcon('#f43f5e'); // Rose/Coral

// Google Maps Style Teardrop Pin (Fixed Center)
const GooglePin = ({ activeField, isMoving }) => {
  const color = activeField === 'pickup' ? '#10b981' : '#f43f5e';
  return (
    <div className="absolute inset-0 pointer-events-none z-[2000] flex items-center justify-center">
      <div className="relative flex flex-col items-center">
        {/* The Teardrop */}
        <div 
          className={`w-12 h-12 rounded-full rounded-bl-none rotate-45 flex items-center justify-center shadow-2xl border-2 border-white transition-all duration-300 ease-out ${isMoving ? '-translate-y-10 scale-110' : '-translate-y-4'}`} 
          style={{ backgroundColor: color }}
        >
           <div className="w-4 h-4 bg-white rounded-full -rotate-45 shadow-inner" />
        </div>
        
        {/* The Shadow */}
        <div className={`w-2 h-2 bg-black/40 rounded-full blur-[1.5px] transition-all duration-300 mt-2 ${isMoving ? 'scale-50 opacity-20' : 'scale-100 opacity-60'}`} />
      </div>
    </div>
  );
};

const MapEventsHandler = ({ onCenterChange, setIsMoving }) => {
  useMapEvents({
    movestart: () => setIsMoving(true),
    moveend: (e) => {
      setIsMoving(false);
      onCenterChange(e.target.getCenter());
    }
  });
  return null;
};

const MapBoundsHandler = ({ pickup, drop }) => {
  const map = useMap();
  useEffect(() => {
    if (pickup?.lat && drop?.lat) {
      const bounds = L.latLngBounds([pickup.lat, pickup.lng], [drop.lat, drop.lng]);
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15 });
    }
  }, [pickup, drop, map]);
  return null;
};

const RoutePicker = ({ isOpen, setIsOpen, onConfirm, initialPickup, initialDrop, ratePerKm = 12, showToast }) => {
  const [pickup, setPickup] = useState(initialPickup || { address: '', lat: null, lng: null });
  const [drop, setDrop] = useState(initialDrop || { address: '', lat: null, lng: null });
  const [activeField, setActiveField] = useState('pickup');
  const [centerAddress, setCenterAddress] = useState('Locating...');
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [mapLayer, setMapLayer] = useState('street'); 
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({ distance: 0, duration: 0, fare: 0, direction: '' });

  const mapRef = useRef(null);

  // Auto-locate on open
  useEffect(() => {
    if (isOpen && !pickup.lat) {
      setTimeout(() => useMyLocation(), 500);
    }
  }, [isOpen]);

  const reverseGeocode = useCallback(
    debounce(async (lat, lng) => {
      try {
        const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
        const data = await res.json();
        const feat = data.features?.[0];
        if (feat) {
          const props = feat.properties;
          const addr = `${props.name || ''}, ${props.city || props.district || props.state || ''}`.replace(/^, /, '');
          setCenterAddress(addr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } else {
          setCenterAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch (err) {
        setCenterAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    }, 400),
    []
  );

  const handleCenterChange = useCallback((center) => {
    reverseGeocode(center.lat, center.lng);
  }, [reverseGeocode]);

  const calculateMetrics = useCallback((p, d) => {
    if (!p.lat || !d.lat) return;
    fetch(`https://router.project-osrm.org/route/v1/driving/${p.lng},${p.lat};${d.lng},${d.lat}?overview=false`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 'Ok') {
          const route = data.routes[0];
          const distKm = (route.distance / 1000).toFixed(1);
          const durMin = Math.round(route.duration / 60);
          setMetrics({ 
            distance: parseFloat(distKm), 
            duration: durMin, 
            fare: Math.round(distKm * ratePerKm),
            direction: getCardinalDirection(p, d)
          });
        }
      }).catch(() => {
        const dist = 0; // Simple fallback could go here
        setMetrics({ distance: 0, duration: 0, fare: 0 });
      });
  }, [ratePerKm]);

  useEffect(() => {
    if (pickup.lat && drop.lat) calculateMetrics(pickup, drop);
  }, [pickup, drop, calculateMetrics]);

  const searchLocations = useCallback(
    debounce(async (val) => {
      if (val.length < 3) return setSuggestions([]);
      setIsLoading(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&bbox=${INDIA_BBOX}&limit=5`;
        const res = await fetch(url);
        setSuggestions((await res.json()).features || []);
      } finally { setIsLoading(false); }
    }, 300),
    []
  );

  const handleSelect = (s) => {
    const loc = {
      address: s.properties.name + (s.properties.city ? ', ' + s.properties.city : ''),
      lat: s.geometry.coordinates[1],
      lng: s.geometry.coordinates[0]
    };
    
    if (activeField === 'pickup') {
      setPickup(loc);
      if (!drop.lat) setActiveField('drop');
      else setActiveField(null);
      showToast?.('Pickup set!', 'success');
    } else {
      setDrop(loc);
      setActiveField(null);
      showToast?.('Drop-off set!', 'success');
    }
    
    setSuggestions([]);
    setQuery('');
    
    if (mapRef.current) {
      mapRef.current.setView([loc.lat, loc.lng], 15);
    }
  };

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          handleCenterChange({ lat: latitude, lng: longitude });
        }
      }, null, { enableHighAccuracy: true });
    }
  };

  const confirmSelectionAtCenter = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const loc = { address: centerAddress, lat: center.lat, lng: center.lng };

    if (activeField === 'pickup') {
      setPickup(loc);
      if (!drop.lat) setActiveField('drop');
      else setActiveField(null);
      showToast?.('Pickup set!', 'success');
    } else {
      setDrop(loc);
      setActiveField(null);
      showToast?.('Drop-off set!', 'success');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-main-bg/95 backdrop-blur-md flex flex-col animate-fade-in overflow-hidden w-screen h-screen" style={{ left: 0, top: 0 }}>
      <div className="flex-1 w-full bg-main-bg flex flex-col relative overflow-hidden h-full">
        
        {/* Floating Google Maps Style Header */}
        <div className="absolute top-4 left-4 right-4 z-[2000] space-y-3">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsOpen(false)} className="w-12 h-12 rounded-full bg-card-bg shadow-xl flex items-center justify-center border border-border-main hover:bg-main-bg transition-all text-text-main">
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
             </button>
             <div className="flex-1 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${activeField === 'pickup' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                   <Search className="w-4 h-4 text-text-muted" />
                </div>
                <input 
                  type="text"
                  placeholder={`Search for your ${activeField || 'location'}...`}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); searchLocations(e.target.value); }}
                  className="w-full h-12 bg-card-bg border border-border-main rounded-full pl-12 pr-4 text-sm font-bold shadow-xl focus:border-blue-500 outline-none transition-all text-text-main"
                />
                {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />}
             </div>
          </div>

          <div className="flex gap-2 justify-center">
             <button onClick={() => setActiveField('pickup')} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all h-10 ${activeField === 'pickup' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-card-bg text-text-muted border-border-main shadow-md'}`}>
                Pick-up
             </button>
             <button onClick={() => setActiveField('drop')} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all h-10 ${activeField === 'drop' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-card-bg text-text-muted border-border-main shadow-md'}`}>
                Drop-off
             </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer 
            center={DEFAULT_CENTER} 
            zoom={13} 
            ref={mapRef}
            scrollWheelZoom={true} 
            zoomControl={false} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url={mapLayer === 'satellite' ? TILE_SATELLITE : TILE_STREET} />
            <MapBoundsHandler pickup={pickup} drop={drop} />
            <MapEventsHandler onCenterChange={handleCenterChange} setIsMoving={setIsMapMoving} />
            
            {/* Compass (North Arrow) */}
            <div className="absolute top-36 left-7 z-[2000] pointer-events-none opacity-50 bg-white/10 rounded-full p-2 backdrop-blur-sm border border-white/10">
               <Compass className="w-5 h-5 text-blue-500 animate-pulse" />
            </div>
            
            {/* Confirmed Markers */}
            {pickup.lat && <Marker position={[pickup.lat, pickup.lng]} icon={PICKUP_ICON} />}
            {drop.lat && <Marker position={[drop.lat, drop.lng]} icon={DROP_ICON} />}
            {pickup.lat && drop.lat && (
              <Polyline positions={[[pickup.lat, pickup.lng], [drop.lat, drop.lng]]} color="#3b82f6" dashArray="8, 12" weight={4} />
            )}

            {/* Suggestions Overlay */}
            {suggestions.length > 0 && (
              <div className="absolute top-32 left-4 right-4 z-[3000] bg-card-bg/95 backdrop-blur-xl border border-border-main rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up max-h-[40vh] overflow-y-auto">
                 {suggestions.map((s, idx) => (
                   <div key={`sug-${idx}`} className="px-6 py-5 hover:bg-main-bg transition-colors cursor-pointer border-b border-border-main/50 flex flex-col group" onClick={() => handleSelect(s)}>
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-main-bg flex items-center justify-center text-text-muted group-hover:bg-blue-500 group-hover:text-white transition-all">
                         <Compass className="w-5 h-5" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="font-bold text-sm text-text-main truncate">{s.properties.name}</p>
                         <p className="text-[10px] text-text-muted uppercase tracking-wider truncate">
                            {s.properties.city || s.properties.state || 'India'}
                         </p>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            )}

            {/* Central Selection Pin */}
            {(activeField || isMapMoving) && <GooglePin activeField={activeField} isMoving={isMapMoving} />}

            {/* Sidebar Controls */}
            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-3 z-[2000]">
               <button onClick={() => setMapLayer(mapLayer === 'satellite' ? 'street' : 'satellite')} className="w-12 h-12 rounded-2xl bg-card-bg shadow-xl flex items-center justify-center border border-border-main hover:text-blue-500 transition-all text-text-main overflow-hidden relative">
                  <Layers className="w-5 h-5" />
                  <span className="absolute bottom-1 right-1 text-[7px] font-black uppercase opacity-50">{mapLayer}</span>
               </button>
               <button onClick={useMyLocation} className="w-12 h-12 rounded-2xl bg-card-bg shadow-xl flex items-center justify-center border border-border-main hover:text-blue-500 transition-all text-text-main">
                  <Target className="w-5 h-5" />
               </button>
            </div>

            {/* Bottom Info Sheet */}
            <div className="absolute bottom-6 left-4 right-4 z-[2000] space-y-4">
               {metrics.distance > 0 && (
                 <div className="bg-card-bg/95 backdrop-blur-xl border border-border-main rounded-[2rem] p-5 shadow-2xl flex items-center justify-between md:px-10 animate-slide-up">
                    <div className="flex items-center gap-8">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Time</span>
                          <span className="text-sm font-black text-text-main">{metrics.duration} min</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Direction</span>
                          <span className="text-[10px] font-black text-text-main truncate max-w-[80px]">{metrics.direction}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Est. Fare</span>
                          <span className="text-lg font-black text-blue-600 flex items-center gap-0.5"><IndianRupee className="w-4 h-4" />{metrics.fare}</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => { onConfirm({ pickup, drop, metrics }); setIsOpen(false); }}
                      className="h-14 px-10 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
                    >
                      Done
                    </button>
                 </div>
               )}

               {activeField && (
                 <div className="bg-card-bg/95 backdrop-blur-xl border border-border-main rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-5 animate-slide-up">
                    <div className="flex items-start gap-4">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${activeField === 'pickup' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
                          {activeField === 'pickup' ? <Navigation className="w-7 h-7 rotate-45" /> : <MapPin className="w-7 h-7" />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                             Confirming {activeField} <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                          </p>
                          <h3 className="text-sm font-black text-text-main line-clamp-2 leading-relaxed">{centerAddress}</h3>
                       </div>
                    </div>
                    <button 
                      onClick={confirmSelectionAtCenter}
                      className={`h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${activeField === 'pickup' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white shadow-rose-600/30'} active:scale-[0.98]`}
                    >
                      Set This As {activeField} <Check className="w-6 h-6" />
                    </button>
                 </div>
               )}
            </div>

          </MapContainer>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RoutePicker;
