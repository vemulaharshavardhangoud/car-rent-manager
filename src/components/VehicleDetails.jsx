import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Receipt, Info, Edit, Thermometer, CarFront, Eye } from 'lucide-react';

const VehicleDetails = ({ vehicle, stats, onClose }) => {
  const [activePhoto, setActivePhoto] = useState(0);

  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] border border-white/20">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-20 p-2.5 bg-gray-900/10 hover:bg-gray-900/20 text-gray-900 rounded-full transition-all backdrop-blur-sm"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Gallery Section - Amazon Style */}
        <div className="w-full md:w-[55%] bg-gray-50 flex flex-col md:flex-row p-4 md:p-6 gap-4">
          
          {/* Thumbnails (Side) */}
          {vehicle.photos && vehicle.photos.length > 1 && (
            <div className="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0 md:max-h-[500px]">
              {vehicle.photos.map((src, i) => (
                <button 
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activePhoto === i ? 'border-blue-600 ring-2 ring-blue-100 shadow-md' : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Display */}
          <div className="order-1 md:order-2 flex-1 relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-inner group flex items-center justify-center min-h-[300px] md:min-h-0">
            {vehicle.photos && vehicle.photos.length > 0 ? (
              <>
                <img 
                  src={vehicle.photos[activePhoto]} 
                  alt={vehicle.name} 
                  className="w-full h-full object-contain md:object-cover transition-transform duration-700"
                />
                
                {vehicle.photos.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setActivePhoto(prev => (prev > 0 ? prev - 1 : vehicle.photos.length - 1))}
                      className="p-3 bg-white/90 text-gray-800 rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white transition-all transform -translate-x-2 group-hover:translate-x-0"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setActivePhoto(prev => (prev < vehicle.photos.length - 1 ? prev + 1 : 0))}
                      className="p-3 bg-white/90 text-gray-800 rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white transition-all transform translate-x-2 group-hover:translate-x-0"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}

                <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-white/10">
                  {activePhoto + 1} / {vehicle.photos.length}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300 gap-4">
                <CarFront className="w-32 h-32 opacity-20" />
                <p className="font-bold uppercase tracking-tighter text-gray-400">No photos available</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="w-full md:w-[45%] p-8 md:p-10 flex flex-col bg-white overflow-y-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">{vehicle.type}</span>
              {vehicle.hasAC && (
                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div> AC Supported
                </span>
              )}
            </div>
            <h2 className="text-4xl font-black text-gray-900 leading-none mb-3 tracking-tight">{vehicle.name}</h2>
            <p className="text-2xl font-mono text-gray-400 font-bold tracking-tighter">{vehicle.numberPlate}</p>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-8">
            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 group hover:bg-blue-50/50 transition-colors">
              <span className="block text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest group-hover:text-blue-400">Lifetime Trips</span>
              <span className="text-3xl font-black text-gray-900 group-hover:text-blue-600">{stats.count}</span>
            </div>
            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 group hover:bg-orange-50/50 transition-colors">
              <span className="block text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest group-hover:text-orange-400">Distance</span>
              <span className="text-2xl font-black text-gray-900 leading-tight block mt-1">{stats.totalKm} <span className="text-sm">KM</span></span>
            </div>
          </div>

          <div className="space-y-8 flex-1">
            <section>
              <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Pricing & Billing
              </h5>
              <div className="grid grid-cols-2 gap-6 p-1 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100">
                  <span className="block text-[9px] font-black text-gray-400 uppercase mb-2">Standard (Non-AC)</span>
                  <div className="space-y-1">
                     <p className="text-xs font-bold text-gray-600">₹{vehicle.ratePerKm}/KM</p>
                     <p className="text-xs font-bold text-gray-600">₹{vehicle.ratePerDay}/Day</p>
                  </div>
                </div>
                {vehicle.hasAC ? (
                  <div className="p-4 rounded-2xl bg-blue-600 shadow-blue-200 shadow-lg text-white">
                    <span className="block text-[9px] font-black text-white/60 uppercase mb-2">Air Conditioned</span>
                    <div className="space-y-1">
                       <p className="text-xs font-bold">₹{vehicle.ratePerKmAC}/KM</p>
                       <p className="text-xs font-bold">₹{vehicle.ratePerDayAC}/Day</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center justify-center opacity-40">
                    <span className="text-[10px] font-bold text-gray-400 italic">AC Not Available</span>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Technical Specifications
              </h5>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-[11px] text-gray-500 font-bold uppercase">Seating</span>
                  <span className="font-black text-gray-900">{vehicle.capacity} Seats</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-[11px] text-gray-500 font-bold uppercase">Fuel Tank</span>
                  <span className="font-black text-gray-900">{vehicle.tankCapacity} L</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-[11px] text-gray-500 font-bold uppercase">Exterior</span>
                  <span className="font-black text-gray-900">{vehicle.color}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <span className="text-[11px] text-gray-500 font-bold uppercase">Health</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-black uppercase tracking-tighter leading-none">{vehicle.bookingStatus}</span>
                </div>
              </div>
            </section>

            {vehicle.notes && (
              <section className="bg-orange-50/50 p-5 rounded-3xl border border-orange-100/50">
                <h5 className="text-[10px] font-black text-orange-600/60 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Fleet Manager Notes
                </h5>
                <p className="text-sm text-gray-700 font-medium italic leading-relaxed">
                   "{vehicle.notes}"
                </p>
              </section>
            )}
            
            <button 
              onClick={onClose}
              className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-gray-200 mt-auto"
            >
              Back to Fleet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
