import React, { useState, useContext, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Receipt, Edit, CarFront, Droplets, Plus, Trash2, Calendar, ShieldCheck, Wrench } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const VehicleDetails = ({ vehicle: initialVehicle, stats, onClose, isAdmin = false }) => {
  const [activePhoto, setActivePhoto] = useState(0);
  const [startTouch, setStartTouch] = useState(null);
  const [endTouch, setEndTouch] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollRef = useRef(null);
  const minSwipeDistance = 50;

  // Auto-scroll logic
  useEffect(() => {
    if (!vehicle.photos || vehicle.photos.length <= 1 || isPaused) {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      return;
    }

    autoScrollRef.current = setInterval(() => {
      setActivePhoto(prev => (prev < vehicle.photos.length - 1 ? prev + 1 : 0));
    }, 4000); // 4 seconds interval

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [vehicle.photos, isPaused]);

  const handleTouchStart = (e) => { 
    setIsPaused(true); // Pause auto-scroll on interaction
    setEndTouch(null); 
    setStartTouch(e.targetTouches[0].clientX); 
  };
  const handleTouchMove = (e) => { setEndTouch(e.targetTouches[0].clientX); };
  const handleTouchEnd = () => {
    setIsPaused(false); // Resume after interaction
    if (!startTouch || !endTouch) return;
    const distance = startTouch - endTouch;
    if (distance > minSwipeDistance) setActivePhoto(prev => (prev < vehicle.photos.length - 1 ? prev + 1 : 0));
    else if (distance < -minSwipeDistance) setActivePhoto(prev => (prev > 0 ? prev - 1 : vehicle.photos.length - 1));
  };

  const { vehicles, fuelLogs, addFuelLog, deleteFuelLog, updateVehicleDocuments, addMaintenanceLog } = useContext(AppContext);
  const vehicle = vehicles.find(v => v.id === initialVehicle.id) || initialVehicle;

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [isEditingDocs, setIsEditingDocs] = useState(false);
  const [fuelForm, setFuelForm] = useState({ amount: '', litres: '', date: new Date().toISOString().split('T')[0] });
  const [docForm, setDocForm] = useState({ insuranceExpiry: vehicle.insuranceExpiry || '', permitExpiry: vehicle.permitExpiry || '', fitnessExpiry: vehicle.fitnessExpiry || '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ type: 'Oil Change', date: new Date().toISOString().split('T')[0], km: '', notes: '' });

  if (!vehicle) return null;

  const vehicleFuelLogs = fuelLogs.filter(log => log.vehicleId === vehicle.id).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleAddFuel = async (e) => {
    e.preventDefault();
    if (!fuelForm.amount || !fuelForm.litres || !fuelForm.date) return;
    const success = await addFuelLog(vehicle.id, { vehicleId: vehicle.id, amount: parseFloat(fuelForm.amount), litres: parseFloat(fuelForm.litres), date: fuelForm.date, createdAt: new Date().toISOString() });
    if (success) { setShowFuelModal(false); setFuelForm({ amount: '', litres: '', date: new Date().toISOString().split('T')[0] }); }
  };

  const handleUpdateDocs = async () => { await updateVehicleDocuments(vehicle.id, docForm); setIsEditingDocs(false); };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.km || !maintenanceForm.date) return;
    const success = await addMaintenanceLog(vehicle.id, maintenanceForm);
    if (success) { setShowMaintenanceModal(false); setMaintenanceForm({ type: 'Oil Change', date: new Date().toISOString().split('T')[0], km: '', notes: '' }); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={onClose}></div>

      {/* Modal — full screen on mobile, constrained on desktop */}
      <div className="relative w-full max-w-5xl bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] border border-white/20">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2.5 bg-gray-900/10 hover:bg-gray-900/20 text-gray-900 rounded-full transition-all backdrop-blur-sm">
          <X className="w-5 h-5" />
        </button>

        {/* LEFT: Gallery — compact on mobile */}
        <div className="w-full md:w-[55%] bg-gray-50 flex flex-col p-2 md:p-8 gap-2 md:gap-6 border-b md:border-b-0 md:border-r border-gray-100">

          {/* Main Photo — smaller on mobile */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-inner group flex items-center justify-center ${vehicle.photos?.length > 0 ? 'h-44 md:h-80' : 'h-32 md:h-48'} touch-pan-y`}
          >
            {vehicle.photos && vehicle.photos.length > 0 ? (
              <>
                <img
                  src={vehicle.photos[activePhoto]}
                  alt={vehicle.name}
                  className="w-full h-full object-cover transition-all duration-500 select-none pointer-events-none"
                />
                {vehicle.photos.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-3 pointer-events-none">
                    <button onClick={(e) => { e.stopPropagation(); setIsPaused(true); setActivePhoto(prev => (prev > 0 ? prev - 1 : vehicle.photos.length - 1)); setTimeout(() => setIsPaused(false), 2000); }} className="p-2 bg-white/80 backdrop-blur-md text-gray-800 rounded-xl shadow-lg hover:bg-blue-600 hover:text-white transition-all pointer-events-auto border border-white/20">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsPaused(true); setActivePhoto(prev => (prev < vehicle.photos.length - 1 ? prev + 1 : 0)); setTimeout(() => setIsPaused(false), 2000); }} className="p-2 bg-white/80 backdrop-blur-md text-gray-800 rounded-xl shadow-lg hover:bg-blue-600 hover:text-white transition-all pointer-events-auto border border-white/20">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border border-white/10">
                  {activePhoto + 1} / {vehicle.photos.length}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
                <CarFront className="w-12 h-12" />
                <p className="font-black uppercase tracking-[0.2em] text-[8px]">No photos available</p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {vehicle.photos && vehicle.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
              {vehicle.photos.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`relative w-14 h-14 md:w-18 md:h-18 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activePhoto === i ? 'border-blue-600 ring-3 ring-blue-500/20 shadow-md' : 'border-transparent hover:border-gray-300 opacity-60 hover:opacity-100'}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Info — scrollable */}
        <div className="w-full md:w-[45%] p-4 md:p-8 flex flex-col bg-white overflow-y-auto">

          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">{vehicle.type}</span>
              {vehicle.hasAC && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div> AC
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black text-gray-900 leading-none mb-1 tracking-tight">{vehicle.name}</h2>
            <p className="text-lg font-mono text-gray-400 font-bold">{vehicle.numberPlate}</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">Lifetime Trips</span>
                <span className="text-xl md:text-2xl font-black text-gray-900">{stats.count}</span>
              </div>
              <div className="p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="block text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">Distance</span>
                <span className="text-xl md:text-2xl font-black text-gray-900">{stats.totalKm} <span className="text-xs">KM</span></span>
              </div>
            </div>
          )}

          <div className="space-y-4 flex-1">

            {/* Pricing — always visible */}
            <section>
              <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Pricing & Billing
              </h5>
              <div className="grid grid-cols-2 gap-3 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="p-3 rounded-xl bg-white shadow-sm border border-gray-100">
                  <span className="block text-[9px] font-black text-gray-400 uppercase mb-1.5">Standard (Non-AC)</span>
                  <p className="text-xs font-bold text-gray-700">₹{vehicle.ratePerKm}/KM</p>
                  <p className="text-xs font-bold text-gray-700">₹{vehicle.ratePerDay}/Day</p>
                </div>
                {vehicle.hasAC ? (
                  <div className="p-3 rounded-xl bg-blue-600 text-white">
                    <span className="block text-[9px] font-black text-white/60 uppercase mb-1.5">Air Conditioned</span>
                    <p className="text-xs font-bold">₹{vehicle.ratePerKmAC}/KM</p>
                    <p className="text-xs font-bold">₹{vehicle.ratePerDayAC}/Day</p>
                  </div>
                ) : (
                  <div className="p-3 flex items-center justify-center opacity-40">
                    <span className="text-[10px] font-bold text-gray-400 italic">AC Not Available</span>
                  </div>
                )}
              </div>
            </section>

            {/* Admin-only sections */}
            {isAdmin && (
              <>
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Compliance & Documents
                    </h5>
                    <button
                      onClick={() => isEditingDocs ? handleUpdateDocs() : setIsEditingDocs(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${isEditingDocs ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                    >
                      {isEditingDocs ? 'Save Changes' : 'Update Dates'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    {[
                      { label: 'Insurance Expiry', key: 'insuranceExpiry' },
                      { label: 'Permit Expiry', key: 'permitExpiry' },
                      { label: 'Fitness Expiry', key: 'fitnessExpiry' }
                    ].map(doc => (
                      <div key={doc.key} className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500 font-bold uppercase">{doc.label}</span>
                        {isEditingDocs ? (
                          <input type="date" value={docForm[doc.key]} onChange={(e) => setDocForm({...docForm, [doc.key]: e.target.value})} className="bg-white border-none rounded-lg px-3 py-1 text-xs font-black text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                        ) : (
                          <span className={`font-black text-sm ${docForm[doc.key] ? 'text-gray-900' : 'text-gray-300 italic'}`}>{docForm[doc.key] || 'Not Set'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {vehicle.notes && (
                  <section className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
                    <h5 className="text-[10px] font-black text-orange-600/60 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                      <Edit className="w-4 h-4" /> Fleet Manager Notes (Private)
                    </h5>
                    <p className="text-sm text-gray-700 font-medium italic leading-relaxed">"{vehicle.notes}"</p>
                  </section>
                )}

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Droplets className="w-4 h-4" /> Fuel Logs
                    </h5>
                    <button onClick={() => setShowFuelModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Log
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                    {vehicleFuelLogs.length > 0 ? vehicleFuelLogs.map(log => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><Droplets className="w-4 h-4" /></div>
                          <div>
                            <p className="text-sm font-black text-gray-900">₹{log.amount}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{log.litres}L • {log.date}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteFuelLog(vehicle.id, log.id)} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )) : (
                      <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No fuel logs found</p>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Wrench className="w-4 h-4" /> Maintenance
                    </h5>
                    <button onClick={() => setShowMaintenanceModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-orange-100 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Log Service
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                    {vehicle.maintenance && vehicle.maintenance.length > 0 ? vehicle.maintenance.map(log => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><Wrench className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{log.type}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{log.km} KM • {log.date}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No maintenance history</p>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            <div className="sticky bottom-0 pt-4 bg-white border-t border-gray-50 mt-auto">
              <button onClick={onClose} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl">
                Back to Fleet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fuel Log Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFuelModal(false)}></div>
          <form onSubmit={handleAddFuel} className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
            <h3 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-3">
              <Droplets className="w-6 h-6 text-emerald-500" /> Add Fuel Log
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Total Amount (₹)</label>
                <input type="number" value={fuelForm.amount} onChange={(e) => setFuelForm({...fuelForm, amount: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Litres Filled</label>
                <input type="number" step="0.01" value={fuelForm.litres} onChange={(e) => setFuelForm({...fuelForm, litres: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={fuelForm.date} onChange={(e) => setFuelForm({...fuelForm, date: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all" required />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowFuelModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">Save Log</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMaintenanceModal(false)}></div>
          <form onSubmit={handleAddMaintenance} className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
            <h3 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-3">
              <Wrench className="w-6 h-6 text-orange-500" /> Maintenance Record
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Service Type</label>
                <select value={maintenanceForm.type} onChange={(e) => setMaintenanceForm({...maintenanceForm, type: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 transition-all">
                  <option>Oil Change</option><option>Tyre Rotation</option><option>Brake Service</option>
                  <option>Battery Check</option><option>Wheel Alignment</option><option>Full Service</option><option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Odometer</label>
                  <input type="number" value={maintenanceForm.km} onChange={(e) => setMaintenanceForm({...maintenanceForm, km: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 transition-all" placeholder="KM" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Date</label>
                  <input type="date" value={maintenanceForm.date} onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 transition-all text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Notes</label>
                <textarea value={maintenanceForm.notes} onChange={(e) => setMaintenanceForm({...maintenanceForm, notes: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 transition-all" rows="2" placeholder="Details..." />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowMaintenanceModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200">Save Record</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VehicleDetails;
