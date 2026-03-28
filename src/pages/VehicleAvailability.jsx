import { AppContext } from '../context/AppContext';
import { Car, Fuel, Users, Wind, CheckCircle2, XCircle, Search, Filter, IndianRupee, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import VehicleDetails from '../components/VehicleDetails';

const VehicleCard = ({ vehicle, stats }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && vehicle.photos && vehicle.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % vehicle.photos.length);
    } else if (isRightSwipe && vehicle.photos && vehicle.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + vehicle.photos.length) % vehicle.photos.length);
    }
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    if (!vehicle.photos || vehicle.photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % vehicle.photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    if (!vehicle.photos || vehicle.photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + vehicle.photos.length) % vehicle.photos.length);
  };

  return (
    <div className="bg-card-bg border border-border-main rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col">
      {/* Vehicle Photo Slider */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative h-64 overflow-hidden cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        {vehicle.photos && vehicle.photos.length > 0 ? (
          <>
            <img 
              src={vehicle.photos[currentPhotoIndex]} 
              alt={`${vehicle.name} - ${currentPhotoIndex + 1}`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none pointer-events-none" 
            />
            
            {vehicle.photos.length > 1 && (
              <>
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 z-10">
                  {vehicle.photos.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1 rounded-full transition-all duration-300 ${idx === currentPhotoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                    ></div>
                  ))}
                </div>
                
                <button 
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-main-bg flex items-center justify-center">
            <Car className="w-12 h-12 text-text-muted opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card-bg via-transparent to-transparent opacity-60 pointer-events-none"></div>
        
        {/* Photo Count Tag */}
        {vehicle.photos && vehicle.photos.length > 0 && (
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
              {currentPhotoIndex + 1} / {vehicle.photos.length}
            </div>
          </div>
        )}

        {/* DETAILS OVERLAY */}
        <div 
          onClick={(e) => { e.stopPropagation(); setShowDetails(true); }}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl transform scale-50 group-hover:scale-100 transition-transform duration-500">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="p-8 pb-0">
        <div className="flex items-start justify-between mb-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-black tracking-tight group-hover:text-blue-500 transition-colors">{vehicle.name}</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted p-1 px-2 border border-border-main rounded-lg w-fit">
              {vehicle.numberPlate}
            </span>
          </div>
          <div className={`p-1 px-3 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
            vehicle.status === 'Available' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
          }`}>
            {vehicle.status === 'Available' ? (
              <><CheckCircle2 className="w-3 h-3" /> Available</>
            ) : (
              <><XCircle className="w-3 h-3" /> On Trip</>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-3 bg-main-bg/50 p-3 rounded-2xl border border-border-main">
            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Capacity</span>
              <span className="text-sm font-black">{vehicle.capacity} Seats</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-main-bg/50 p-3 rounded-2xl border border-border-main">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Wind className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">AC Status</span>
              <span className="text-sm font-black">{vehicle.hasAC ? 'Air Conditioned' : 'Non-AC'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-main-bg/50 p-3 rounded-2xl border border-border-main">
            <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Fuel className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Fuel Type</span>
              <span className="text-sm font-black">{vehicle.type}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-main-bg/50 p-3 rounded-2xl border border-border-main">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Rate/KM</span>
              <span className="text-sm font-black">₹{vehicle.ratePerKm}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-8 pt-0">
        <div className="flex flex-col p-6 bg-main-bg/50 rounded-3xl border border-border-main gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">
                  {vehicle.hasAC ? 'Non-AC Rate' : 'Standard Rate'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black tracking-tighter text-text-main">₹{vehicle.ratePerDay}</span>
                  <span className="text-xs text-text-muted font-bold uppercase tracking-widest">/day</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Overage</span>
                <div className="text-sm font-bold text-text-main mt-1">₹{vehicle.ratePerKm}/km</div>
              </div>
            </div>

            {vehicle.hasAC && (
              <div className="flex items-center justify-between pt-4 border-t border-border-main/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1">
                    <Wind className="w-3 h-3" /> With AC Rate
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black tracking-tighter text-blue-500">₹{vehicle.ratePerDayAC}</span>
                    <span className="text-xs text-text-muted font-bold uppercase tracking-widest">/day</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Overage</span>
                  <div className="text-sm font-bold text-text-main mt-1">₹{vehicle.ratePerKmAC}/km</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setShowDetails(true)}
              className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-main-bg text-text-main border border-border-main hover:bg-card-bg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Info className="w-4 h-4 text-blue-500" /> Details
            </button>
            <button 
              disabled={vehicle.status !== 'Available'}
              onClick={() => window.location.hash = `#/new-booking?vehicleId=${vehicle.id}`}
              className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                vehicle.status === 'Available' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/10 active:scale-95' 
                  : 'bg-card-bg text-text-muted border border-border-main cursor-not-allowed opacity-50'
              }`}
            >
              <IndianRupee className="w-4 h-4" /> Book Now
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <VehicleDetails 
          vehicle={vehicle} 
          stats={stats}
          isAdmin={false}
          onClose={() => setShowDetails(false)} 
        />
      )}
    </div>
  );
};

const VehicleAvailability = () => {
  const { vehicles, allTrips } = useContext(AppContext);
  
  const getStats = (vehicleId) => {
    const trips = (allTrips || []).filter(t => t.vehicleId === vehicleId);
    const totalKm = trips.reduce((sum, t) => sum + (Number(t.distance) || 0), 0);
    const totalEarned = trips.reduce((sum, t) => sum + (Number(t.grandTotal) || 0), 0);
    return { count: trips.length, totalKm, totalEarned };
  };

  const [filter, setFilter] = useState('All'); // 'All' or 'Available'
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = vehicles.filter(v => {
    const matchesFilter = filter === 'All' || v.status === 'Available';
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.numberPlate.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in text-text-main">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight">Vehicle <span className="text-blue-600">Availability</span></h1>
          <p className="text-text-muted font-medium text-sm">Explore our fleet and find the perfect ride for your trip.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search vehicle name or plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-card-bg border border-border-main rounded-2xl py-3 pl-12 pr-4 text-text-main font-medium focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex bg-main-bg/50 p-1.5 rounded-2xl border border-border-main">
            <button 
              onClick={() => setFilter('All')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'All' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-text-muted hover:text-text-main'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('Available')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'Available' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-text-muted hover:text-text-main'}`}
            >
              Available
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} stats={getStats(vehicle.id)} />
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="bg-card-bg border border-border-main rounded-[2.5rem] p-20 text-center">
          <div className="w-20 h-20 bg-main-bg rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Car className="w-10 h-10 text-text-muted opacity-40" />
          </div>
          <h3 className="text-2xl font-black tracking-tight mb-2">No vehicles found</h3>
          <p className="text-text-muted font-medium">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

export default VehicleAvailability;
