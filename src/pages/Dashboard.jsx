import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Car, Map, Route, IndianRupee, Plus, 
  PlusCircle, History, Clock, ArrowRight,
  ChevronRight, CalendarDays, TrendingUp, Trophy,
  CarFront, Bike, Truck
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

const Dashboard = () => {
  const { vehicles, allTrips } = useContext(AppContext);
  const navigate = useNavigate();

  // Modal State
  const [viewTripData, setViewTripData] = useState(null);

  // Global Stats
  const totalVehicles = vehicles.length;
  const totalTrips = allTrips.length;
  const totalKm = useMemo(() => allTrips.reduce((sum, t) => sum + (Number(t.distance)||0), 0), [allTrips]);
  const totalRevenue = useMemo(() => allTrips.reduce((sum, t) => sum + (Number(t.grandTotal)||0), 0), [allTrips]);

  // Recent Trips (Last 5)
  const recentTrips = useMemo(() => {
    return [...allTrips]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [allTrips]);

  // This Month Summary
  const { thisMonthTrips, thisMonthKm, thisMonthRevenue, monthName, mostUsedVehicle } = useMemo(() => {
    const now = new Date();
    const currentMonthStr = now.toISOString().substring(0, 7); // YYYY-MM
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const trips = allTrips.filter(t => t.date && t.date.startsWith(currentMonthStr));
    const km = trips.reduce((sum, t) => sum + (Number(t.distance)||0), 0);
    const revenue = trips.reduce((sum, t) => sum + (Number(t.grandTotal)||0), 0);

    const counts = {};
    trips.forEach(t => {
      counts[t.vehicleId] = (counts[t.vehicleId] || 0) + 1;
    });
    
    let topVid = null;
    let max = 0;
    for (const vid in counts) {
      if (counts[vid] > max) { max = counts[vid]; topVid = vid; }
    }
    const topV = topVid ? vehicles.find(v => v.id === topVid)?.name : 'N/A';

    return { thisMonthTrips: trips.length, thisMonthKm: km, thisMonthRevenue: revenue, monthName, mostUsedVehicle: topV || 'N/A' };
  }, [allTrips, vehicles]);

  // Top Routes
  const topRoutes = useMemo(() => {
    const counts = {};
    allTrips.forEach(t => {
      if (t.fromLocation && t.toLocation) {
        const route = `${t.fromLocation} → ${t.toLocation}`;
        counts[route] = (counts[route] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 3);
  }, [allTrips]);

  // Format Helper
  const formatMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

  // Type Icon helper
  const getTypeStyle = (type) => {
    if (type === '2-Wheeler') return { bg: 'bg-green-100', text: 'text-green-600', icon: Bike };
    if (type === 'Heavy Vehicle' || type === '6-Wheeler') return { bg: 'bg-orange-100', text: 'text-orange-600', icon: Truck };
    return { bg: 'bg-blue-100', text: 'text-blue-600', icon: CarFront };
  };

  return (
    <div className="pb-12 animate-fade-in space-y-6">
      
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-gray-500">Welcome back. Here's what's happening with your fleet today.</p>
        </div>
      </div>

      {/* SECTION 1 - TOP STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-blue-500 p-5 hover:shadow-md transition-shadow group cursor-default">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-semibold mb-1">Total Vehicles</p>
              <h3 className="text-3xl font-bold text-gray-800">{totalVehicles}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Car className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-medium">{totalVehicles > 0 ? `${totalVehicles} Active` : 'No vehicles added'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-emerald-500 p-5 hover:shadow-md transition-shadow group cursor-default">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-semibold mb-1">Total Trips</p>
              <h3 className="text-3xl font-bold text-gray-800">{totalTrips}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <Map className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-medium">{totalTrips > 0 ? `${totalTrips} Recorded` : 'No trips yet'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-orange-500 p-5 hover:shadow-md transition-shadow group cursor-default">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-semibold mb-1">Total KM Driven</p>
              <h3 className="text-3xl font-bold text-gray-800">{formatMoney(totalKm)}</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
              <Route className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-medium">Across all vehicles</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-purple-500 p-5 hover:shadow-md transition-shadow group cursor-default">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-semibold mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-800">₹{formatMoney(totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <IndianRupee className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-medium">All time earnings</p>
        </div>
      </div>

      {/* SECTION 2 - QUICK ACTION BUTTONS */}
      <div className="flex flex-wrap gap-4 pt-2">
        <button onClick={() => navigate('/vehicles')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Add New Vehicle
        </button>
        <button onClick={() => navigate('/newtrip')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
          <PlusCircle className="w-4 h-4" /> Record New Trip
        </button>
        <button onClick={() => navigate('/history')} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
          <History className="w-4 h-4" /> View All History
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
        
        {/* LEFT TWO COLUMNS: Recent Trips & Vehicle Summary */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* SECTION 3 - RECENT TRIPS TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" /> Recent Trips
              </h3>
              <Link to="/history" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {recentTrips.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No trips recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-white border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Vehicle</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Route</th>
                      <th className="px-5 py-3 font-semibold text-right">Distance</th>
                      <th className="px-5 py-3 font-semibold text-right">Amount</th>
                      <th className="px-5 py-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentTrips.map(trip => (
                      <tr 
                        key={trip.id} 
                        onClick={() => setViewTripData(trip)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-800">{trip.vehicleName}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{trip.numberPlate}</div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 font-medium">
                          {new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <span className="truncate max-w-[100px]" title={trip.fromLocation}>{trip.fromLocation}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[100px]" title={trip.toLocation}>{trip.toLocation}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-bold text-gray-700">{trip.distance}</span> <span className="text-xs text-gray-400">km</span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-green-600">
                          ₹{formatMoney(trip.grandTotal)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-bold py-1 px-2.5 rounded-full">
                            Saved
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 4 - PER VEHICLE SUMMARY CARDS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Car className="w-5 h-5 text-gray-400" /> Vehicle Summary
                </h3>
             </div>
             
             <div className="p-5 space-y-4">
               {vehicles.length === 0 ? (
                 <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   <p className="text-gray-500 mb-3">No vehicles yet. Start by adding a vehicle.</p>
                   <button onClick={() => navigate('/vehicles')} className="text-sm bg-white border border-gray-300 px-4 py-2 font-medium rounded-lg hover:border-blue-500 transition-colors shadow-sm">
                     Add First Vehicle
                   </button>
                 </div>
               ) : (
                 vehicles.map(v => {
                   const vTrips = allTrips.filter(t => t.vehicleId === v.id);
                   const vTripsSorted = [...vTrips].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                   const lastTrip = vTripsSorted[0];
                   const vKm = vTrips.reduce((sum, t) => sum + (Number(t.distance)||0), 0);
                   const vEarned = vTrips.reduce((sum, t) => sum + (Number(t.grandTotal)||0), 0);
                   
                   const { bg, text, icon: Icon } = getTypeStyle(v.type);

                   return (
                     <div key={v.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors group">
                       <div className="flex items-center gap-4 mb-4 md:mb-0">
                         <div className={`p-3 rounded-xl ${bg}`}>
                           <Icon className={`w-6 h-6 ${text}`} />
                         </div>
                         <div>
                           <h4 className="font-bold text-gray-800">{v.name}</h4>
                           <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{v.numberPlate}</span>
                         </div>
                       </div>
                       
                       <div className="flex-1 max-w-lg md:ml-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 md:mb-0">
                         <div>
                           <span className="text-gray-400 text-xs block mb-0.5">Trips</span>
                           <span className="font-bold text-gray-700">{vTrips.length}</span>
                         </div>
                         <div>
                           <span className="text-gray-400 text-xs block mb-0.5">Total KM</span>
                           <span className="font-bold text-gray-700">{vKm}</span>
                         </div>
                         <div>
                           <span className="text-gray-400 text-xs block mb-0.5">Earned</span>
                           <span className="font-bold text-green-600">₹{formatMoney(vEarned)}</span>
                         </div>
                         <div>
                           <span className="text-gray-400 text-xs block mb-0.5">Last Run</span>
                           <span className="font-semibold text-gray-800 truncate block">
                             {lastTrip ? new Date(lastTrip.date).toLocaleDateString('en-GB',{month:'short', day:'numeric'}) : '-'}
                           </span>
                         </div>
                       </div>

                       <div className="md:ml-4 flex-shrink-0">
                         <button 
                           onClick={() => navigate(`/history?vehicleId=${v.id}`)}
                           className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors w-full md:w-auto"
                         >
                           View History
                         </button>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: This Month & Top Routes */}
        <div className="space-y-6">
          
          {/* SECTION 5 - THIS MONTH SUMMARY BOX */}
          <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="p-6 relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <CalendarDays className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-lg text-slate-100">This Month</h3>
                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded ml-auto text-blue-300">{monthName}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="text-slate-400 text-xs block mb-1 font-semibold uppercase tracking-wider">Trips</span>
                  <span className="text-2xl font-bold">{thisMonthTrips}</span>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="text-slate-400 text-xs block mb-1 font-semibold uppercase tracking-wider">Distance</span>
                  <span className="text-2xl font-bold text-blue-400">{thisMonthKm} <span className="text-sm">km</span></span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 rounded-xl border border-green-500/20 mb-6">
                 <span className="text-green-200/60 text-xs block mb-1 font-bold uppercase tracking-wider">Revenue This Month</span>
                 <span className="text-4xl font-black text-green-400 tracking-tight">₹{formatMoney(thisMonthRevenue)}</span>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-slate-700/50">
                <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Most used vehicle</span>
                  <span className="font-bold text-slate-200">{mostUsedVehicle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6 - TOP ROUTES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
             <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-400" /> Top Routes
                </h3>
             </div>
             <div className="p-5">
               {topRoutes.length === 0 ? (
                 <p className="text-sm text-gray-500 text-center py-4">Not enough trip data yet.</p>
               ) : (
                 <div className="space-y-3">
                   {topRoutes.map(([route, count], idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                         <span className="font-semibold text-gray-700 text-sm truncate max-w-[180px]" title={route}>{route}</span>
                       </div>
                       <span className="bg-white px-2 py-1 text-xs font-bold text-gray-500 rounded border border-gray-200 shadow-sm whitespace-nowrap">
                         {count} {count === 1 ? 'Trip' : 'Trips'}
                       </span>
                     </div>
                   ))}
                 </div>
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

    </div>
  );
};

export default Dashboard;
