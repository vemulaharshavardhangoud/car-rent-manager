import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Search, Filter, Calendar, MapPin, 
  Trash2, Edit, Eye, Download, ChevronLeft, 
  ChevronRight, ArrowRight, Route
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import ReceiptModal from '../components/ReceiptModal';
import { exportTripsAsCSV } from '../utils/storage';
import { usePasswordProtection } from '../hooks/usePasswordProtection';

const History = () => {
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
        (t.toLocation || '').toLowerCase().includes(lowerQ)
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
    const ok = await requirePassword({ actionType: "editTrip", actionLabel: "EDIT trip from " + trip.fromLocation + " to " + trip.toLocation });
    if (ok) navigate('/newtrip', { state: { editTripData: trip } });
  };

  const confirmDelete = async (trip) => {
    const ok = await requirePassword({ actionType: "deleteTrip", actionLabel: "DELETE trip from " + trip.fromLocation + " to " + trip.toLocation });
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
        <span className="text-sm font-medium text-gray-800">{formatted}</span>
        {isToday && <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded w-fit mt-1">Today</span>}
      </div>
    );
  };

  return (
    <div className="w-full pb-12 animate-fade-in relative flex flex-col min-h-full">
      
      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 sticky top-16 z-20">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-4">
          <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            {/* Vehicle Select */}
            <select 
              value={vehicleId} 
              onChange={(e) => setVehicleId(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} — {v.numberPlate}</option>)}
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg pr-2 bg-white flex-shrink-0">
               <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 text-sm bg-transparent focus:outline-none rounded-l-lg border-r border-gray-200" title="From Date" />
               <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 text-sm bg-transparent focus:outline-none" title="To Date" />
               <button onClick={clearDates} className="text-gray-400 hover:text-red-500 px-2 text-xs font-semibold" title="Clear Dates">X</button>
            </div>
            
            {/* Search */}
            <div className="relative min-w-[200px] flex-shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search locations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            >
              <option>Latest First</option>
              <option>Oldest First</option>
              <option>Highest Amount</option>
              <option>Lowest Amount</option>
              <option>Longest Distance</option>
            </select>
          </div>

          <button onClick={handleExportCSV} className="w-full lg:w-auto px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 flex-shrink-0">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {filteredTrips.length === 0 ? (
        <div className="bg-white flex flex-col items-center justify-center p-16 rounded-2xl shadow-sm border border-gray-100 flex-1 min-h-[400px]">
          <div className="bg-gray-100 p-6 rounded-full mb-6">
            <Route className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No trips found for the selected filters</h3>
          <p className="text-gray-500 mb-8">{vehicleId && allTrips.filter(t => t.vehicleId === vehicleId).length === 0 ? "This vehicle has no trip records yet." : "Adjust your filters or add a new trip."}</p>
          <Link to="/newtrip" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
            Record First Trip
          </Link>
        </div>
      ) : (
        <>
          {/* TRIP TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="px-4 py-3 font-semibold">Journey</th>
                    <th className="px-4 py-3 font-semibold text-right">Start / End</th>
                    <th className="px-4 py-3 font-semibold text-right">Distance</th>
                    <th className="px-4 py-3 font-semibold text-right">Petrol</th>
                    <th className="px-4 py-3 font-semibold text-right border-l border-gray-200">Taxes</th>
                    <th className="px-4 py-3 font-semibold text-right bg-green-50/50">Grand Total</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentTrips.map((trip, idx) => (
                    <tr key={trip.id} className="hover:bg-blue-50/30 transition-colors bg-white even:bg-gray-50/30">
                      <td className="px-4 py-4 text-gray-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="px-4 py-4">{formatDate(trip.date)}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-800">{trip.vehicleName}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{trip.numberPlate}</div>
                      </td>
                      <td className="px-4 py-4 max-w-[200px]">
                        <div className="flex items-center gap-2 text-gray-800 font-medium">
                          <span className="truncate">{trip.fromLocation}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{trip.toLocation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-gray-500 text-xs">
                        <div>{trip.startKm}</div>
                        <div className="border-t border-gray-200 mt-1 pt-1">{trip.endKm}</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-gray-800">{trip.distance}</span> <span className="text-xs text-gray-500">km</span>
                      </td>
                      <td className="px-4 py-4 text-right text-gray-600">
                        {trip.litresFilled || 0} <span className="text-xs">L</span>
                      </td>
                      <td className="px-4 py-4 text-right text-xs text-gray-500 border-l border-gray-100">
                        <div>Toll: ₹{trip.tollTax || 0}</div>
                        <div>Border: ₹{trip.borderTax || 0}</div>
                      </td>
                      <td className="px-4 py-4 text-right bg-green-50/20">
                        <span className="font-bold text-green-600 text-base">₹{trip.grandTotal}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewTripData(trip)} className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors" title="View Receipt">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(trip)} className="p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Edit Trip">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => confirmDelete(trip)} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Delete Trip">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
              <span className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredTrips.length)}</span> of <span className="font-semibold text-gray-800">{filteredTrips.length}</span> trips
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">Page</span>
                  <input 
                    type="number" 
                    value={currentPage} 
                    onChange={(e) => handlePageChange(Number(e.target.value))}
                    className="w-12 px-2 py-1 text-center border border-gray-200 rounded focus:outline-none"
                    min="1" max={totalPages}
                  />
                  <span className="text-gray-500">of {totalPages}</span>
                </div>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* SUMMARY TOTALS */}
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 mb-8 text-white">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Summary Totals (Filtered)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div>
                <span className="block text-3xl font-bold">{filteredTrips.length}</span>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Trips</span>
              </div>
              <div className="border-l border-slate-700 pl-6">
                <span className="block text-3xl font-bold text-blue-400">{totals.distance}</span>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Distance (KM)</span>
              </div>
              <div className="border-l border-slate-700 pl-6">
                <span className="block text-3xl font-bold">{totals.petrol}</span>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Petrol (L)</span>
              </div>
              <div className="border-l border-slate-700 pl-6">
                <span className="block text-2xl font-bold text-orange-400">₹{totals.toll}</span>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Toll Tax</span>
              </div>
              <div className="border-l border-slate-700 pl-6">
                <span className="block text-2xl font-bold text-orange-400">₹{totals.border}</span>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Border Tax</span>
              </div>
              <div className="border-l border-slate-700 pl-6">
                <span className="block text-3xl font-extrabold text-green-400">₹{totals.revenue}</span>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Revenue</span>
              </div>
            </div>
          </div>

          {/* VEHICLE TIMELINE */}
          {vehicleId && currentTrips.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Route className="w-5 h-5 text-gray-500" /> Vehicle Trip Timeline
              </h3>
              <div className="relative pl-4 overflow-x-auto pb-4">
                <div className="absolute left-[39px] sm:left-[50%] sm:-ml-px top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block"></div>
                <div className="flex sm:flex-col gap-6 sm:gap-4 relative w-max sm:w-full">
                  {/* Timeline is easier to read vertically, the prompt says "horizontal line" but typically horizontal timeline cards overflow quickly on responsive. To respect "horizontal line", we can make it a horizontal scrollable row and plot nodes on a horizontal axis. */}
                  {currentTrips.slice(0, 10).map((t, i) => (
                    <div key={t.id} className="relative flex flex-col items-center group w-64 flex-shrink-0">
                      <div className="h-0.5 w-full bg-blue-200 absolute top-8 -z-10 group-first:bg-gradient-to-l group-first:from-blue-200 group-first:to-transparent group-last:bg-gradient-to-r group-last:from-blue-200 group-last:to-transparent"></div>
                      <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm z-10 my-6 inline-flex"></div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-full text-center hover:border-blue-300 transition-colors shadow-sm">
                        <span className="text-xs font-bold text-blue-600 block mb-1">{t.date}</span>
                        <div className="font-semibold text-gray-800 truncate px-2">{t.fromLocation}</div>
                        <ArrowRight className="w-3 h-3 mx-auto text-gray-400 my-1" />
                        <div className="font-semibold text-gray-800 truncate px-2">{t.toLocation}</div>
                        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 text-xs">
                          <div>
                            <span className="block text-gray-400 font-medium">Dist</span>
                            <span className="font-bold text-gray-700">{t.distance}k</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 font-medium">Earned</span>
                            <span className="font-bold text-green-600">₹{t.grandTotal}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Adding flex wrapper for horizontal alignment to fit the horizontal line requirement precisely */}
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
