import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  Car, User, Phone, Calendar, Clock, AlertCircle, 
  CheckCircle2, ArrowRight, IndianRupee, Info, MapPin, Wind
} from 'lucide-react';

const NewBooking = () => {
  const { vehicles, bookings, addBooking, showToast } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get vehicleId from URL if present
  const queryParams = new URLSearchParams(location.search);
  const preSelectedVehicleId = queryParams.get('vehicleId');

  const [formData, setFormData] = useState({
    vehicleId: preSelectedVehicleId || '',
    customerName: '',
    customerPhone: '',
    pickupDate: '',
    pickupTime: '10:00',
    pickupLocation: '',
    returnDate: '',
    returnTime: '10:00',
    returnLocation: '',
    customerEmail: '',
    specialInstructions: '',
    useAC: false,
  });

  const [estimatedCost, setEstimatedCost] = useState(0);
  const [conflict, setConflict] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [submittedVehicleName, setSubmittedVehicleName] = useState('');

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  // Calculate Estimation & Check Conflict
  useEffect(() => {
    if (formData.vehicleId && formData.pickupDate && formData.returnDate) {
      const start = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const end = new Date(`${formData.returnDate}T${formData.returnTime}`);
      
      if (end >= start) {
        // Estimation (Match Owner Portal logic: ceil(diff) + 1, min 1)
        const diffTime = Math.max(0, end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 
        
        if (selectedVehicle) {
          const rateDay = formData.useAC ? (Number(selectedVehicle.ratePerDayAC) || Number(selectedVehicle.ratePerDay) || 0) : (Number(selectedVehicle.ratePerDay) || 0);
          const total = diffDays * rateDay;
          setEstimatedCost(total);
        }

        // Conflict Check
        const hasConflict = bookings.find(b => {
          if (b.vehicleId !== formData.vehicleId) return false;
          if (b.status === 'Rejected' || b.status === 'Cancelled') return false;

          const bStart = new Date(`${b.bookingStartDate}T${b.pickupTime || '00:00'}`);
          const bEnd = new Date(`${b.bookingEndDate}T${b.returnTime || '23:59'}`);

          return (start < bEnd && end > bStart);
        });

        setConflict(hasConflict ? 'This vehicle is already booked for the selected dates.' : null);
      } else {
        setEstimatedCost(0);
        setConflict(null);
      }
    }
  }, [formData, selectedVehicle, bookings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (conflict) {
      showToast('Please resolve the date conflict first.', 'error');
      return;
    }

    const start = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
    const end = new Date(`${formData.returnDate}T${formData.returnTime}`);
    if (end <= start) {
      showToast('Return date must be after pickup date.', 'error');
      return;
    }

    const newBooking = {
      ...formData,
      vehicleName: selectedVehicle.name,
      numberPlate: selectedVehicle.numberPlate,
      bookingStartDate: formData.pickupDate,
      bookingEndDate: formData.returnDate,
      status: 'Pending',
      totalAmount: estimatedCost,
      estimatedCost: estimatedCost,
      source: 'Customer Portal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await addBooking(newBooking);
    if (result) {
      setBookingId(result.id);
      setSubmittedVehicleName(`${selectedVehicle.name} (${selectedVehicle.numberPlate})`);
      setIsSubmitted(true);
      showToast('Booking request submitted successfully!');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in">
        <div className="bg-card-bg border border-border-main rounded-[3rem] p-10 lg:p-16 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden text-text-main">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="w-24 h-24 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>

          <h1 className="text-4xl font-black tracking-tight mb-4">Booking <span className="text-emerald-500">Submitted!</span></h1>
          <p className="text-text-muted font-medium text-lg mb-10">Your request has been sent to the owner for approval.</p>

          <div className="bg-main-bg/50 rounded-3xl border border-border-main p-8 mb-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Booking ID</p>
              <p className="text-xl font-black tracking-tight">{bookingId}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Vehicle</p>
              <p className="text-sm font-bold text-text-main">{submittedVehicleName}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Duration</p>
              <p className="text-sm font-bold">{formData.pickupDate} to {formData.returnDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Estimated Cost</p>
              <p className="text-xl font-black text-emerald-500 tracking-tight">₹{estimatedCost}</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center gap-3 mx-auto"
          >
            Back to Dashboard <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 text-text-main">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">New <span className="text-blue-600">Booking</span></h1>
        <p className="text-text-muted font-medium">Fill in the details below to request a vehicle.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card-bg border border-border-main rounded-[2.5rem] p-8 space-y-8 shadow-xl">
            {/* Vehicle Selection */}
            <div className="space-y-4">
              <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <Car className="w-4 h-4" /> Select Vehicle
              </label>
              <select 
                value={formData.vehicleId}
                onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                className="w-full bg-main-bg border border-border-main rounded-2xl py-4 px-6 text-text-main font-medium focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                required
              >
                <option value="" disabled className="bg-card-bg">Choose a vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-card-bg">
                    {v.name} ({v.numberPlate}) - {v.status || 'Available'} - ₹{v.ratePerDay}/day
                  </option>
                ))}
              </select>
            </div>

            {/* AC Toggle */}
            {selectedVehicle?.hasAC && (
              <div className={`p-6 rounded-3xl border transition-all ${formData.useAC ? 'bg-blue-600/10 border-blue-500/20' : 'bg-main-bg/50 border-border-main'}`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.useAC ? 'bg-blue-500 text-white' : 'bg-main-bg text-text-muted'}`}>
                      <Wind className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold">Use Air Conditioning?</h4>
                      <p className="text-text-muted text-xs">AC Rate: ₹{selectedVehicle.ratePerDayAC}/day</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.useAC}
                    onChange={(e) => setFormData({...formData, useAC: e.target.checked})}
                    className="w-6 h-6 rounded-lg bg-main-bg border-border-main text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            )}

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Enter your name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="w-full bg-main-bg border border-border-main rounded-2xl py-4 pl-12 pr-4 text-text-main font-medium focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    className="w-full bg-main-bg border border-border-main rounded-2xl py-4 pl-12 pr-4 text-text-main font-medium focus:border-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <User className="w-4 h-4" /> Email Address (Optional)
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email"
                  placeholder="your@email.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  className="w-full bg-main-bg border border-border-main rounded-2xl py-4 pl-12 pr-4 text-text-main font-medium focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-main-bg/50 rounded-[2rem] border border-border-main">
              <div className="space-y-4">
                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" /> Pickup Location
                </label>
                <input 
                  type="text"
                  placeholder="Where should we bring the car?"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
                  className="w-full bg-main-bg border border-border-main rounded-xl py-3 px-4 text-text-main text-sm focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" /> Return Location
                </label>
                <input 
                  type="text"
                  placeholder="Where will you return it?"
                  value={formData.returnLocation}
                  onChange={(e) => setFormData({...formData, returnLocation: e.target.value})}
                  className="w-full bg-main-bg border border-border-main rounded-xl py-3 px-4 text-text-main text-sm focus:border-emerald-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-main-bg/50 rounded-[2rem] border border-border-main">
              <div className="space-y-4">
                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" /> Pickup
                </label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    value={formData.pickupDate}
                    onChange={(e) => setFormData({...formData, pickupDate: e.target.value})}
                    className="flex-1 bg-main-bg border border-border-main rounded-xl py-3 px-4 text-text-main text-sm focus:border-blue-500 outline-none"
                    required
                  />
                  <input 
                    type="time"
                    value={formData.pickupTime}
                    onChange={(e) => setFormData({...formData, pickupTime: e.target.value})}
                    className="w-24 bg-main-bg border border-border-main rounded-xl py-3 px-4 text-text-main text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" /> Return
                </label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                    className="flex-1 bg-main-bg border border-border-main rounded-xl py-3 px-4 text-text-main text-sm focus:border-emerald-500 outline-none"
                    required
                  />
                  <input 
                    type="time"
                    value={formData.returnTime}
                    onChange={(e) => setFormData({...formData, returnTime: e.target.value})}
                    className="w-24 bg-main-bg border border-border-main rounded-xl py-3 px-4 text-text-main text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-4">
              <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <Info className="w-4 h-4" /> Special Instructions
              </label>
              <textarea 
                placeholder="Any special requests or details about your trip?"
                value={formData.specialInstructions}
                onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                className="w-full bg-main-bg border border-border-main rounded-2xl py-4 px-6 text-text-main font-medium focus:border-blue-500 outline-none transition-all min-h-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Actions */}
        <div className="space-y-6">
          <div className="bg-card-bg border border-border-main rounded-[2.5rem] p-8 shadow-xl sticky top-8">
            <h3 className="text-lg font-black text-text-main tracking-tight mb-8">Booking Summary</h3>
            
            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center pb-4 border-b border-border-main">
                <span className="text-text-muted text-sm font-medium">Vehicle Rate</span>
                <span className="text-text-main font-bold">₹{formData.useAC ? (selectedVehicle?.ratePerDayAC || selectedVehicle?.ratePerDay) : (selectedVehicle?.ratePerDay || 0)}/day</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border-main">
                <span className="text-text-muted text-sm font-medium">Estimated Total</span>
                <span className="text-2xl font-black text-blue-500">₹{estimatedCost}</span>
              </div>
            </div>

            {conflict && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 mb-8 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-red-500 text-xs font-bold leading-relaxed">{conflict}</p>
              </div>
            )}

            {!conflict && formData.vehicleId && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 mb-8">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-emerald-500 text-xs font-bold leading-relaxed">Available for your selected dates!</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={!!conflict || !formData.vehicleId || !formData.pickupDate || !formData.returnDate}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
                conflict || !formData.vehicleId
                  ? 'bg-main-bg border border-border-main text-text-muted cursor-not-allowed opacity-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-500/10'
              }`}
            >
              Confirm Booking <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="mt-8 flex gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
              </div>
              <p className="text-[10px] text-text-muted font-medium leading-relaxed">
                By submitting, you agree to our terms. The owner will review your request and contact you via phone.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewBooking;
