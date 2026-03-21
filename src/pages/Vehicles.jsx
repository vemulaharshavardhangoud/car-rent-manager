import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Car, Edit, Trash2, Clock, CarFront, Truck, Bike, CalendarDays, XCircle } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { sendBookingConfirmationEmail, sendCancellationEmail } from '../utils/emailService';

const getToday = () => new Date().toISOString().split('T')[0];
const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const initialForm = {
  name: '', type: '4-Wheeler', capacity: '', numberPlate: '', 
  ratePerKm: '', ratePerDay: '', tankCapacity: '', color: '', notes: '',
  bookingStartDate: getToday(),
  bookingEndDate: getTomorrow(),
  bookingStatus: 'Available',
  bookedByName: '',
  bookedByPhone: '',
  advancePaid: 0,
  bookingNotes: '',
  bookingHistory: []
};

const Vehicles = () => {
  const { vehicles, allTrips, addVehicle, updateVehicle, deleteVehicle, showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: '' });

  // Cancel form state
  const [showCancelSection, setShowCancelSection] = useState(false);
  const [cancelForm, setCancelForm] = useState({
    cancellationDate: getToday(),
    cancellationReason: 'Customer Request',
    cancellationNotes: '',
    refundAmount: 0
  });
  const [cancelErrors, setCancelErrors] = useState({});

  useEffect(() => {
    if (showCancelSection) {
      setCancelForm(prev => ({ ...prev, refundAmount: form.advancePaid || 0 }));
    }
  }, [showCancelSection, form.advancePaid]);

  const bookingDays = useMemo(() => {
    if (!form.bookingStartDate || !form.bookingEndDate) return 0;
    const start = new Date(form.bookingStartDate);
    const end = new Date(form.bookingEndDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [form.bookingStartDate, form.bookingEndDate]);

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
    if (!form.ratePerKm || form.ratePerKm < 1) newErrors.ratePerKm = 'Min rate is 1.';
    if (!form.ratePerDay || form.ratePerDay < 1) newErrors.ratePerDay = 'Min rate is 1.';
    if (!form.tankCapacity || form.tankCapacity < 1) newErrors.tankCapacity = 'Min 1.';
    if (!form.color) newErrors.color = 'Color is required.';
    if (form.notes && form.notes.length > 200) newErrors.notes = 'Notes max 200 chars.';

    // Booking validations
    if (!form.bookingStartDate) newErrors.bookingStartDate = 'Required';
    else if (form.bookingStartDate < getToday()) newErrors.bookingStartDate = 'Cannot be past date';

    if (!form.bookingEndDate) newErrors.bookingEndDate = 'Required';
    else if (form.bookingEndDate < form.bookingStartDate) newErrors.bookingEndDate = 'End date cannot be before start date';

    if (form.bookingStatus === 'Booked' || form.bookingStatus === 'On Trip') {
      if (!form.bookedByName) newErrors.bookedByName = 'Customer name required';
      if (!form.bookedByPhone) newErrors.bookedByPhone = 'Phone required';
      else if (!/^\d{10}$/.test(form.bookedByPhone)) newErrors.bookedByPhone = 'Must be exactly 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCancel = () => {
    let errs = {};
    if (!cancelForm.cancellationDate) errs.cancellationDate = 'Required';
    else if (cancelForm.cancellationDate < form.bookingStartDate) errs.cancellationDate = 'Cannot be before booking start date';
    if (!cancelForm.cancellationReason) errs.cancellationReason = 'Required';

    setCancelErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'numberPlate') finalValue = value.toUpperCase();
    if (name === 'advancePaid') finalValue = value === '' ? 0 : Number(value);
    
    setForm(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleCancelChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'refundAmount') finalValue = value === '' ? 0 : Number(value);
    setCancelForm(prev => ({ ...prev, [name]: finalValue }));
    if (cancelErrors[name]) setCancelErrors(prev => ({ ...prev, [name]: null }));
  };

  const notifyEmail = async (subject, funcCall) => {
    try {
      await funcCall();
      showToast(`Notification email sent to admin`, 'success');
    } catch (err) {
      showToast(`Action saved but email failed. Check EmailJS setup.`, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      let submitForm = { ...form, bookingDays };
      
      const isNewBooking = (form.bookingStatus === 'Booked' || form.bookingStatus === 'On Trip');
      let justBooked = false;

      // Handle booking history
      if (isNewBooking) {
         // Check if it's already in history (by matching active state)
         const originalVehicle = vehicles.find(v => v.id === editingId);
         const wasAlreadyBooked = originalVehicle && (originalVehicle.bookingStatus === 'Booked' || originalVehicle.bookingStatus === 'On Trip');
         
         if (!wasAlreadyBooked) {
             justBooked = true;
             const historyEntry = {
                bookingId: `b_${Date.now()}`,
                startDate: form.bookingStartDate,
                endDate: form.bookingEndDate,
                days: bookingDays,
                customerName: form.bookedByName,
                customerPhone: form.bookedByPhone,
                advancePaid: form.advancePaid,
                notes: form.bookingNotes,
                status: form.bookingStatus,
                createdAt: new Date().toISOString(),
                cancellation: null
             };
             submitForm.bookingHistory = [...(form.bookingHistory || []), historyEntry];
         }
      }

      if (editingId) {
        updateVehicle(editingId, submitForm);
      } else {
        const savedV = addVehicle(submitForm);
        // Note: AppContext addVehicle doesn't return value in earlier code. We just simulate email here.
      }

      if (justBooked) {
        notifyEmail('Booking Confirmed', () => sendBookingConfirmationEmail(submitForm, {
          ...submitForm, startDate: submitForm.bookingStartDate, endDate: submitForm.bookingEndDate, days: bookingDays, notes: submitForm.bookingNotes, customerName: submitForm.bookedByName, customerPhone: submitForm.bookedByPhone
        }));
      } else {
        showToast(editingId ? 'Vehicle updated' : 'Vehicle added');
      }

      cancelEdit();
    }
  };

  const confirmCancellation = async () => {
    if (validateCancel()) {
       let updatedHistory = [...(form.bookingHistory || [])];
       let lastBooking = null;

       if (updatedHistory.length > 0) {
           lastBooking = updatedHistory[updatedHistory.length - 1];
           updatedHistory[updatedHistory.length - 1] = {
               ...updatedHistory[updatedHistory.length - 1],
               cancellation: {
                   cancelledOn: cancelForm.cancellationDate,
                   reason: cancelForm.cancellationReason,
                   notes: cancelForm.cancellationNotes,
                   refundAmount: cancelForm.refundAmount,
                   cancelledAt: new Date().toISOString()
               }
           };
       }

       const submitForm = {
           ...form,
           bookingStatus: 'Available',
           cancellationDate: cancelForm.cancellationDate,
           cancellationReason: cancelForm.cancellationReason,
           cancellationNotes: cancelForm.cancellationNotes,
           refundAmount: cancelForm.refundAmount,
           cancelledAt: new Date().toISOString(),
           bookingHistory: updatedHistory,
           // Clear active booked info safely
           bookedByName: '', bookedByPhone: '', advancePaid: 0, bookingNotes: ''
       };

       updateVehicle(editingId, submitForm);
       
       if (lastBooking) {
           notifyEmail('Booking Cancelled', () => sendCancellationEmail(submitForm, {
               ...lastBooking
           }, submitForm));
       }

       showToast('Booking cancelled successfully', 'success');
       cancelEdit();
       setShowCancelSection(false);
    }
  };

  const handleEdit = (vehicle) => {
    setForm({
      ...initialForm,
      ...vehicle,
      bookingStartDate: vehicle.bookingStartDate || getToday(),
      bookingEndDate: vehicle.bookingEndDate || getTomorrow(),
      bookingStatus: vehicle.bookingStatus || 'Available'
    });
    setEditingId(vehicle.id);
    setErrors({});
    setShowCancelSection(false);
  };

  const cancelEdit = () => {
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
    setShowCancelSection(false);
  };

  const handleDelete = () => {
    deleteVehicle(deleteDialog.id);
    if (editingId === deleteDialog.id) cancelEdit();
    setDeleteDialog({ isOpen: false, id: null, name: '' });
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
      case 'Available':
      default: return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">Available</span>;
    }
  };

  const inputClass = (name) => `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 hover:bg-white transition-colors ${errors[name] ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500'}`;
  const cancelInputClass = (name) => `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 hover:bg-white transition-colors ${cancelErrors[name] ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-200 focus:ring-red-100 focus:border-red-400'}`;

  const showCustomerDetails = form.bookingStatus === 'Booked' || form.bookingStatus === 'On Trip';

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-12 animate-fade-in items-start">
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-[450px] shrink-0 space-y-4">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Car className="w-5 h-5 text-gray-500" />
            {editingId ? 'Edit Vehicle Info' : 'Add New Vehicle'}
          </h2>
          <form id="vehicleForm" onSubmit={handleSubmit} className="space-y-4">
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
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rate Per Day *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 font-medium">₹</span>
                  <input type="number" name="ratePerDay" value={form.ratePerDay} onChange={handleChange} placeholder="1000" className={`${inputClass('ratePerDay')} pl-8`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tank Cap. (L) *</label>
                <input type="number" name="tankCapacity" value={form.tankCapacity} onChange={handleChange} placeholder="40" className={inputClass('tankCapacity')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color *</label>
                <input name="color" value={form.color} onChange={handleChange} placeholder="White" className={inputClass('color')} />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100">
               <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-500"/> Booking Configuration</h3>
               
               <div className="mb-4">
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5">Booking Status</label>
                 <select name="bookingStatus" value={form.bookingStatus} onChange={handleChange} className={inputClass('bookingStatus')}>
                   <option value="Available" className="text-green-600 font-bold">🟢 Available</option>
                   <option value="Booked" className="text-red-600 font-bold">🔴 Booked</option>
                   <option value="On Trip" className="text-orange-600 font-bold">🟠 On Trip</option>
                   <option value="Under Maintenance" className="text-gray-600 font-bold">⚫ Under Maintenance</option>
                 </select>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date *</label>
                   <input type="date" name="bookingStartDate" value={form.bookingStartDate} onChange={handleChange} className={inputClass('bookingStartDate')} />
                   {errors.bookingStartDate && <p className="text-red-500 text-xs mt-1 leading-tight">{errors.bookingStartDate}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date *</label>
                   <input type="date" name="bookingEndDate" value={form.bookingEndDate} onChange={handleChange} className={inputClass('bookingEndDate')} />
                   {errors.bookingEndDate && <p className="text-red-500 text-xs mt-1 leading-tight">{errors.bookingEndDate}</p>}
                 </div>
               </div>
               
               <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex justify-between items-center mb-4">
                 <span className="text-sm font-semibold text-blue-800">Total Booking Days</span>
                 <span className="font-bold text-blue-700 bg-white px-3 py-1 rounded shadow-sm">{bookingDays} Days</span>
               </div>

               {showCustomerDetails && (
                 <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200/60 mb-4 animate-fade-in">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Name *</label>
                      <input type="text" name="bookedByName" value={form.bookedByName} onChange={handleChange} placeholder="Full name of customer" className={inputClass('bookedByName')} />
                      {errors.bookedByName && <p className="text-red-500 text-xs mt-1">{errors.bookedByName}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Phone *</label>
                        <input type="tel" name="bookedByPhone" value={form.bookedByPhone} onChange={handleChange} placeholder="10 digits" className={inputClass('bookedByPhone')} />
                        {errors.bookedByPhone && <p className="text-red-500 text-xs mt-1 leading-tight">{errors.bookedByPhone}</p>}
                      </div>
                      <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-1.5">Advance Paid (₹)</label>
                         <input type="number" name="advancePaid" value={form.advancePaid} onChange={handleChange} placeholder="0" min="0" className={inputClass('advancePaid')} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Booking Notes</label>
                      <textarea name="bookingNotes" value={form.bookingNotes} onChange={handleChange} placeholder="Any special instructions..." rows="2" className={inputClass('bookingNotes')}></textarea>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex gap-3 pt-4 mt-6 border-t border-gray-100">
              <button type="submit" form="vehicleForm" className={`flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all shadow-sm ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editingId ? 'Update & Save' : 'Add Vehicle'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="py-3 px-5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* CANCELLATION SECTION */}
        {editingId && showCustomerDetails && !showCancelSection && (
           <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm animate-fade-in text-center">
             <p className="text-sm text-red-800 font-medium mb-3">Need to cancel this active booking?</p>
             <button type="button" onClick={() => setShowCancelSection(true)} className="w-full py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-sm hover:bg-red-700 transition">
               Cancel This Booking
             </button>
           </div>
        )}

        {showCancelSection && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-red-200 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
            <h3 className="text-xl font-bold text-red-700 flex items-center gap-2 mb-4 relative z-10">
              <XCircle className="w-5 h-5"/> Process Cancellation
            </h3>
            
            <div className="space-y-4 relative z-10">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-800 mb-1.5">Cancel Date *</label>
                   <input type="date" name="cancellationDate" value={cancelForm.cancellationDate} onChange={handleCancelChange} className={cancelInputClass('cancellationDate')}/>
                   {cancelErrors.cancellationDate && <p className="text-red-500 text-xs mt-1">{cancelErrors.cancellationDate}</p>}
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-800 mb-1.5">Refund (₹)</label>
                   <input type="number" name="refundAmount" value={cancelForm.refundAmount} onChange={handleCancelChange} min="0" className={cancelInputClass('refundAmount')}/>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-800 mb-1.5">Reason *</label>
                 <select name="cancellationReason" value={cancelForm.cancellationReason} onChange={handleCancelChange} className={cancelInputClass('cancellationReason')}>
                   <option>Customer Request</option>
                   <option>Vehicle Breakdown</option>
                   <option>Weather Condition</option>
                   <option>Double Booking Error</option>
                   <option>Payment Not Received</option>
                   <option>Other</option>
                 </select>
                 {cancelErrors.cancellationReason && <p className="text-red-500 text-xs mt-1">{cancelErrors.cancellationReason}</p>}
               </div>
               
               <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">Cancel Notes</label>
                  <textarea name="cancellationNotes" value={cancelForm.cancellationNotes} onChange={handleCancelChange} rows="2" placeholder="Additional details..." className={cancelInputClass('cancellationNotes')}></textarea>
               </div>

               <div className="flex gap-3 pt-2">
                  <button type="button" onClick={confirmCancellation} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow transition">
                    Confirm Cancellation
                  </button>
                  <button type="button" onClick={() => setShowCancelSection(false)} className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition">
                    Go Back
                  </button>
               </div>
            </div>
          </div>
        )}

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
                  <div className="p-5 flex-1 relative">
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(v.bookingStatus)}
                    </div>
                    
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${topColor} bg-opacity-10`}><TypeIcon className={`w-7 h-7 ${textBorder}`} /></div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 leading-tight pr-12">{v.name}</h3>
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
                      <div><span className="block text-2xl font-bold text-blue-600 mb-0.5">{stats.count}</span><span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Trips</span></div>
                      <div className="border-x border-gray-200/60 shadow-sm"><span className="block text-2xl font-bold text-gray-800 mb-0.5">{stats.totalKm}</span><span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Total KM</span></div>
                      <div><span className="block text-2xl font-bold text-green-600 mb-0.5">₹{stats.totalEarned}</span><span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Earned</span></div>
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
