import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Car, Map, Route, IndianRupee, Plus, 
  PlusCircle, History, Clock, ArrowRight,
  ChevronRight, CalendarDays, TrendingUp, Trophy,
  CarFront, Bike, Truck, LayoutGrid, Search, Filter, X,
  Eye, EyeOff
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import BookingCalendar from '../components/BookingCalendar';
import UtilizationChart from '../components/UtilizationChart';
import ExpiryAlerts from '../components/ExpiryAlerts';
import VehicleDetails from '../components/VehicleDetails';

const Dashboard = () => {
  const { vehicles, allTrips, bookings } = useContext(AppContext);
  const navigate = useNavigate();

  // Modal State
  const [viewTripData, setViewTripData] = useState(null);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // all, vehicles, bookings
  const [showFinance, setShowFinance] = useState(false);

  // Financial Stats
  const revenueStats = useMemo(() => {
    const totalRevenue = allTrips.reduce((sum, t) => sum + (Number(t.grandTotal) || 0), 0);
    const totalKmCombined = allTrips.reduce((sum, t) => sum + (Number(t.distance) || 0), 0);
    const avgValue = allTrips.length ? totalRevenue / allTrips.length : 0;
    return { totalRevenue, totalKmCombined, avgValue };
  }, [allTrips]);

  // Global Stats
  const totalVehicles = vehicles.length;

  // Recent Trips (Last 5)
  const recentTrips = useMemo(() => {
    return [...allTrips]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [allTrips]);

  // Global Search Logic
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { vehicles: [], bookings: [] };
    const term = searchTerm.toLowerCase();
    
    const filteredVehicles = searchFilter === 'bookings' ? [] : vehicles.filter(v => 
      v.name.toLowerCase().includes(term) || 
      v.numberPlate.toLowerCase().includes(term)
    );
    
    const filteredBookings = searchFilter === 'vehicles' ? [] : bookings.filter(b => 
      b.customerName.toLowerCase().includes(term) || 
      b.customerPhone?.includes(term) ||
      b.vehicleName?.toLowerCase().includes(term)
    );
    
    return { vehicles: filteredVehicles, bookings: filteredBookings };
  }, [searchTerm, searchFilter, vehicles, bookings]);

  // Format Helper
  const formatMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

  const getStats = (vehicleId) => {
    const trips = allTrips.filter(t => t.vehicleId === vehicleId);
    const totalKm = trips.reduce((sum, t) => sum + (Number(t.distance) || 0), 0);
    const totalEarned = trips.reduce((sum, t) => sum + (Number(t.grandTotal) || 0), 0);
    return { count: trips.length, totalKm, totalEarned };
  };

  // Type Icon helper
  const getTypeStyle = (type) => {
    if (type === '2-Wheeler') return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: Bike };
    if (type === 'Heavy Vehicle' || type === '6-Wheeler') return { bg: 'bg-orange-500/10', text: 'text-orange-500', icon: Truck };
    return { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: CarFront };
  };

  return (
    <div className="pb-12 animate-fade-in space-y-6">
      
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight">Dashboard Status</h2>
          <p className="text-sm font-medium text-text-muted">Welcome back. Here's your fleet status today.</p>
        </div>
        <button 
          onClick={() => setShowFinance(!showFinance)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all active:scale-95 ${showFinance ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-card-bg text-text-muted border-border-main hover:border-blue-500 hover:text-blue-500'}`}
        >
          {showFinance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{showFinance ? 'Hide Finance' : 'Show Finance'}</span>
        </button>
      </div>

      {/* SEARCH BAR SECTION */}
      <div className="relative group">
        <div className="bg-card-bg/70 backdrop-blur-md border border-border-main rounded-3xl p-3 shadow-lg shadow-black/5 flex flex-col md:flex-row items-center gap-4 animate-fade-in-down">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search vehicles, number plates, or customers..."
              className="w-full pl-12 pr-4 py-3 bg-main-bg border border-transparent rounded-2xl focus:bg-card-bg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-text-main placeholder:text-text-muted/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                 onClick={() => setSearchTerm('')}
                 className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-border-main hover:bg-main-bg rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-text-muted" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 p-1 bg-main-bg rounded-2xl shrink-0">
             {['all', 'vehicles', 'bookings'].map(f => (
               <button 
                 key={f}
                 onClick={() => setSearchFilter(f)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${searchFilter === f ? 'bg-card-bg text-blue-500 shadow-sm' : 'text-text-muted hover:text-text-main'}`}
               >
                 {f}
               </button>
             ))}
          </div>
        </div>

        {/* SEARCH RESULTS OVERLAY */}
        {searchTerm.trim() && (
          <div className="absolute top-full left-0 right-0 mt-3 z-50 bg-card-bg shadow-2xl rounded-3xl border border-border-main overflow-hidden max-h-[400px] overflow-y-auto animate-slide-up transition-colors duration-300">
            <div className="p-4 border-b border-border-main bg-main-bg/50 transition-colors">
               <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center justify-between">
                 Search Results
                 <span>{searchResults.vehicles.length + searchResults.bookings.length} Found</span>
               </h4>
            </div>
            
            <div className="divide-y divide-border-main">
               {/* Vehicle Results */}
               {searchResults.vehicles.map(v => (
                 <div 
                   key={v.id} 
                   onClick={() => { setViewingVehicle(v); setSearchTerm(''); }}
                   className="p-4 flex items-center gap-4 hover:bg-blue-500/5 transition-colors cursor-pointer group/item"
                 >
                   <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover/item:rotate-6 transition-transform">
                     <Car className="w-5 h-5 text-blue-500" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-text-main">{v.name}</p>
                     <p className="text-[10px] text-text-muted font-mono tracking-tighter uppercase">{v.numberPlate}</p>
                   </div>
                   <div className="ml-auto">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-lg border border-blue-500/20 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">Vehicle</span>
                   </div>
                 </div>
               ))}

               {/* Booking Results */}
               {searchResults.bookings.map(b => (
                 <div 
                   key={b.id} 
                   onClick={() => { navigate('/bookings'); setSearchTerm(''); }}
                   className="p-4 flex items-center gap-4 hover:bg-emerald-500/5 transition-colors cursor-pointer group/item"
                 >
                   <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover/item:rotate-6 transition-transform">
                     <CalendarDays className="w-5 h-5 text-emerald-500" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-text-main">{b.customerName}</p>
                     <p className="text-[10px] text-text-muted font-medium">{b.vehicleName} • {b.bookingStartDate}</p>
                   </div>
                   <div className="ml-auto">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">Booking</span>
                   </div>
                 </div>
               ))}

               {searchResults.vehicles.length === 0 && searchResults.bookings.length === 0 && (
                 <div className="p-12 text-center text-text-muted animate-pulse">
                   <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                   <p className="font-bold text-sm tracking-tight text-text-main">No results found for "{searchTerm}"</p>
                   <p className="text-[10px] uppercase font-black tracking-widest mt-1">Try name, number plate or phone</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1 - HERO STATS (Premium Vehicles Display) */}
      <div className="relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl transition-all hover:shadow-blue-500/10 group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] group-hover:bg-blue-500/30 transition-colors"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Vehicle Operations</span>
            </div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Manage your <span className="text-blue-400">Vehicles</span> from one place.
            </h3>
            <p className="text-slate-400 max-w-md font-medium text-sm">
              You currently have <span className="text-white font-bold">{totalVehicles} active vehicles</span> in your system.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Active Vehicles</span>
              <div className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none flex items-baseline">
                {totalVehicles}
                <span className="text-2xl md:text-3xl text-blue-500 ml-2">V</span>
              </div>
            </div>
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center rotate-6 shadow-xl shadow-blue-500/20 group-hover:rotate-0 transition-transform duration-500">
              <Car className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1.5 - BOOKING CALENDAR */}
      <BookingCalendar vehicles={vehicles} bookings={bookings} />

      {/* PENDING REQUESTS ALERT */}
      {bookings.filter(b => b.status === 'Pending').length > 0 && (
        <div 
          onClick={() => navigate('/bookings?status=Pending')}
          className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-amber-500/15 transition-all animate-pulse-slow"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-500 tracking-tight">Pending Bookings</h3>
              <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest">You have {bookings.filter(b => b.status === 'Pending').length} new booking requests from customers.</p>
            </div>
          </div>
          <button className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/10">
            Review Requests
          </button>
        </div>
      )}

      {/* SECTION 1.6 - FINANCE PANEL (Conditional) */}
      {showFinance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
           <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
              <IndianRupee className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-black tracking-tighter">₹{formatMoney(revenueStats.totalRevenue)}</h3>
              <p className="text-[10px] font-bold mt-2 bg-white/20 inline-block px-2 py-1 rounded">Gross Earnings</p>
           </div>
           
           <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
              <Route className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Fleet Mileage</p>
              <h3 className="text-3xl font-black tracking-tighter">{revenueStats.totalKmCombined} <span className="text-sm">KM</span></h3>
              <p className="text-[10px] font-bold mt-2 bg-white/20 inline-block px-2 py-1 rounded">Combined Distance</p>
           </div>

           <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
              <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Avg. Trip Value</p>
              <h3 className="text-3xl font-black tracking-tighter">₹{formatMoney(revenueStats.avgValue)}</h3>
              <p className="text-[10px] font-bold mt-2 bg-white/20 inline-block px-2 py-1 rounded">Per Recorded Trip</p>
           </div>
        </div>
      )}

      {/* SECTION 1.7 - UTILIZATION CHARTS */}
      <UtilizationChart vehicles={vehicles} allTrips={allTrips} />

      {/* SECTION 1.8 - COMPLIANCE ALERTS */}
      <ExpiryAlerts vehicles={vehicles} onVehicleClick={setViewingVehicle} />

      {/* SECTION 2 - QUICK ACTION BUTTONS */}
      <div className="flex flex-wrap gap-4 pt-4 transition-colors">
        <button onClick={() => navigate('/vehicles')} className="group flex items-center gap-3 bg-card-bg hover:bg-blue-600 text-text-main hover:text-white px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all border border-border-main hover:border-blue-600 active:scale-95">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add New Vehicle
        </button>
        <button onClick={() => navigate('/newtrip')} className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all active:scale-95">
          <PlusCircle className="w-5 h-5" /> Record New Trip
        </button>
        <button onClick={() => navigate('/history')} className="flex items-center gap-3 bg-card-bg hover:bg-main-bg text-text-main border border-border-main px-6 py-3.5 rounded-2xl font-bold shadow-sm transition-all active:scale-95">
          <History className="w-5 h-5" /> Trip History
        </button>
      </div>

      <div className="pt-4">
        <div className="space-y-8">
          
          {/* SECTION 3 - RECENT ACTIVITY TABLE */}
          <div className="bg-card-bg rounded-[2rem] shadow-sm border border-border-main overflow-hidden transition-colors">
            <div className="p-8 border-b border-border-main flex justify-between items-center bg-main-bg/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-text-main tracking-tight">Recent Activity</h3>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-0.5">Last 5 Trips Recorded</p>
                </div>
              </div>
              <Link to="/history" className="px-5 py-2.5 bg-blue-500/10 text-blue-500 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                View All
              </Link>
            </div>
            
            {recentTrips.length === 0 ? (
              <div className="p-20 text-center text-text-muted flex flex-col items-center bg-main-bg/10">
                <History className="w-16 h-16 opacity-10 mb-4" />
                <p className="font-bold">No trips recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="hidden md:table w-full text-sm text-left">
                  <thead className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black bg-main-bg/50 border-b border-border-main">
                    <tr>
                      <th className="px-8 py-5">Vehicle</th>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Route</th>
                      <th className="px-8 py-5 text-right font-black">KM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main">
                    {recentTrips.map(trip => (
                      <tr 
                        key={trip.id} 
                        onClick={() => setViewTripData(trip)}
                        className="hover:bg-blue-500/5 cursor-pointer transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="font-bold text-text-main">{trip.vehicleName}</div>
                          <div className="text-[10px] text-text-muted font-black mt-1 uppercase tracking-tighter opacity-60">{trip.numberPlate}</div>
                        </td>
                        <td className="px-8 py-6 text-text-muted font-bold">
                          {new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-text-main font-medium">
                            <span className="truncate max-w-[120px]">{trip.fromLocation}</span>
                            <ArrowRight className="w-3 h-3 text-text-muted flex-shrink-0" />
                            <span className="truncate max-w-[120px] font-bold text-text-main">{trip.toLocation}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="font-black text-text-main">{trip.distance}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Recent Trips */}
                <div className="md:hidden divide-y divide-border-main px-6">
                  {recentTrips.map(trip => (
                    <div 
                      key={trip.id} 
                      onClick={() => setViewTripData(trip)}
                      className="py-6 active:bg-blue-500/5 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex flex-col">
                            <span className="font-black text-text-main">{trip.vehicleName}</span>
                            <span className="text-[10px] text-text-muted font-black uppercase tracking-tighter">{trip.numberPlate}</span>
                         </div>
                         <span className="text-[10px] font-black text-text-muted bg-main-bg px-3 py-1 rounded-xl uppercase tracking-widest border border-border-main/50">
                           {new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                         </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <span className="truncate">{trip.fromLocation}</span>
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate font-bold text-text-main text-sm">{trip.toLocation}</span>
                        </div>
                        <div className="font-black text-text-main">
                           {trip.distance} <span className="text-[10px] text-text-muted">KM</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4 - FLEET PERFORMANCE CENTER */}
          <div className="bg-card-bg rounded-[2.5rem] shadow-sm border border-border-main overflow-hidden transition-colors">
             <div className="p-8 border-b border-border-main flex justify-between items-center bg-main-bg/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-500/10 rounded-2xl">
                    <LayoutGrid className="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-text-main tracking-tight">Vehicles Overview</h3>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em] mt-1 italic">Real-time Performance Metrics</p>
                  </div>
                </div>
             </div>
             
             <div className="p-5 space-y-4">
               {vehicles.length === 0 ? (
                 <div className="text-center py-12 bg-main-bg rounded-xl border border-dashed border-border-main">
                   <p className="text-text-muted mb-3 font-medium">No vehicles yet. Start by adding a vehicle.</p>
                   <button onClick={() => navigate('/vehicles')} className="text-sm bg-card-bg border border-border-main px-5 py-2.5 font-bold rounded-xl hover:border-blue-500 transition-all shadow-sm text-text-main">
                     Add First Vehicle
                   </button>
                 </div>
               ) : (
                 vehicles.map(v => {
                   const vTrips = allTrips.filter(t => t.vehicleId === v.id);
                   const vTripsSorted = [...vTrips].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                   const lastTrip = vTripsSorted[0];
                   const vKm = vTrips.reduce((sum, t) => sum + (Number(t.distance)||0), 0);
                   
                   const { bg, text, icon: Icon } = getTypeStyle(v.type);

                   return (
                      <div 
                        key={v.id} 
                        onClick={() => setViewingVehicle(v)}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border-main rounded-2xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer group shadow-sm active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                          <div className={`relative w-14 h-14 rounded-xl overflow-hidden border border-border-main shadow-sm grow-0 shrink-0 transition-colors`}>
                            {v.photos?.[0] ? (
                              <img src={v.photos[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${bg} opacity-50`}>
                                <Icon className={`w-6 h-6 ${text}`} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-text-main flex items-center gap-2">
                               {v.name} 
                            </h4>
                            <span className="text-xs font-mono text-text-muted bg-main-bg px-2 py-0.5 rounded mt-1 inline-block border border-border-main/50">{v.numberPlate}</span>
                          </div>
                        </div>
                       
                       <div className="flex-1 max-w-lg md:ml-12 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4 md:mb-0">
                         <div>
                           <span className="text-text-muted text-[10px] font-black uppercase tracking-widest block mb-0.5">Trips</span>
                           <span className="font-bold text-text-main">{vTrips.length}</span>
                         </div>
                         <div>
                           <span className="text-text-muted text-[10px] font-black uppercase tracking-widest block mb-0.5">Total KM</span>
                           <span className="font-bold text-text-main">{vKm}</span>
                         </div>
                         <div>
                           <span className="text-text-muted text-[10px] font-black uppercase tracking-widest block mb-0.5">Last Run</span>
                           <span className="font-bold text-text-main truncate block">
                             {lastTrip ? new Date(lastTrip.date).toLocaleDateString('en-GB',{month:'short', day:'numeric'}) : '-'}
                           </span>
                         </div>
                       </div>

                        <div className="md:ml-4 flex-shrink-0 flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/history?vehicleId=${v.id}`); }}
                            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-blue-500 bg-main-bg hover:bg-blue-500/10 px-4 py-2.5 rounded-xl transition-all border border-border-main/50 hover:border-blue-500/30"
                          >
                            History
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewingVehicle(v); }}
                            className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 hover:bg-blue-600 hover:text-white px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/10"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal for Recent Trips */}
      <ReceiptModal 
        isOpen={!!viewTripData}
        onClose={() => setViewTripData(null)}
        tripData={viewTripData}
        onSave={() => setViewTripData(null)}
        onNewTrip={() => navigate('/newtrip')}
      />

      {/* Vehicle Details Modal */}
      {viewingVehicle && (
        <VehicleDetails 
          vehicle={viewingVehicle} 
          stats={getStats(viewingVehicle.id)} 
          onClose={() => setViewingVehicle(null)} 
        />
      )}

    </div>
  );
};

export default Dashboard;
