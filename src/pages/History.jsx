import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Search, Filter, Calendar, MapPin, 
  Trash2, Edit, Eye, Download, ChevronLeft, 
  ChevronRight, ArrowRight, Route, X
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import ReceiptModal from '../components/ReceiptModal';
import { exportTripsAsCSV } from '../utils/storage';
import { usePasswordProtection } from '../hooks/usePasswordProtection';

const History = () => {
  const formatMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

  const { allTrips, vehicles, deleteTrip } = useContext(AppContext);
  const { requirePassword } = usePasswordProtection();
  const location = useLocation();
  const navigate = useNavigate();

  // Filters State
  const [vehicleId, setVehicleId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Latest First');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View Receipt State
  const [viewTripData, setViewTripData] = useState(null);

  // Handle URL Param for auto-selecting vehicle
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const vId = params.get('vehicleId');
    if (vId) {
      setVehicleId(vId);
    }
  }, [location.search]);

  // Derived / Filtered Data
  const filteredTrips = useMemo(() => {
    let result = [...allTrips];

    if (vehicleId) {
      result = result.filter(t => t.vehicleId === vehicleId);
    }
    
    if (fromDate) {
      result = result.filter(t => new Date(t.date) >= new Date(fromDate));
    }
    
    if (toDate) {
      result = result.filter(t => new Date(t.date) <= new Date(toDate));
    }
    
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.fromLocation || '').toLowerCase().includes(lowerQ) || 
        (t.toLocation || '').toLowerCase().includes(lowerQ) ||
        (t.from || '').toLowerCase().includes(lowerQ) || 
        (t.to || '').toLowerCase().includes(lowerQ) ||
        (t.vehicleName || '').toLowerCase().includes(lowerQ) ||
        (t.numberPlate || '').toLowerCase().includes(lowerQ) ||
        (t.customerName || '').toLowerCase().includes(lowerQ) ||
        (t.receiptNumber || '').toLowerCase().includes(lowerQ)
      );
    }

    switch (sortBy) {
      case 'Oldest First':
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'Highest Amount':
        result.sort((a, b) => b.grandTotal - a.grandTotal);
        break;
      case 'Lowest Amount':
        result.sort((a, b) => a.grandTotal - b.grandTotal);
        break;
      case 'Longest Distance':
        result.sort((a, b) => b.distance - a.distance);
        break;
      case 'Latest First':
      default:
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
    }

    return result;
  }, [allTrips, vehicleId, fromDate, toDate, searchQuery, sortBy]);

  // Totals
  const totals = useMemo(() => {
    return filteredTrips.reduce((acc, t) => {
      acc.distance += (t.distance || 0);
      acc.petrol += (t.litresFilled || 0);
      acc.toll += (t.tollTax || 0);
      acc.border += (t.borderTax || 0);
      acc.revenue += (t.grandTotal || 0);
      return acc;
    }, { distance: 0, petrol: 0, toll: 0, border: 0, revenue: 0 });
  }, [filteredTrips]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const currentTrips = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrips.slice(start, start + itemsPerPage);
  }, [filteredTrips, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearDates = () => {
    setFromDate('');
    setToDate('');
  };

  const handleExportCSV = () => {
    exportTripsAsCSV(filteredTrips);
  };

  const handleEdit = async (trip) => {
    const ok = await requirePassword({ actionType: "editTrip", actionLabel: "EDIT trip from " + trip.from + " to " + trip.to });
    if (ok) navigate('/newtrip', { state: { editTripData: trip } });
  };

  const confirmDelete = async (trip) => {
    const from = trip.from || trip.fromLocation || 'Unknown';
    const to = trip.to || trip.toLocation || 'Unknown';
    const ok = await requirePassword({ actionType: "deleteTrip", actionLabel: "DELETE trip from " + from + " to " + to });
    if (ok) await deleteTrip(trip.id);
  };

  // Date Formatting Helper
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    
    const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-text-main">{formatted}</span>
        {isToday && <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase rounded w-fit mt-1">Today</span>}
      </div>
    );
  };

  return (
    <div className="w-full pb-12 animate-fade-in relative">

      
      {/* FILTER BAR */}
      <div className="bg-card-bg p-3 sm:p-4 rounded-xl shadow-sm border border-border-main mb-6 z-20">

        <div className="flex flex-wrap lg:flex-nowrap gap-3 sm:gap-4 justify-between items-center text-text-main">
          <div className="flex flex-wrap md:flex-nowrap gap-3 sm:gap-4 flex-grow items-center w-full md:w-auto">


            {/* Vehicle Select */}
            <select 
              value={vehicleId} 
              onChange={(e) => setVehicleId(e.target.value)}
              className="px-4 py-2 border border-border-main bg-main-bg rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:min-w-[200px] md:w-auto text-text-main"
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} — {v.numberPlate}</option>)}
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2 border border-border-main rounded-lg pr-2 bg-main-bg w-full sm:w-auto flex-shrink-0">
               <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none rounded-l-lg border-r border-border-main min-w-0 text-text-main" title="From Date" />
               <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none min-w-0 text-text-main" title="To Date" />
               <button onClick={clearDates} className="text-text-muted hover:text-red-500 px-2 text-xs font-semibold" title="Clear Dates">X</button>
            </div>
            
            {/* Search */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search locations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-border-main bg-main-bg text-text-main rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-text-muted hover:text-text-main">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-border-main bg-main-bg text-text-main rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full md:w-auto flex-shrink-0"
            >
              <option>Latest First</option>
              <option>Oldest First</option>
              <option>Highest Amount</option>
              <option>Lowest Amount</option>
              <option>Longest Distance</option>
          </select>
        </div>
      </div>
    </div>

      <div className="mt-4 pt-4 border-t border-border-main flex justify-end">
        <button onClick={handleExportCSV} className="w-full md:w-auto px-6 py-2.5 bg-slate-900 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {filteredTrips.length === 0 ? (
        <div className="bg-card-bg flex flex-col items-center justify-center p-8 rounded-2xl shadow-sm border border-border-main min-h-[300px]">
          <div className="bg-main-bg p-4 rounded-full mb-4">
            <Route className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-base font-black text-text-main mb-1 text-center">No matching trips</h3>
          <p className="text-text-muted text-[10px] mb-6 text-center max-w-[200px] font-bold uppercase tracking-wider">
            {vehicleId ? "This vehicle hasn't been active in this period." : "Adjust your filters to see results."}
          </p>
          <Link to="/newtrip" className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10">
            Record Trip
          </Link>
        </div>
      ) : (
        <>
          {/* TRIP LIST CONTENT */}
          <div className="bg-card-bg rounded-xl shadow-sm border border-border-main overflow-hidden mb-6">

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[1000px]">
                <thead className="text-xs text-text-muted uppercase bg-main-bg/50 border-b border-border-main">
                  <tr>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="px-4 py-3 font-semibold">Journey</th>
                    <th className="px-4 py-3 font-semibold text-right">Start / End</th>
                    <th className="px-4 py-3 font-semibold text-right">Distance</th>
                    <th className="px-4 py-3 font-semibold text-right">Petrol</th>
                    <th className="px-4 py-3 font-semibold text-right border-l border-border-main">Taxes</th>
                    <th className="px-4 py-3 font-semibold text-right bg-green-500/5">Grand Total</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/50">
                  {currentTrips.map((trip, idx) => (
                    <tr key={trip.id} className="hover:bg-blue-500/5 transition-colors bg-card-bg even:bg-main-bg/20">
                      <td className="px-4 py-4 text-text-muted">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="px-4 py-4 text-text-main">{formatDate(trip.date)}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-text-main">{trip.vehicleName}</div>
                        <div className="text-xs text-text-muted font-mono mt-0.5">{trip.numberPlate}</div>
                      </td>
                      <td className="px-4 py-4 max-w-[200px]">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <span className="truncate">{trip.from}</span>
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate font-bold text-text-main text-sm">{trip.to}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-text-muted text-xs">
                        <div>{trip.startKm}</div>
                        <div className="border-t border-border-main mt-1 pt-1">{trip.endKm}</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-text-main">{trip.distance}</span> <span className="text-xs text-text-muted">km</span>
                      </td>
                      <td className="px-4 py-4 text-right text-text-muted font-medium">
                        {trip.litresFilled || 0} <span className="text-xs font-normal">L</span>
                      </td>
                      <td className="px-4 py-4 text-right text-xs text-text-muted border-l border-border-main block-separate">
                        <div className="opacity-80">Toll: ₹{trip.tollTax || 0}</div>
                        <div className="opacity-80">Border: ₹{trip.borderTax || 0}</div>
                      </td>
                      <td className="px-4 py-4 text-right bg-green-500/5 items-center">
                        <span className="font-bold text-green-600 dark:text-green-400 text-base">₹{trip.grandTotal}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewTripData(trip)} className="p-1.5 text-text-muted hover:bg-main-bg hover:text-text-main rounded-lg transition-colors" title="View Receipt">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(trip)} className="p-1.5 text-blue-500/70 hover:bg-blue-500/10 hover:text-blue-500 rounded-lg transition-colors" title="Edit Trip">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => confirmDelete(trip)} className="p-1.5 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors" title="Delete Trip">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="md:hidden divide-y divide-border-main/50">
              {currentTrips.map((trip) => (
                <div key={trip.id} onClick={() => setViewTripData(trip)} className="p-4 active:bg-blue-500/10 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-text-main leading-tight">{trip.vehicleName}</div>
                      <div className="text-[10px] text-text-muted font-mono mt-0.5">{trip.numberPlate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Date</div>
                      <div className="text-xs font-semibold text-text-main">{formatDate(trip.date)}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-main-bg p-2.5 rounded-xl border border-border-main overflow-hidden">
                       <span className="text-[9px] text-text-muted font-black uppercase tracking-widest block mb-1">Route</span>
                       <div className="flex items-center gap-1.5 text-xs font-bold text-text-main truncate">
                         {trip.from || trip.fromLocation} → {trip.to || trip.toLocation}
                       </div>
                    </div>
                    <div className="bg-green-500/10 p-2.5 rounded-xl border border-green-500/20">
                       <span className="text-[9px] text-green-500 font-black uppercase tracking-widest block mb-1">Total Bill</span>
                       <div className="text-sm font-black text-green-600 dark:text-green-400">₹{trip.grandTotal?.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-text-muted px-1">
                    <div className="flex items-center gap-3">
                       <span><b className="text-text-main">{trip.distance}</b> KM</span>
                       {trip.hasAC && <span className="text-blue-500 font-black uppercase">AC Mode</span>}
                    </div>
                    <button className="text-blue-500 font-black uppercase tracking-widest flex items-center gap-1">Details <Eye className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border-main bg-card-bg">
              <span className="text-sm text-text-muted">
                Showing <span className="font-semibold text-text-main">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-text-main">{Math.min(currentPage * itemsPerPage, filteredTrips.length)}</span> of <span className="font-semibold text-text-main">{filteredTrips.length}</span> trips
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-border-main rounded-lg disabled:opacity-50 hover:bg-main-bg text-text-main"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-text-muted">Page</span>
                  <input 
                    type="number" 
                    value={currentPage} 
                    onChange={(e) => handlePageChange(Number(e.target.value))}
                    className="w-12 px-2 py-1 text-center border border-border-main rounded bg-main-bg text-text-main focus:outline-none"
                    min="1" max={totalPages}
                  />
                  <span className="text-text-muted">of {totalPages}</span>
                </div>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-border-main rounded-lg disabled:opacity-50 hover:bg-main-bg text-text-main"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* SUMMARY TOTALS */}
          <div className="bg-slate-900 rounded-xl shadow-lg border border-border-main p-6 mb-8 text-white">
            <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-4">Summary Totals (Filtered)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="flex flex-col">
              <span className="block text-2xl sm:text-3xl font-bold text-text-main">{filteredTrips.length}</span>
              <span className="text-text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Trips</span>
            </div>
            <div className="border-l border-border-main pl-6 flex flex-col">
              <span className="block text-2xl sm:text-3xl font-bold text-text-main">{totals.distance}</span>
              <span className="text-text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Distance (KM)</span>
            </div>
            <div className="border-l border-border-main pl-6 flex flex-col">
              <span className="block text-2xl sm:text-3xl font-bold text-text-main">{totals.petrol}</span>
              <span className="text-text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Petrol (L)</span>
            </div>
            <div className="border-l border-border-main pl-6 flex flex-col">
              <span className="block text-xl sm:text-2xl font-bold text-orange-400">₹{totals.toll}</span>
              <span className="text-text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Toll Tax</span>
            </div>
            <div className="border-l border-border-main pl-6 flex flex-col">
              <span className="block text-xl sm:text-2xl font-bold text-orange-400">₹{totals.border}</span>
              <span className="text-text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Border Tax</span>
            </div>
            <div className="border-l border-border-main pl-6 flex flex-col">
              <span className="block text-2xl sm:text-3xl font-extrabold text-green-400">₹{totals.revenue}</span>
              <span className="text-text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Revenue</span>
            </div>
          </div>
          </div>

          {/* VEHICLE TIMELINE */}
          {vehicleId && currentTrips.length > 0 && (
            <div className="bg-card-bg p-6 rounded-xl shadow-sm border border-border-main">
              <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                <Route className="w-5 h-5 text-text-muted" /> Vehicle Trip Timeline
              </h3>
              <div className="relative pl-4 overflow-x-auto pb-4 max-w-full">
                <div className="absolute left-[39px] sm:left-[50%] sm:-ml-px top-0 bottom-0 w-0.5 bg-border-main hidden sm:block"></div>
                <div className="flex flex-row sm:flex-col gap-6 sm:gap-4 relative w-max sm:w-full">
                  {/* Timeline is easier to read vertically, the prompt says "horizontal line" but typically horizontal timeline cards overflow quickly on responsive. To respect "horizontal line", we can make it a horizontal scrollable row and plot nodes on a horizontal axis. */}
                  {currentTrips.slice(0, 10).map((t, i) => (
                    <div key={t.id} className="relative flex flex-col items-center group w-64 flex-shrink-0">
                      <div className="h-0.5 w-full bg-blue-500/20 absolute top-8 -z-10 group-first:bg-gradient-to-l group-first:from-blue-500/20 group-first:to-transparent group-last:bg-gradient-to-r group-last:from-blue-500/20 group-last:to-transparent"></div>
                      <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-card-bg shadow-sm z-10 my-6 inline-flex"></div>
                      <div className="bg-main-bg border border-border-main rounded-lg p-4 w-full text-center hover:border-blue-500/50 transition-colors shadow-sm">
                        <span className="text-xs font-bold text-blue-600 block mb-1">{t.date}</span>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
                            <span className="truncate max-w-[120px]">{t.from}</span>
                            <ArrowRight className="w-3 h-3 text-text-muted flex-shrink-0" />
                            <span className="truncate max-w-[120px] font-bold text-text-main">{t.to}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border-main grid grid-cols-2 text-xs">
                          <div>
                            <span className="block text-text-muted font-medium opacity-60">Dist</span>
                            <span className="font-bold text-text-main">{t.distance}k</span>
                          </div>
                          <div>
                            <span className="block text-text-muted font-medium opacity-60">Earned</span>
                            <span className="font-bold text-green-600 dark:text-green-400">₹{t.grandTotal}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </>
      )}

      {/* Delete Dialog Removed in Favor of PasswordModal */}

      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={!!viewTripData}
        onClose={() => setViewTripData(null)}
        tripData={viewTripData}
        onSave={() => setViewTripData(null)} // Save button won't do anything new here basically, or we can just hide it within modal if viewing history. We'll leave it as is or handle it.
        onNewTrip={() => navigate('/newtrip')}
      />

    </div>
  );
};

export default History;
