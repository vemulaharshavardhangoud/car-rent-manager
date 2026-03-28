import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Car, Edit, Trash2, Clock, CarFront, Truck, Bike, Info, Camera, X, Wind, Thermometer, Eye, ChevronLeft, ChevronRight, Map, Route, AlertTriangle, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePasswordProtection } from '../hooks/usePasswordProtection';
import VehicleDetails from '../components/VehicleDetails';
import { uploadFile, compressImage } from '../utils/firestoreService';
import { listenToQuota, recordDeletion } from '../utils/usageService';

const initialForm = {
  name: '', type: '4-Wheeler', capacity: '', numberPlate: '', 
  ratePerKm: '', ratePerDay: '', tankCapacity: '', color: '', notes: '',
  status: 'Available',
  photos: [],
  photoData: [], // Stores { url, size } for accurate quota tracking
  hasAC: false,
  ratePerKmAC: '', ratePerDayAC: ''
};

const Vehicles = () => {
  const { vehicles, allTrips, addVehicle, updateVehicle, deleteVehicle, showToast } = useContext(AppContext);
  const { requirePassword } = usePasswordProtection();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isUploading, setIsUploading] = useState(false);
  const [quota, setQuota] = useState({ totalBytesUsed: 0, safetyLimit: 4.5 * 1024 * 1024 * 1024 });
  const fileInputRef = useRef(null);

  // Global Vehicle Stats
  const totalTrips = allTrips?.length || 0;
  const totalKm = (allTrips || []).reduce((sum, t) => sum + (Number(t.distance)||0), 0);
  const formatMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

  // Quota Listener
  React.useEffect(() => {
    const unsubscribe = listenToQuota((data) => {
      setQuota(data);
    });
    return () => unsubscribe();
  }, []);

  const validate = () => {
    let newErrors = {};
    if (!form.name || form.name.length < 2) newErrors.name = 'Name must be at least 2 chars.';
    if (!form.type) newErrors.type = 'Type is required.';
    if (!form.capacity || form.capacity < 1 || form.capacity > 60) newErrors.capacity = 'Capacity: 1-60.';
    if (!form.numberPlate) newErrors.numberPlate = 'Number Plate is required.';
    else {
      const duplicate = vehicles.find(v => v.numberPlate === form.numberPlate && v.id !== editingId);
      if (duplicate) newErrors.numberPlate = 'Number Plate already exists.';
    }
    if (!form.ratePerKm || form.ratePerKm < 0) newErrors.ratePerKm = 'Min rate is 0.';
    if (!form.ratePerDay || form.ratePerDay < 0) newErrors.ratePerDay = 'Min rate is 0.';
    if (form.hasAC) {
      if (!form.ratePerKmAC || form.ratePerKmAC < 0) newErrors.ratePerKmAC = 'AC rate/km required.';
      if (!form.ratePerDayAC || form.ratePerDayAC < 0) newErrors.ratePerDayAC = 'AC rate/day required.';
    }
    if (!form.tankCapacity || form.tankCapacity < 1) newErrors.tankCapacity = 'Min 1.';
    if (!form.color) newErrors.color = 'Color is required.';
    if (form.notes && form.notes.length > 200) newErrors.notes = 'Notes max 200 chars.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    let finalValue = value;
    if (inputType === 'checkbox') finalValue = checked;
    if (name === 'numberPlate') finalValue = value.toUpperCase();
    if (['capacity', 'ratePerKm', 'ratePerDay', 'tankCapacity', 'ratePerKmAC', 'ratePerDayAC'].includes(name)) {
      finalValue = value === '' ? '' : Number(value);
    }
    setForm(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (form.photos.length + files.length > 5) {
      showToast('Maximum 5 photos allowed per vehicle', 'error');
      return;
    }

    setIsUploading(true);
    let hasError = false;

    try {
      // 1. Generate local previews for immediate WOW effect
      const localPreviews = files.map(file => ({
        url: URL.createObjectURL(file), // Instance access, much faster than FileReader
        file
      }));

      // Add previews to state instantly so they show up right away
      setForm(prev => ({
        ...prev,
        photos: [...prev.photos, ...localPreviews.map(p => p.url)].slice(0, 5)
      }));

      // 2. Parallel Uploads for maximum speed
      const uploadPromises = localPreviews.map(async (item) => {
        try {
          if (item.file.size > 20 * 1024 * 1024) return { error: 'Too large', url: item.url };
          const result = await uploadFile(item.file, 'vehicles');
          
          if (result && result.url) {
            // Replace THIS specific preview with the cloud URL
            setForm(prev => ({
              ...prev,
              photos: prev.photos.map(p => p === item.url ? result.url : p),
              photoData: [...(prev.photoData || []), { url: result.url, size: result.size }],
              totalPhotosSize: (prev.totalPhotosSize || 0) + result.size
            }));
            URL.revokeObjectURL(item.url);
            return { success: true };
          } else {
             throw new Error('Upload failed');
          }
        } catch (e) {
          console.error("Upload failed for file:", item.file.name, e);
          // Strip the failed local preview
          setForm(prev => ({
            ...prev,
            photos: prev.photos.filter(p => p !== item.url)
          }));
          URL.revokeObjectURL(item.url);
          
          if (e.message && e.message.includes('STORAGE_LIMIT_REACHED')) {
             showToast(e.message.split(': ')[1], 'error');
          } else {
             showToast(`Upload failed: ${item.file.name.substring(0, 15)}...`, 'error');
          }
          return { error: e.message };
        }
      });

      const results = await Promise.all(uploadPromises);
      const failedCount = results.filter(r => r.error).length;

      if (failedCount === 0) {
        showToast("Photos synced to cloud successfully", 'success');
      } else if (failedCount < localPreviews.length) {
        showToast(`${localPreviews.length - failedCount} photos synced, ${failedCount} failed`, 'warning');
      }

      if (!hasError) {
        showToast("Photos synced to cloud successfully", 'success');
      }
    } catch (err) {
      showToast('Error processing photos', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = async (index) => {
    const photoUrl = form.photos[index];
    const photoInfo = (form.photoData || []).find(p => p.url === photoUrl);
    
    if (photoInfo && photoInfo.size) {
      // Decrement the global quota immediately
      await recordDeletion(photoInfo.size);
    }

    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      photoData: (prev.photoData || []).filter(p => p.url !== photoUrl),
      totalPhotosSize: Math.max(0, (prev.totalPhotosSize || 0) - (photoInfo?.size || 0))
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      // Final security check: Never submit a local blob: URL to the cloud database
      const safeForm = {
         ...form,
         photos: form.photos.filter(p => !p.startsWith('blob:'))
      };

      if (editingId) {
        await updateVehicle(editingId, safeForm);
        showToast('Vehicle details updated');
      } else {
        await addVehicle(safeForm);
        showToast('New vehicle added');
      }
      cancelEdit();
    }
  };

  const handleEdit = async (vehicle) => {
    const ok = await requirePassword({ actionType: "editVehicle", actionLabel: "EDIT vehicle " + vehicle.name });
    if (ok) {
      setForm({ ...initialForm, ...vehicle });
      setEditingId(vehicle.id);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmDelete = async (id, name, numberPlate) => {
    const ok = await requirePassword({ actionType: "deleteVehicle", actionLabel: "DELETE vehicle " + name + " (" + numberPlate + ")" });
    if (ok) {
      await deleteVehicle(id);
      if (editingId === id) cancelEdit();
    }
  };

  const getStats = (vehicleId) => {
    const trips = allTrips.filter(t => t.vehicleId === vehicleId);
    const totalKm = trips.reduce((sum, t) => sum + (Number(t.distance) || 0), 0);
    const totalEarned = trips.reduce((sum, t) => sum + (Number(t.grandTotal) || 0), 0);
    return { count: trips.length, totalKm, totalEarned };
  };

  const getTypeStyle = (type) => {
    if (type === '2-Wheeler') return { color: 'bg-green-500', textBorder: 'text-green-500', icon: Bike };
    if (type === 'Heavy Vehicle' || type === '6-Wheeler') return { color: 'bg-orange-500', textBorder: 'text-orange-500', icon: Truck };
    return { color: 'bg-blue-500', textBorder: 'text-blue-500', icon: CarFront };
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Booked': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">Booked</span>;
      case 'On Trip': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">On Trip</span>;
      case 'Under Maintenance': return <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">Maintenance</span>;
      default: return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">Available</span>;
    }
  };

  const inputClass = (name) => `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-main-bg hover:bg-card-bg text-text-main transition-colors ${errors[name] ? 'border-red-500 focus:ring-red-200 bg-red-500/10' : 'border-border-main focus:ring-blue-500/10 focus:border-blue-500'}`;

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.numberPlate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-12 animate-fade-in items-start">
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-[440px] shrink-0 space-y-4">
        <div className="bg-card-bg p-6 rounded-2xl shadow-sm border border-border-main">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              {editingId ? 'Update Fleet' : 'Add to Fleet'}
            </h2>
            {editingId && (
              <button onClick={cancelEdit} className="text-xs font-bold text-blue-600 hover:text-blue-700">Add New Instead</button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* PHOTO UPLOAD SECTION */}
            <div className="bg-main-bg/30 p-4 rounded-xl border border-dashed border-border-main transition-colors hover:border-blue-400/50">
              <label className="block text-sm font-bold text-text-main mb-3 flex justify-between items-center px-1">
                <span className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" />
                  Vehicle Photos ({form.photos.length}/5)
                </span>
                {form.photos.length < 5 && !isUploading && (
                  <button 
                    type="button" 
                    disabled={quota.totalBytesUsed > quota.safetyLimit}
                    onClick={() => fileInputRef.current?.click()}
                    className={`text-xs font-bold underline underline-offset-4 transition-all ${
                      quota.totalBytesUsed > quota.safetyLimit 
                        ? 'text-red-500 opacity-50 cursor-not-allowed' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {quota.totalBytesUsed > quota.safetyLimit ? 'Storage Full' : '+ Add New'}
                  </button>
                )}
                {isUploading && (
                  <div className="flex items-center gap-1.5 text-blue-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[10px] font-bold">Syncing...</span>
                  </div>
                )}
              </label>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                {form.photos.map((src, idx) => {
                  const isLocal = src.startsWith('blob:');
                  return (
                    <div key={idx} className={`relative aspect-square rounded-xl overflow-hidden border-2 shadow-sm transition-all group ${isLocal ? 'border-blue-400/50 ring-2 ring-blue-400/10 animate-pulse' : 'border-white dark:border-gray-800'}`}>
                      <img src={src} alt="Vehicle" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      
                      {/* Loading status overlay for local previews */}
                      {isLocal && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin drop-shadow-md" />
                        </div>
                      )}

                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {/* Success Check for Remote URLs */}
                      {!isLocal && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {form.photos.length < 5 && (
                  <button
                    type="button"
                    disabled={isUploading || quota.totalBytesUsed > quota.safetyLimit}
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                      isUploading || quota.totalBytesUsed > quota.safetyLimit
                        ? 'bg-gray-100/50 border-gray-200 text-gray-300 cursor-not-allowed opacity-50' 
                        : 'border-border-main text-text-muted hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-500 bg-white dark:bg-card-bg shadow-sm'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${isUploading || quota.totalBytesUsed > quota.safetyLimit ? 'bg-gray-200' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className={`w-4 h-4 ${quota.totalBytesUsed > quota.safetyLimit ? 'text-gray-400' : 'text-blue-500'}`} />}
                    </div>
                    <span className="text-[10px] font-bold">{isUploading ? 'Syncing' : 'Add'}</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              
              {/* QUOTA WARNING BAND */}
              {quota.totalBytesUsed / quota.safetyLimit > 0.8 && (
                <div className={`mt-3 p-2 rounded-lg flex items-center gap-2 border ${quota.totalBytesUsed > quota.safetyLimit ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                  <AlertTriangle className={`w-3.5 h-3.5 ${quota.totalBytesUsed > quota.safetyLimit ? 'text-red-600' : 'text-amber-600'}`} />
                  <p className={`text-[10px] font-black uppercase tracking-tighter ${quota.totalBytesUsed > quota.safetyLimit ? 'text-red-700' : 'text-amber-700'}`}>
                    {quota.totalBytesUsed > quota.safetyLimit 
                      ? "Storage Limit Reached! Delete old vehicles to add photos." 
                      : `Space Running Low (${(quota.totalBytesUsed / (1024*1024)).toFixed(0)}MB used)`}
                  </p>
                </div>
              )}
              
              <p className="text-[10px] text-text-muted mt-3 italic text-center px-2">
                * Click 'Add' to upload up to 5 photos. Files are optimized for speed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">Vehicle Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Maruti Swift, Toyota Innova" className={inputClass('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Vehicle Type *</label>
                <select name="type" value={form.type} onChange={handleChange} className={inputClass('type')}>
                  <option value="2-Wheeler">2-Wheeler</option>
                  <option value="4-Wheeler">4-Wheeler</option>
                  <option value="6-Wheeler">6-Wheeler</option>
                  <option value="Heavy Vehicle">Heavy Vehicle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Capacity *</label>
                <input type="number" name="capacity" value={form.capacity} onChange={handleChange} placeholder="Seats" className={inputClass('capacity')} />
                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">Number Plate *</label>
              <input name="numberPlate" value={form.numberPlate} onChange={handleChange} placeholder="e.g. GJ05AB1234" className={inputClass('numberPlate')} />
              {errors.numberPlate && <p className="text-red-500 text-xs mt-1">{errors.numberPlate}</p>}
            </div>

            {/* NON-AC PRICING */}
            <div className="p-3.5 bg-main-bg/50 rounded-xl border border-border-main">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5" /> Non-AC / Standard Rates *
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Rate / KM (₹)</label>
                  <input type="number" name="ratePerKm" value={form.ratePerKm} onChange={handleChange} placeholder="12" className={inputClass('ratePerKm')} />
                  {errors.ratePerKm && <p className="text-red-500 text-xs mt-1">{errors.ratePerKm}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Rate / Day (₹)</label>
                  <input type="number" name="ratePerDay" value={form.ratePerDay} onChange={handleChange} placeholder="1500" className={inputClass('ratePerDay')} />
                  {errors.ratePerDay && <p className="text-red-500 text-xs mt-1">{errors.ratePerDay}</p>}
                </div>
              </div>
            </div>

            {/* AC TOGGLE */}
            <div className={`rounded-xl border transition-all ${form.hasAC ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-gray-50'}`}>
              <label className="flex items-center gap-3 p-3.5 cursor-pointer">
                <div className={`w-11 h-6 rounded-full relative transition-colors ${form.hasAC ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.hasAC ? 'translate-x-5' : ''}`}></div>
                </div>
                <input type="checkbox" name="hasAC" checked={form.hasAC} onChange={handleChange} className="hidden" />
                <div>
                  <p className="text-sm font-bold text-text-main flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-blue-500" /> This vehicle has AC
                  </p>
                  <p className="text-xs text-text-muted">Set different rates for AC usage</p>
                </div>
              </label>

              {form.hasAC && (
                <div className="px-3.5 pb-3.5">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5" /> AC Rates *
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">AC Rate / KM (₹)</label>
                      <input type="number" name="ratePerKmAC" value={form.ratePerKmAC} onChange={handleChange} placeholder="16" className={inputClass('ratePerKmAC')} />
                      {errors.ratePerKmAC && <p className="text-red-500 text-xs mt-1">{errors.ratePerKmAC}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">AC Rate / Day (₹)</label>
                      <input type="number" name="ratePerDayAC" value={form.ratePerDayAC} onChange={handleChange} placeholder="2000" className={inputClass('ratePerDayAC')} />
                      {errors.ratePerDayAC && <p className="text-red-500 text-xs mt-1">{errors.ratePerDayAC}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Tank Capacity (L)</label>
                <input type="number" name="tankCapacity" value={form.tankCapacity} onChange={handleChange} placeholder="40" className={inputClass('tankCapacity')} />
                {errors.tankCapacity && <p className="text-red-500 text-xs mt-1">{errors.tankCapacity}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Color *</label>
                <input name="color" value={form.color} onChange={handleChange} placeholder="White" className={inputClass('color')} />
                {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">Operating Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputClass('status')}>
                <option value="Available">🟢 Available for Booking</option>
                <option value="Under Maintenance">⚫ Under Maintenance</option>
                {(form.status === 'Booked' || form.status === 'On Trip') && (
                  <>
                    <option value="Booked">🔴 Currently Booked</option>
                    <option value="On Trip">🟠 Currently On Trip</option>
                  </>
                )}
              </select>
              <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" /> Booked/On Trip status is managed via the Bookings module.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">Internal Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Maintenance notes, insurance info, etc." rows="2" className={inputClass('notes')}></textarea>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={isUploading}
                className={`py-3 px-4 rounded-xl text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                  isUploading ? 'bg-gray-400 cursor-wait' :
                  editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Syncing Photos...</span>
                  </>
                ) : (
                  editingId ? 'Save Changes' : 'Add to Fleet'
                )}
              </button>
              {isUploading && (
                <p className="text-[10px] text-blue-600 font-bold text-center uppercase tracking-widest animate-pulse">
                  Cloud optimization in progress. Please wait.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: LIST */}
      <div className="flex-1 space-y-4">
        {vehicles.length > 0 && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-card-bg rounded-[2rem] p-6 shadow-sm border border-border-main flex items-center gap-5 hover:shadow-md transition-shadow group">
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl group-hover:bg-blue-600 transition-colors">
                <Map className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-text-muted mb-1">Total Vehicle Trips</p>
                <p className="text-3xl font-black text-text-main leading-none">{totalTrips}</p>
              </div>
            </div>
            <div className="bg-card-bg rounded-[2rem] p-6 shadow-sm border border-border-main flex items-center gap-5 hover:shadow-md transition-shadow group">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-600 transition-colors">
                <Route className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-text-muted mb-1">Total Distance (KM)</p>
                <p className="text-3xl font-black text-text-main leading-none">{formatMoney(totalKm)}</p>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
           <div className="flex-1 relative group">
              <input 
                type="text" 
                placeholder="Search Fleet (Name or Plate)..."
                className="w-full pl-12 pr-4 py-3 bg-card-bg rounded-2xl border border-border-main focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold text-sm text-text-main"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <CarFront className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blue-500 transition-colors" />
           </div>
           <select 
             value={statusFilter}
             onChange={e => setStatusFilter(e.target.value)}
             className="px-4 py-3 bg-card-bg rounded-2xl border border-border-main font-bold text-sm text-text-main focus:outline-none focus:ring-4 focus:ring-blue-500/5"
           >
             <option value="All">All Status</option>
             <option value="Available">Available</option>
             <option value="Booked">Booked</option>
             <option value="On Trip">On Trip</option>
             <option value="Under Maintenance">Maintenance</option>
           </select>
           <select 
             value={typeFilter}
             onChange={e => setTypeFilter(e.target.value)}
             className="px-4 py-3 bg-card-bg rounded-2xl border border-border-main font-bold text-sm text-text-main focus:outline-none focus:ring-4 focus:ring-blue-500/5"
           >
             <option value="All">All Types</option>
             <option value="2-Wheeler">2-Wheeler</option>
             <option value="4-Wheeler">4-Wheeler</option>
             <option value="6-Wheeler">6-Wheeler</option>
             <option value="Heavy Vehicle">Heavy</option>
           </select>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="bg-card-bg p-12 rounded-2xl shadow-sm border border-border-main flex flex-col items-center justify-center text-center h-full min-h-[500px]">
            <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-full mb-5"><Car className="w-20 h-20 text-blue-500/80 stroke-[1.5]" /></div>
            <h3 className="text-2xl font-bold text-text-main mb-3">No vehicles added yet</h3>
            <p className="text-text-muted max-w-sm text-center">Add your first vehicle using the form to start tracking your fleet and trips.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredVehicles.map((v) => {
              const { color: topColor, textBorder, icon: TypeIcon } = getTypeStyle(v.type);
              const stats = getStats(v.id);
              return (
                <div key={v.id} className="bg-card-bg rounded-2xl shadow-sm border border-border-main overflow-hidden flex flex-col hover:border-blue-500/20 transition-colors animate-fade-in-up">
                  <div className={`h-1.5 ${topColor}`}></div>

                  {/* VEHICLE PHOTO */}
                  {v.photos && v.photos.length > 0 && (
                    <div className="relative h-44 overflow-hidden bg-gray-100 group">
                      <img src={v.photos[0]} alt={v.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-3 left-4">
                         <h4 className="text-white font-bold text-sm drop-shadow-md">{v.name}</h4>
                         <p className="text-white/80 text-[10px] font-bold drop-shadow-md">{v.numberPlate}</p>
                      </div>
                      <div className="absolute top-3 right-3 flex flex-col gap-2 scale-90 group-hover:scale-100 transition-transform">
                        {v.photos.length > 1 && (
                          <span className="bg-black/40 text-white text-[10px] font-black px-2 py-1 rounded-md backdrop-blur-sm border border-white/20">+{v.photos.length - 1} photos</span>
                        )}
                        {getStatusBadge(v.status)}
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex-1 relative">
                    {(!v.photos || v.photos.length === 0) && (
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 pr-10">
                          <div className={`p-2.5 rounded-xl ${topColor} bg-opacity-10`}><TypeIcon className={`w-6 h-6 ${textBorder}`} /></div>
                          <div>
                            <h3 className="font-bold text-lg text-text-main leading-tight">{v.name}</h3>
                            <span className="inline-block bg-main-bg text-text-muted text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-border-main mt-1">
                              {v.numberPlate}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-4 right-4">{getStatusBadge(v.status)}</div>
                      </div>
                    )}

                    {v.photos && v.photos.length > 0 && (
                      <div className="flex justify-between items-center mb-4">
                        <div className={`px-3 py-1.5 rounded-xl ${topColor} bg-opacity-10 flex items-center gap-2 border border-${topColor.split('-')[1]}-200`}>
                          <TypeIcon className={`w-4 h-4 ${textBorder}`} />
                          <span className={`${textBorder} text-xs font-black uppercase tracking-widest`}>{v.type}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {v.hasAC && (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md border border-blue-200">
                          <Thermometer className="w-3 h-3" /> AC
                        </span>
                      )}
                      {stats.count > 20 && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border border-amber-200">
                          <Info className="w-3 h-3" /> High Usage
                        </span>
                      )}
                      {v.status === 'Under Maintenance' && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border border-red-200 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Service Req
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="bg-main-bg rounded-lg px-3 py-2">
                        <span className="text-text-muted block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Non-AC Rate/KM</span>
                        <span className="font-bold text-text-main">₹{v.ratePerKm}</span>
                      </div>
                      <div className="bg-main-bg rounded-lg px-3 py-2">
                        <span className="text-text-muted block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Non-AC Rate/Day</span>
                        <span className="font-bold text-text-main">₹{v.ratePerDay}</span>
                      </div>
                      {v.hasAC && (
                        <>
                          <div className="bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-500/20">
                            <span className="text-blue-500 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">AC Rate/KM</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">₹{v.ratePerKmAC}</span>
                          </div>
                          <div className="bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-500/20">
                            <span className="text-blue-500 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">AC Rate/Day</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">₹{v.ratePerDayAC}</span>
                          </div>
                        </>
                      )}
                      <div className="bg-main-bg rounded-lg px-3 py-2">
                        <span className="text-text-muted block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Type / Seats</span>
                        <span className="font-medium text-text-main">{v.type} / {v.capacity}</span>
                      </div>
                      <div className="bg-main-bg rounded-lg px-3 py-2">
                        <span className="text-text-muted block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Color / Tank</span>
                        <span className="font-medium text-text-main">{v.color} / {v.tankCapacity}L</span>
                      </div>
                    </div>
                    <div className="bg-main-bg rounded-xl p-4 grid grid-cols-3 gap-3 text-center text-sm border border-border-main">
                      <div><span className="block text-2xl font-bold text-blue-600 mb-0.5">{stats.count}</span><span className="text-xs font-medium text-text-muted uppercase tracking-widest">Trips</span></div>
                      <div className="border-x border-border-main"><span className="block text-2xl font-bold text-text-main mb-0.5">{stats.totalKm}</span><span className="text-xs font-medium text-text-muted uppercase tracking-widest">KM</span></div>
                      <div><span className="block text-2xl font-bold text-green-600 mb-0.5">₹{stats.totalEarned}</span><span className="text-xs font-medium text-text-muted uppercase tracking-widest">Earned</span></div>
                    </div>
                  </div>
                  
                  <div className="border-t border-border-main grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border-main bg-main-bg/30">
                    <button onClick={() => setViewingVehicle(v)} className="py-4 flex justify-center items-center gap-2 text-[12px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">
                      <Eye className="w-4 h-4" /> Details
                    </button>
                    <button onClick={() => handleEdit(v)} className="py-4 flex justify-center items-center gap-2 text-[12px] font-bold text-text-muted hover:text-text-main transition-colors uppercase tracking-widest">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => confirmDelete(v.id, v.name, v.numberPlate)} className="py-4 flex justify-center items-center gap-2 text-[12px] font-bold text-text-muted hover:text-red-600 transition-colors uppercase tracking-widest">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    <button onClick={() => navigate(`/history?vehicleId=${v.id}`)} className="py-4 flex justify-center items-center gap-2 text-[12px] font-bold text-text-muted hover:text-text-main transition-colors uppercase tracking-widest">
                      <Clock className="w-4 h-4" /> History
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* DETAILS MODAL */}
      {viewingVehicle && (
        <VehicleDetails 
          vehicle={viewingVehicle} 
          stats={getStats(viewingVehicle.id)} 
          isAdmin={true}
          onClose={() => setViewingVehicle(null)} 
        />
      )}
    </div>
  );
};

export default Vehicles;
