// v1.2 - Photo Upload + AC/Non-AC Pricing
import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Car, Edit, Trash2, Clock, CarFront, Truck, Bike, Info, Camera, X, Wind, Thermometer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePasswordProtection } from '../hooks/usePasswordProtection';

const initialForm = {
  name: '', type: '4-Wheeler', capacity: '', numberPlate: '', 
  ratePerKm: '', ratePerDay: '', tankCapacity: '', color: '', notes: '',
  bookingStatus: 'Available',
  photo: null,
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
  const fileInputRef = useRef(null);

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Photo must be smaller than 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({ ...prev, photo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setForm(prev => ({ ...prev, photo: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      if (editingId) {
        await updateVehicle(editingId, form);
        showToast('Vehicle details updated');
      } else {
        await addVehicle(form);
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

  const inputClass = (name) => `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 hover:bg-white transition-colors ${errors[name] ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500'}`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-12 animate-fade-in items-start">
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-[440px] shrink-0 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-500" />
              {editingId ? 'Update Fleet' : 'Add to Fleet'}
            </h2>
            {editingId && (
              <button onClick={cancelEdit} className="text-xs font-bold text-blue-600 hover:text-blue-700">Add New Instead</button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* PHOTO UPLOAD */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Photo (Optional)</label>
              {form.photo ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={form.photo} alt="Vehicle" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" /> Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 bg-gray-50 hover:bg-blue-50/30 transition-all cursor-pointer"
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-sm font-medium">Click to upload photo</span>
                  <span className="text-xs">JPG, PNG up to 2MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Maruti Swift, Toyota Innova" className={inputClass('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Type *</label>
                <select name="type" value={form.type} onChange={handleChange} className={inputClass('type')}>
                  <option value="2-Wheeler">2-Wheeler</option>
                  <option value="4-Wheeler">4-Wheeler</option>
                  <option value="6-Wheeler">6-Wheeler</option>
                  <option value="Heavy Vehicle">Heavy Vehicle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Capacity *</label>
                <input type="number" name="capacity" value={form.capacity} onChange={handleChange} placeholder="Seats" className={inputClass('capacity')} />
                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number Plate *</label>
              <input name="numberPlate" value={form.numberPlate} onChange={handleChange} placeholder="e.g. GJ05AB1234" className={inputClass('numberPlate')} />
              {errors.numberPlate && <p className="text-red-500 text-xs mt-1">{errors.numberPlate}</p>}
            </div>

            {/* NON-AC PRICING */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5" /> Non-AC / Standard Rates *
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rate / KM (₹)</label>
                  <input type="number" name="ratePerKm" value={form.ratePerKm} onChange={handleChange} placeholder="12" className={inputClass('ratePerKm')} />
                  {errors.ratePerKm && <p className="text-red-500 text-xs mt-1">{errors.ratePerKm}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rate / Day (₹)</label>
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
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-blue-500" /> This vehicle has AC
                  </p>
                  <p className="text-xs text-gray-400">Set different rates for AC usage</p>
                </div>
              </label>

              {form.hasAC && (
                <div className="px-3.5 pb-3.5">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5" /> AC Rates *
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">AC Rate / KM (₹)</label>
                      <input type="number" name="ratePerKmAC" value={form.ratePerKmAC} onChange={handleChange} placeholder="16" className={inputClass('ratePerKmAC')} />
                      {errors.ratePerKmAC && <p className="text-red-500 text-xs mt-1">{errors.ratePerKmAC}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">AC Rate / Day (₹)</label>
                      <input type="number" name="ratePerDayAC" value={form.ratePerDayAC} onChange={handleChange} placeholder="2000" className={inputClass('ratePerDayAC')} />
                      {errors.ratePerDayAC && <p className="text-red-500 text-xs mt-1">{errors.ratePerDayAC}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tank Capacity (L)</label>
                <input type="number" name="tankCapacity" value={form.tankCapacity} onChange={handleChange} placeholder="40" className={inputClass('tankCapacity')} />
                {errors.tankCapacity && <p className="text-red-500 text-xs mt-1">{errors.tankCapacity}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color *</label>
                <input name="color" value={form.color} onChange={handleChange} placeholder="White" className={inputClass('color')} />
                {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Operating Status</label>
              <select name="bookingStatus" value={form.bookingStatus} onChange={handleChange} className={inputClass('bookingStatus')}>
                <option value="Available">🟢 Available for Booking</option>
                <option value="Under Maintenance">⚫ Under Maintenance</option>
                {(form.bookingStatus === 'Booked' || form.bookingStatus === 'On Trip') && (
                  <>
                    <option value="Booked">🔴 Currently Booked</option>
                    <option value="On Trip">🟠 Currently On Trip</option>
                  </>
                )}
              </select>
              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" /> Booked/On Trip status is managed via the Bookings module.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Internal Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Maintenance notes, insurance info, etc." rows="2" className={inputClass('notes')}></textarea>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button type="submit" className={`flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all shadow-md ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editingId ? 'Save Changes' : 'Add to Fleet'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: LIST */}
      <div className="flex-1">
        {vehicles.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[500px]">
            <div className="bg-blue-50/50 p-6 rounded-full mb-5"><Car className="w-20 h-20 text-blue-500/80 stroke-[1.5]" /></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No vehicles added yet</h3>
            <p className="text-gray-500 max-w-sm text-center">Add your first vehicle using the form to start tracking your fleet and trips.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {vehicles.map((v) => {
              const { color: topColor, textBorder, icon: TypeIcon } = getTypeStyle(v.type);
              const stats = getStats(v.id);
              return (
                <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden flex flex-col hover:border-gray-200 transition-colors animate-fade-in-up">
                  <div className={`h-1.5 ${topColor}`}></div>

                  {/* VEHICLE PHOTO */}
                  {v.photo && (
                    <div className="relative h-44 overflow-hidden bg-gray-100">
                      <img src={v.photo} alt={v.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      <div className="absolute bottom-2 right-2">
                        {getStatusBadge(v.bookingStatus)}
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex-1 relative">
                    {!v.photo && (
                      <div className="absolute top-4 right-4">
                        {getStatusBadge(v.bookingStatus)}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${topColor} bg-opacity-10`}><TypeIcon className={`w-6 h-6 ${textBorder}`} /></div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 leading-tight pr-12">{v.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block bg-gray-100 text-gray-700 text-xs font-mono font-bold px-2 py-0.5 rounded-md border border-gray-200">
                              {v.numberPlate}
                            </span>
                            {v.hasAC && (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md border border-blue-200">
                                <Thermometer className="w-3 h-3" /> AC
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Non-AC Rate/KM</span>
                        <span className="font-bold text-gray-800">₹{v.ratePerKm}</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Non-AC Rate/Day</span>
                        <span className="font-bold text-gray-800">₹{v.ratePerDay}</span>
                      </div>
                      {v.hasAC && (
                        <>
                          <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                            <span className="text-blue-400 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">AC Rate/KM</span>
                            <span className="font-bold text-blue-700">₹{v.ratePerKmAC}</span>
                          </div>
                          <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                            <span className="text-blue-400 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">AC Rate/Day</span>
                            <span className="font-bold text-blue-700">₹{v.ratePerDayAC}</span>
                          </div>
                        </>
                      )}
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Type / Seats</span>
                        <span className="font-medium text-gray-800">{v.type} / {v.capacity}</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">Color / Tank</span>
                        <span className="font-medium text-gray-800">{v.color} / {v.tankCapacity}L</span>
                      </div>
                    </div>

                    <div className="bg-gray-50/80 rounded-xl p-4 grid grid-cols-3 gap-3 text-center text-sm border border-gray-100/50">
                      <div><span className="block text-2xl font-bold text-blue-600 mb-0.5">{stats.count}</span><span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Trips</span></div>
                      <div className="border-x border-gray-200/60"><span className="block text-2xl font-bold text-gray-800 mb-0.5">{stats.totalKm}</span><span className="text-xs font-medium text-gray-500 uppercase tracking-widest">KM</span></div>
                      <div><span className="block text-2xl font-bold text-green-600 mb-0.5">₹{stats.totalEarned}</span><span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Earned</span></div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50">
                    <button onClick={() => handleEdit(v)} className="py-3 flex justify-center items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => confirmDelete(v.id, v.name, v.numberPlate)} className="py-3 flex justify-center items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50/50 transition-colors">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    <button onClick={() => navigate(`/history?vehicleId=${v.id}`)} className="py-3 flex justify-center items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                      <Clock className="w-4 h-4" /> History
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
