import React, { useState, useContext } from 'react';
import { X, ChevronLeft, ChevronRight, Receipt, Info, Edit, Thermometer, CarFront, Eye, Droplets, Plus, Trash2, Calendar, ShieldCheck, Wrench, Settings } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const VehicleDetails = ({ vehicle: initialVehicle, stats, onClose, isAdmin = false }) => {
  const [activePhoto, setActivePhoto] = useState(0);
  const [startTouch, setStartTouch] = useState(null);
  const [endTouch, setEndTouch] = useState(null);
  
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setEndTouch(null); // Clear previous touch state
    setStartTouch(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setEndTouch(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!startTouch || !endTouch) return;
    const distance = startTouch - endTouch;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setActivePhoto(prev => (prev < vehicle.photos.length - 1 ? prev + 1 : 0));
    } else if (isRightSwipe) {
      setActivePhoto(prev => (prev > 0 ? prev - 1 : vehicle.photos.length - 1));
    }
  };

  const { vehicles, fuelLogs, addFuelLog, deleteFuelLog, updateVehicleDocuments, addMaintenanceLog } = useContext(AppContext);
  
  // Always get fresh vehicle data from context
  const vehicle = vehicles.find(v => v.id === initialVehicle.id) || initialVehicle;

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [isEditingDocs, setIsEditingDocs] = useState(false);

  const [fuelForm, setFuelForm] = useState({
    amount: '',
    litres: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [docForm, setDocForm] = useState({
    insuranceExpiry: vehicle.insuranceExpiry || '',
    permitExpiry: vehicle.permitExpiry || '',
    fitnessExpiry: vehicle.fitnessExpiry || ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'Oil Change',
    date: new Date().toISOString().split('T')[0],
    km: '',
    notes: ''
  });

  if (!vehicle) return null;

  const vehicleFuelLogs = fuelLogs
    .filter(log => log.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleAddFuel = async (e) => {
    e.preventDefault();
    if (!fuelForm.amount || !fuelForm.litres || !fuelForm.date) return;

    const newLog = {
      vehicleId: vehicle.id,
      amount: parseFloat(fuelForm.amount),
      litres: parseFloat(fuelForm.litres),
      date: fuelForm.date,
      createdAt: new Date().toISOString()
    };

    const success = await addFuelLog(vehicle.id, newLog);
    if (success) {
      setShowFuelModal(false);
      setFuelForm({
        amount: '',
        litres: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleUpdateDocs = async () => {
    await updateVehicleDocuments(vehicle.id, docForm);
    setIsEditingDocs(false);
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.km || !maintenanceForm.date) return;

    const success = await addMaintenanceLog(vehicle.id, maintenanceForm);
    if (success) {
      setShowMaintenanceModal(false);
      setMaintenanceForm({
        type: 'Oil Change',
        date: new Date().toISOString().split('T')[0],
        km: '',
        notes: ''
      });
    }
  };

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

        {/* Gallery Section - Premium Responsive Grid */}
        <div className="w-full md:w-[60%] bg-gray-50 flex flex-col p-4 md:p-8 gap-6 border-b md:border-b-0 md:border-r border-border-main">
          
          {/* Main Display - Centered and Premium */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex-1 relative bg-white rounded-3xl overflow-hidden border border-border-main shadow-inner group flex items-center justify-center min-h-[300px] md:min-h-[400px] touch-pan-y"
          >
            {vehicle.photos && vehicle.photos.length > 0 ? (
              <>
                <img 
                  src={vehicle.photos[activePhoto]} 
                  alt={vehicle.name} 
                  className="w-full h-full object-contain md:object-cover transition-all duration-500 select-none pointer-events-none"
                />
                
                {vehicle.photos.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                    <button 
                      onClick={() => setActivePhoto(prev => (prev > 0 ? prev - 1 : vehicle.photos.length - 1))}
                      className="p-3 bg-white/70 backdrop-blur-md text-gray-800 rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white transition-all transform -translate-x-2 group-hover:translate-x-0 pointer-events-auto border border-white/20"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setActivePhoto(prev => (prev < vehicle.photos.length - 1 ? prev + 1 : 0))}
                      className="p-3 bg-white/70 backdrop-blur-md text-gray-800 rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white transition-all transform translate-x-2 group-hover:translate-x-0 pointer-events-auto border border-white/20"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}

                <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                  {activePhoto + 1} / {vehicle.photos.length}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-text-muted/20 gap-4">
                <CarFront className="w-32 h-32" />
                <p className="font-black uppercase tracking-[0.2em] text-[10px]">No photos available</p>
              </div>
            )}
          </div>

          {/* Thumbnails - Horizontal Scrollable Strip for all devices */}
          {vehicle.photos && vehicle.photos.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1">
              {vehicle.photos.map((src, i) => (
                <button 
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${activePhoto === i ? 'border-blue-600 ring-4 ring-blue-500/10 shadow-lg' : 'border-transparent hover:border-gray-300 opacity-60 hover:opacity-100'}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
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
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Compliance & Documents
                </h5>
                {isAdmin && (
                  <button 
                    onClick={() => isEditingDocs ? handleUpdateDocs() : setIsEditingDocs(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${isEditingDocs ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    {isEditingDocs ? 'Save Changes' : 'Update Dates'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                {[
                  { label: 'Insurance Expiry', key: 'insuranceExpiry' },
                  { label: 'Permit Expiry', key: 'permitExpiry' },
                  { label: 'Fitness Expiry', key: 'fitnessExpiry' }
                ].map(doc => (
                  <div key={doc.key} className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 font-bold uppercase">{doc.label}</span>
                    {isEditingDocs ? (
                      <input 
                        type="date"
                        value={docForm[doc.key]}
                        onChange={(e) => setDocForm({...docForm, [doc.key]: e.target.value})}
                        className="bg-white border-none rounded-lg px-3 py-1 text-xs font-black text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <span className={`font-black text-sm ${docForm[doc.key] ? 'text-gray-900' : 'text-gray-300 italic'}`}>
                        {docForm[doc.key] || 'Not Set'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {isAdmin && vehicle.notes && (
              <section className="bg-orange-50/50 dark:bg-orange-900/10 p-5 rounded-3xl border border-orange-100/50 dark:border-orange-800/30">
                <h5 className="text-[10px] font-black text-orange-600/60 dark:text-orange-400/60 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Fleet Manager Notes (Private)
                </h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium italic leading-relaxed">
                   "{vehicle.notes}"
                </p>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Droplets className="w-4 h-4" /> Fuel Logs
                </h5>
                {isAdmin && (
                  <button 
                    onClick={() => setShowFuelModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Log
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                {vehicleFuelLogs.length > 0 ? (
                  vehicleFuelLogs.map(log => (
                    <div key={log.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                          <Droplets className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white">₹{log.amount}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                            <span>{log.litres}L</span>
                            <span>•</span>
                            <span>{log.date}</span>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => deleteFuelLog(vehicle.id, log.id)}
                          className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No fuel logs found</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> Maintenance
                </h5>
                {isAdmin && (
                  <button 
                    onClick={() => setShowMaintenanceModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-orange-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log Service
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                {vehicle.maintenance && vehicle.maintenance.length > 0 ? (
                  vehicle.maintenance.map(log => (
                    <div key={log.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{log.type}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                            <span>{log.km} KM</span>
                            <span>•</span>
                            <span>{log.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No maintenance history</p>
                  </div>
                )}
              </div>
            </section>
            
            <button 
              onClick={onClose}
              className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-gray-200 mt-auto"
            >
              Back to Fleet
            </button>
          </div>
        </div>
      </div>

      {/* Fuel Log Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFuelModal(false)}></div>
          <form 
            onSubmit={handleAddFuel}
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/20"
          >
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-3">
              <Droplets className="w-6 h-6 text-emerald-500" /> Add Fuel Log
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Total Amount (₹)</label>
                <input 
                  type="number" 
                  value={fuelForm.amount}
                  onChange={(e) => setFuelForm({...fuelForm, amount: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Litres Filled</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={fuelForm.litres}
                  onChange={(e) => setFuelForm({...fuelForm, litres: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="date" 
                    value={fuelForm.date}
                    onChange={(e) => setFuelForm({...fuelForm, date: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl pl-14 pr-6 py-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                  Save Log
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {/* Maintenance Log Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMaintenanceModal(false)}></div>
          <form 
            onSubmit={handleAddMaintenance}
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/20"
          >
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-3">
              <Wrench className="w-6 h-6 text-orange-500" /> Maintenance Record
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Service Type</label>
                <select 
                  value={maintenanceForm.type}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, type: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 transition-all"
                >
                  <option>Oil Change</option>
                  <option>Tyre Rotation</option>
                  <option>Brake Service</option>
                  <option>Battery Check</option>
                  <option>Wheel Alignment</option>
                  <option>Full Service</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Current Odometer</label>
                  <input 
                    type="number" 
                    value={maintenanceForm.km}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, km: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="KM"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Date</label>
                  <input 
                    type="date" 
                    value={maintenanceForm.date}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Notes</label>
                <textarea 
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, notes: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 transition-all"
                  rows="2"
                  placeholder="Details..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 dark:shadow-none"
                >
                  Save Record
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VehicleDetails;
