import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Car, Fuel, Users, Wind, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';

const VehicleAvailability = () => {
  const { vehicles } = useContext(AppContext);
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
          <div key={vehicle.id} className="bg-card-bg border border-border-main rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col">
            {/* Vehicle Photo */}
            <div className="relative h-48 overflow-hidden">
              {vehicle.photos && vehicle.photos.length > 0 ? (
                <img 
                  src={vehicle.photos[0]} 
                  alt={vehicle.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full bg-main-bg flex items-center justify-center">
                  <Car className="w-12 h-12 text-text-muted opacity-20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card-bg via-transparent to-transparent opacity-60"></div>
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
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Seating</span>
                    <span className="text-sm font-black">{vehicle.seats} Seater</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-main-bg/50 p-3 rounded-2xl border border-border-main">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Wind className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">System</span>
                    <span className="text-sm font-black">{vehicle.type}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto p-8 pt-0">
              <div className="flex items-center justify-between p-6 bg-main-bg/50 rounded-3xl border border-border-main">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Rate / Day</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black tracking-tighter">₹{vehicle.ratePerDay}</span>
                    <span className="text-xs text-text-muted font-bold uppercase tracking-widest">/day</span>
                  </div>
                </div>
                <button 
                  disabled={vehicle.status !== 'Available'}
                  onClick={() => window.location.hash = `#/new-booking?vehicleId=${vehicle.id}`}
                  className={`p-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    vehicle.status === 'Available' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/10 active:scale-95' 
                      : 'bg-card-bg text-text-muted border border-border-main cursor-not-allowed opacity-50'
                  }`}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
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
