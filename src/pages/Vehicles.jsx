import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Car, Edit, Trash2, Clock, CarFront, Truck, Bike } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

const initialForm = {
  name: '', type: '4-Wheeler', capacity: '', numberPlate: '', 
  ratePerKm: '', ratePerDay: '', tankCapacity: '', color: '', notes: ''
};

const Vehicles = () => {
  const { vehicles, allTrips, addVehicle, updateVehicle, deleteVehicle } = useContext(AppContext);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: '' });

  const validate = () => {
    let newErrors = {};
    if (!form.name || form.name.length < 2) newErrors.name = 'Name must be at least 2 chars.';
    if (!form.type) newErrors.type = 'Type is required.';
    if (!form.capacity || form.capacity < 1 || form.capacity > 60) newErrors.capacity = 'Capacity: 1-60.';
    if (!form.numberPlate) newErrors.numberPlate = 'Number Plate is required.';
    else {
      // Check duplicate
      const duplicate = vehicles.find(v => v.numberPlate === form.numberPlate && v.id !== editingId);
      if (duplicate) newErrors.numberPlate = 'Number Plate already exists.';
    }
    if (!form.ratePerKm || form.ratePerKm < 1) newErrors.ratePerKm = 'Min rate is 1.';
    if (!form.ratePerDay || form.ratePerDay < 1) newErrors.ratePerDay = 'Min rate is 1.';
    if (!form.tankCapacity || form.tankCapacity < 1) newErrors.tankCapacity = 'Min 1.';
    if (!form.color) newErrors.color = 'Color is required.';
    if (form.notes && form.notes.length > 200) newErrors.notes = 'Notes max 200 chars.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'numberPlate') {
      finalValue = value.toUpperCase();
    }
    setForm(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      if (editingId) {
        updateVehicle(editingId, form);
        setEditingId(null);
      } else {
        addVehicle(form);
      }
      setForm(initialForm);
      setErrors({});
    }
  };

  const handleEdit = (vehicle) => {
    setForm(vehicle);
    setEditingId(vehicle.id);
    setErrors({});
  };

  const cancelEdit = () => {
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
  };

  const confirmDelete = (id, name) => {
    setDeleteDialog({ isOpen: true, id, name });
  };

  const handleDelete = () => {
    deleteVehicle(deleteDialog.id);
    setDeleteDialog({ isOpen: false, id: null, name: '' });
    if (editingId === deleteDialog.id) {
        cancelEdit();
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

  const inputClass = (name) => `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 hover:bg-white transition-colors ${errors[name] ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500'}`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-12 animate-fade-in">
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-[400px] shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
        <h2 className="text-xl font-bold mb-6 text-gray-800">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ">Vehicle Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Swift, Innova, Activa" className={inputClass('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.name}</p>}
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
              {errors.type && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.type}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Capacity *</label>
              <input type="number" name="capacity" value={form.capacity} onChange={handleChange} placeholder="e.g. 4" className={inputClass('capacity')} />
              {errors.capacity && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.capacity}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number Plate *</label>
            <input name="numberPlate" value={form.numberPlate} onChange={handleChange} placeholder="e.g. GJ05AB1234" className={inputClass('numberPlate')} />
            {errors.numberPlate && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.numberPlate}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rate Per KM *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 font-medium">₹</span>
                <input type="number" name="ratePerKm" value={form.ratePerKm} onChange={handleChange} placeholder="10" className={`${inputClass('ratePerKm')} pl-8`} />
              </div>
              {errors.ratePerKm && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.ratePerKm}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rate Per Day *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 font-medium">₹</span>
                <input type="number" name="ratePerDay" value={form.ratePerDay} onChange={handleChange} placeholder="1000" className={`${inputClass('ratePerDay')} pl-8`} />
              </div>
              {errors.ratePerDay && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.ratePerDay}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tank Cap. (L) *</label>
              <input type="number" name="tankCapacity" value={form.tankCapacity} onChange={handleChange} placeholder="40" className={inputClass('tankCapacity')} />
              {errors.tankCapacity && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.tankCapacity}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color *</label>
              <input name="color" value={form.color} onChange={handleChange} placeholder="White" className={inputClass('color')} />
              {errors.color && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.color}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any additional notes..." rows="3" className={inputClass('notes')}></textarea>
            {errors.notes && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.notes}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={`flex-1 py-2.5 px-4 rounded-xl text-white font-medium transition-all shadow-sm ${editingId ? 'bg-green-500 hover:bg-green-600 hover:shadow' : 'bg-blue-600 hover:bg-blue-700 hover:shadow'}`}>
              {editingId ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="py-2.5 px-5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT SIDE: LIST */}
      <div className="flex-1">
        {vehicles.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[500px]">
            <div className="bg-blue-50/50 p-6 rounded-full mb-5">
              <Car className="w-20 h-20 text-blue-500/80 stroke-[1.5]" />
            </div>
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
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${topColor} bg-opacity-10`}>
                          <TypeIcon className={`w-7 h-7 ${textBorder}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 leading-tight">{v.name}</h3>
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs font-mono font-bold px-2.5 py-1 rounded-md mt-1.5 border border-gray-200">
                            {v.numberPlate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-x-2 gap-y-4 mb-6 text-sm">
                      <div><span className="text-gray-400 block text-xs mb-0.5 uppercase tracking-wider font-semibold">Type</span><span className="font-medium text-gray-800">{v.type}</span></div>
                      <div><span className="text-gray-400 block text-xs mb-0.5 uppercase tracking-wider font-semibold">Capacity</span><span className="font-medium text-gray-800">{v.capacity} Seats</span></div>
                      <div><span className="text-gray-400 block text-xs mb-0.5 uppercase tracking-wider font-semibold">Tank</span><span className="font-medium text-gray-800">{v.tankCapacity}L</span></div>
                      <div><span className="text-gray-400 block text-xs mb-0.5 uppercase tracking-wider font-semibold">Rate / KM</span><span className="font-medium text-gray-800">₹{v.ratePerKm}</span></div>
                      <div><span className="text-gray-400 block text-xs mb-0.5 uppercase tracking-wider font-semibold">Rate / Day</span><span className="font-medium text-gray-800">₹{v.ratePerDay}</span></div>
                      <div><span className="text-gray-400 block text-xs mb-0.5 uppercase tracking-wider font-semibold">Color</span><span className="font-medium text-gray-800">{v.color}</span></div>
                    </div>

                    <div className="bg-gray-50/80 rounded-xl p-4 grid grid-cols-3 gap-3 text-center text-sm border border-gray-100/50">
                      <div>
                        <span className="block text-2xl font-bold text-blue-600 mb-0.5">{stats.count}</span>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Trips</span>
                      </div>
                      <div className="border-x border-gray-200/60 shadow-sm">
                        <span className="block text-2xl font-bold text-gray-800 mb-0.5">{stats.totalKm}</span>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Total KM</span>
                      </div>
                      <div>
                        <span className="block text-2xl font-bold text-green-600 mb-0.5">₹{stats.totalEarned}</span>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Earned</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50">
                    <button onClick={() => handleEdit(v)} className="py-3 flex justify-center items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => confirmDelete(v.id, v.name)} className="py-3 flex justify-center items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50/50 transition-colors">
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

      <ConfirmDialog 
        isOpen={deleteDialog.isOpen}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${deleteDialog.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null, name: '' })}
      />
    </div>
  );
};

export default Vehicles;
