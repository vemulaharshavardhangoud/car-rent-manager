import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Car, MapPin, Calendar, Navigation, Receipt, Calculator, AlertCircle, TrendingUp, DollarSign, RefreshCw, Save, Thermometer, Wind } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import CostComparison from '../components/CostComparison';

const initialForm = {
  vehicleId: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '',
  endDate: new Date().toISOString().split('T')[0],
  endTime: '',
  from: '',
  to: '',
  startOdo: '',
  endOdo: '',
  days: 1,
  billingMode: 'KM',
  fuelLitres: '',
  fuelPrice: '',
  tollTax: '',
  borderTax: '',
  driverAllowance: '',
  otherCharges: '',
  otherChargesLabel: '',
  customerName: '',
  customerPhone: '',
  purpose: 'Personal',
  acMode: false
};

const NewTrip = () => {
  const { vehicles, bookings, addTrip, updateTrip, showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const editTripData = location.state?.editTripData;
  
  const [form, setForm] = useState(editTripData || initialForm);
  const [errors, setErrors] = useState({});
  const [errorBoxMessages, setErrorBoxMessages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTripData, setCurrentTripData] = useState(null);

  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === form.vehicleId) || null;
  }, [form.vehicleId, vehicles]);

  // AUTO-CALCULATE DAYS
  useEffect(() => {
    if (form.date && form.endDate) {
      const start = new Date(form.date);
      const end = new Date(form.endDate);
      const diff = end.getTime() - start.getTime();
      const calculatedDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      const finalDays = calculatedDays >= 1 ? calculatedDays : 1;
      
      // Only update if it actually changed to avoid loop
      if (form.days !== finalDays) {
        setForm(prev => ({ ...prev, days: finalDays }));
      }
    }
  }, [form.date, form.endDate]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }
    setForm(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setErrorBoxMessages([]);
  };

  const handleModeChange = (mode) => {
    setForm(prev => ({ ...prev, billingMode: mode }));
  };

  const distance = useMemo(() => {
    const start = Number(form.startOdo) || 0;
    const end = Number(form.endOdo) || 0;
    return end >= start ? end - start : 0;
  }, [form.startOdo, form.endOdo]);

  const costs = useMemo(() => {
    let baseRent = 0;
    if (selectedVehicle) {
      const useAC = form.acMode && selectedVehicle.hasAC;
      const rateKm = useAC ? Number(selectedVehicle.ratePerKmAC) : Number(selectedVehicle.ratePerKm);
      const rateDay = useAC ? Number(selectedVehicle.ratePerDayAC) : Number(selectedVehicle.ratePerDay);
      if (form.billingMode === 'KM') {
        baseRent = distance * rateKm;
      } else {
        baseRent = (Number(form.days) || 1) * rateDay;
      }
    }
    
    const fuelCost = (Number(form.fuelLitres) || 0) * (Number(form.fuelPrice) || 0);
    const tollTax = Number(form.tollTax) || 0;
    const borderTax = Number(form.borderTax) || 0;
    const driverAllowance = (Number(form.driverAllowance) || 0) * (Number(form.days) || 1);
    const otherCharges = Number(form.otherCharges) || 0;
    
    const grandTotal = baseRent + tollTax + borderTax + driverAllowance + otherCharges;

    return { baseRent, fuelCost, tollTax, borderTax, driverAllowance, otherCharges, grandTotal };
  }, [form, distance, selectedVehicle]);

  const validate = () => {
    const newErrors = {};
    const messages = [];

    if (!form.vehicleId) { newErrors.vehicleId = 'Please select a vehicle'; messages.push('Vehicle must be selected'); }
    if (!form.date) { newErrors.date = 'Start date is required'; messages.push('Start Date must be selected'); }
    if (!form.endDate) { newErrors.endDate = 'End date is required'; messages.push('End Date must be selected'); }
    if (!form.endTime) { newErrors.endTime = 'End time is required'; messages.push('End Time must be selected'); }
    if (!form.from) { newErrors.from = 'Starting location is required'; messages.push('From location is required'); }
    if (!form.to) { newErrors.to = 'Destination is required'; messages.push('To location is required'); }
    
    if (form.startOdo === '' || Number(form.startOdo) < 0) {
      newErrors.startOdo = 'Valid start reading required';
      messages.push('Valid Starting Odometer is required');
    }
    if (form.endOdo === '' || Number(form.endOdo) < Number(form.startOdo)) {
      newErrors.endOdo = 'End reading must be > start reading';
      messages.push('Ending Odometer must be greater than Starting Odometer');
    }
    if (form.days === '' || Number(form.days) < 1) {
      newErrors.days = 'At least 1 day required';
      messages.push('Number of days must be at least 1');
    }

    // Check for Booking Conflicts
    if (selectedVehicle && !editTripData) {
      const start = new Date(`${form.date}T${form.startTime || '00:00'}`);
      const end = new Date(`${form.endDate}T${form.endTime || '23:59'}`);

      const hasBooking = bookings.find(b => {
        if (b.vehicleId !== form.vehicleId) return false;
        if (b.status === 'Rejected' || b.status === 'Cancelled') return false;

        const bStart = new Date(`${b.bookingStartDate}T${b.pickupTime || '00:00'}`);
        const bEnd = new Date(`${b.bookingEndDate}T${b.returnTime || '23:59'}`);

        return (start < bEnd && end > bStart);
      });

      if (hasBooking) {
        messages.push(`Warning: This vehicle has a Confirmed Booking for these dates (by ${hasBooking.customerName})`);
      }
    }

    setErrors(newErrors);
    
    if (messages.length > 0) {
      setErrorBoxMessages(messages);
      const mainElement = document.querySelector('main');
      if (mainElement) mainElement.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    
    setErrorBoxMessages([]);
    return true;
  };

  const handlePreview = (e) => {
    e.preventDefault();
    if (validate()) {
      const tripData = {
        id: editTripData ? editTripData.id : Date.now().toString(),
        ...form,
        distance,
        ...costs,
        vehicleName: selectedVehicle.name,
        numberPlate: selectedVehicle.numberPlate,
        vehicleType: selectedVehicle.type,
        capacity: selectedVehicle.capacity,
        ratePerKm: selectedVehicle.ratePerKm,
        ratePerDay: selectedVehicle.ratePerDay,
        receiptNumber: editTripData ? editTripData.receiptNumber : `REC-${Math.floor(Date.now() / 1000)}`,
        createdAt: editTripData ? editTripData.createdAt : new Date().toISOString()
      };
      setCurrentTripData(tripData);
      setIsModalOpen(true);
    }
  };

  const saveConfirmedTrip = async () => {
    if (currentTripData) {
      if (editTripData) {
        await updateTrip(currentTripData.id, currentTripData);
      } else {
        await addTrip(currentTripData);
      }
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    setErrorBoxMessages([]);
    setIsModalOpen(false);
    const mainElement = document.querySelector('main');
    if (mainElement) mainElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card-bg rounded-2xl shadow-sm border border-orange-500/20 max-w-2xl mx-auto mt-10">
        <div className="bg-orange-500/10 p-4 rounded-full mb-4">
          <AlertCircle className="w-12 h-12 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-text-main mb-2">No vehicles found!</h2>
        <p className="text-text-muted mb-6 text-center text-lg">You need to add at least one vehicle to your fleet before recording a trip.</p>
        <Link to="/vehicles" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/20">
          <Car className="w-5 h-5" />
          Go to Vehicles Page
        </Link>
      </div>
    );
  }

  const inputClass = (name) => `w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-main-bg/50 hover:bg-card-bg transition-colors ${errors[name] ? 'border-red-500 focus:ring-red-200 bg-red-500/10' : 'border-border-main focus:ring-blue-500/20 focus:border-blue-500'} text-text-main`;
  const labelClass = "block text-sm font-semibold text-text-main mb-1.5";

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-24 md:pb-12 animate-fade-in items-start">
      
      {/* LEFT COLUMN: FORM */}
      <div className="w-full md:w-[60%] bg-card-bg p-6 md:p-8 rounded-2xl shadow-sm border border-border-main">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-main">
          <div className="bg-blue-500/10 p-2.5 rounded-xl">
            <Calculator className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-main">New Trip Entry</h2>
            <p className="text-sm text-text-muted">Record a new journey and calculate charges</p>
          </div>
        </div>

        {errorBoxMessages.length > 0 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fade-in shadow-sm">
            <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Please correct the following errors:
            </h3>
            <ul className="list-disc list-inside text-sm text-red-400 space-y-1">
              {errorBoxMessages.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </div>
        )}

        <form className="space-y-8">
          
          {/* SECTION 1: VEHICLE */}
          <section className="bg-main-bg/30 p-5 rounded-2xl border border-border-main">
            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-text-muted" /> Select Vehicle *
            </h3>
            <div className="space-y-4">
              <div>
                <select name="vehicleId" required value={form.vehicleId} onChange={handleChange} className={inputClass('vehicleId')}>
                  <option value="">-- Choose a Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.numberPlate} (₹{v.ratePerKm}/km or ₹{v.ratePerDay}/day)
                    </option>
                  ))}
                </select>
                {errors.vehicleId && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.vehicleId}</p>}
              </div>

              {selectedVehicle && (
                <div className="space-y-4 animate-fade-in">
                  {/* PHOTO PREVIEW (SMALL) */}
                  {selectedVehicle.photos && selectedVehicle.photos.length > 0 && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                      <img src={selectedVehicle.photos[0]} alt={selectedVehicle.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* AC SELECTION */}
                  {selectedVehicle.hasAC && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, acMode: false }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold transition-all ${!form.acMode ? 'bg-card-bg border-blue-500 text-blue-600 shadow-sm' : 'bg-main-bg/50 border-border-main text-text-muted hover:bg-main-bg'}`}
                      >
                        <Wind className="w-4 h-4" /> Non-AC
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, acMode: true }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold transition-all ${form.acMode ? 'bg-blue-500 border-blue-600 text-white shadow-md' : 'bg-main-bg border-border-main text-text-muted hover:bg-card-bg'}`}
                      >
                        <Thermometer className="w-4 h-4" /> With AC
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card-bg rounded-xl border border-blue-500/20 shadow-sm">
                    <div>
                      <span className="block text-xs uppercase text-text-muted font-bold mb-1">Type</span>
                      <span className="font-semibold text-text-main">{selectedVehicle.type}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-text-muted font-bold mb-1">Capacity</span>
                      <span className="font-semibold text-text-main">{selectedVehicle.capacity} Seats</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-text-muted font-bold mb-1">Applied Rate</span>
                      <span className="font-bold text-blue-500">
                        ₹{form.billingMode === 'KM' 
                          ? (form.acMode ? selectedVehicle.ratePerKmAC : selectedVehicle.ratePerKm) 
                          : (form.acMode ? selectedVehicle.ratePerDayAC : selectedVehicle.ratePerDay)}
                        <span className="text-[10px] text-text-muted font-normal ml-0.5">/{form.billingMode}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-text-muted font-bold mb-1">Status</span>
                      <span className="font-semibold text-green-500 text-xs">Available</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: TRIP DETAILS */}
          <section>
            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-text-muted" /> Trip Routing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={labelClass}>Travel Start Date *</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass('date')} />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className={labelClass}>Start Time</label>
                <input type="text" name="startTime" value={form.startTime} onChange={handleChange} placeholder="e.g. 10:30 AM" className={inputClass('startTime')} />
              </div>

              <div>
                <label className={labelClass}>Travel End Date *</label>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={inputClass('endDate')} />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
              <div>
                <label className={labelClass}>End Time *</label>
                <input type="text" name="endTime" value={form.endTime} onChange={handleChange} placeholder="e.g. 11:45 PM" className={inputClass('endTime')} />
                {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
              </div>
              
              <div>
                <label className={labelClass}>From Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
                  <input type="text" name="from" value={form.from} onChange={handleChange} placeholder="e.g. Surat" className={`${inputClass('from')} pl-10`} />
                </div>
                {errors.from && <p className="text-red-500 text-xs mt-1">{errors.from}</p>}
              </div>
              
              <div>
                <label className={labelClass}>To Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
                  <input type="text" name="to" value={form.to} onChange={handleChange} placeholder="e.g. Ahmedabad" className={`${inputClass('to')} pl-10`} />
                </div>
                {errors.to && <p className="text-red-500 text-xs mt-1">{errors.to}</p>}
              </div>

              <div>
                <label className={labelClass}>Odometer Start (KM) *</label>
                <input type="number" name="startOdo" value={form.startOdo} onChange={handleChange} placeholder="e.g. 13569" className={inputClass('startOdo')} />
                {errors.startOdo && <p className="text-red-500 text-xs mt-1">{errors.startOdo}</p>}
              </div>

              <div>
                <label className={labelClass}>Odometer End (KM) *</label>
                <input type="number" name="endOdo" value={form.endOdo} onChange={handleChange} placeholder="e.g. 13968" className={inputClass('endOdo')} />
                {errors.endOdo && <p className="text-red-500 text-xs mt-1">{errors.endOdo}</p>}
              </div>
            </div>

            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 flex items-center justify-between mb-5">
              <span className="font-semibold text-blue-500">Total Distance</span>
              <span className="text-2xl font-bold text-blue-600">{distance} <span className="text-sm font-medium">KM</span></span>
            </div>

            <div>
              <label className={labelClass}>Number of Days *</label>
              <input type="number" name="days" value={form.days} min="1" onChange={handleChange} className={inputClass('days')} />
              {errors.days && <p className="text-red-500 text-xs mt-1">{errors.days}</p>}
            </div>
          </section>

          {/* SECTION 3: BILLING MODE */}
          <section>
            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-text-muted" /> Billing Mode
            </h3>
            <div className="flex bg-main-bg/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleModeChange('KM')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${form.billingMode === 'KM' ? 'bg-card-bg shadow-sm text-blue-600' : 'text-text-muted hover:text-text-main'}`}
              >
                Charge by KM
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('DAY')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${form.billingMode === 'DAY' ? 'bg-card-bg shadow-sm text-blue-600' : 'text-text-muted hover:text-text-main'}`}
              >
                Charge by Day
              </button>
            </div>
          </section>

          {/* SECTION 4: FUEL DETAILS */}
          <section>
            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-text-muted" /> Fuel Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div>
                <label className={labelClass}>Litres Filied</label>
                <input type="number" step="0.1" name="fuelLitres" value={form.fuelLitres} onChange={handleChange} placeholder="e.g. 5.5" className={inputClass('fuelLitres')} />
              </div>
              <div>
                <label className={labelClass}>Price Per Litre</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₹</span>
                  <input type="number" step="0.1" name="fuelPrice" value={form.fuelPrice} onChange={handleChange} placeholder="e.g. 96.50" className={`${inputClass('fuelPrice')} pl-8`} />
                </div>
              </div>
            </div>
            {costs.fuelCost > 0 && (
              <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20 flex items-center justify-between">
                <span className="font-semibold text-green-700 dark:text-green-400">Expected Fuel Cost</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">₹{costs.fuelCost.toFixed(2)}</span>
              </div>
            )}
          </section>

          {/* SECTION 5: TAX & EXTRA CHARGES */}
          <section>
            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-text-muted" /> Extra Charges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Toll Tax</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-text-muted font-medium">₹</span>
                  <input type="number" name="tollTax" value={form.tollTax} onChange={handleChange} placeholder="0" className={`${inputClass('tollTax')} pl-8`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Border Tax</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-text-muted font-medium">₹</span>
                  <input type="number" name="borderTax" value={form.borderTax} onChange={handleChange} placeholder="0" className={`${inputClass('borderTax')} pl-8`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Driver Allowance</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-text-muted font-medium">₹</span>
                  <input type="number" name="driverAllowance" value={form.driverAllowance} onChange={handleChange} placeholder="0" className={`${inputClass('driverAllowance')} pl-8`} />
                </div>
              </div>
              <div>
                 <div className="flex gap-2">
                    <div className="flex-1">
                      <label className={labelClass}>Other Charges</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-text-muted font-medium">₹</span>
                        <input type="number" name="otherCharges" value={form.otherCharges} onChange={handleChange} placeholder="0" className={`${inputClass('otherCharges')} pl-8`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className={labelClass}>Label</label>
                      <input type="text" name="otherChargesLabel" value={form.otherChargesLabel} onChange={handleChange} placeholder="e.g. Parking" className={inputClass('otherChargesLabel')} />
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: CUSTOMER DETAILS */}
          <section>
            <h3 className="text-lg font-bold text-text-main mb-4">Customer Details <span className="font-normal text-sm text-text-muted capitalize">(Optional)</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Customer Name</label>
                <input type="text" name="customerName" value={form.customerName} onChange={handleChange} placeholder="Name" className={inputClass('customerName')} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" name="customerPhone" value={form.customerPhone} onChange={handleChange} placeholder="10-digit number" className={inputClass('customerPhone')} />
              </div>
              <div>
                <label className={labelClass}>Purpose</label>
                <select name="purpose" value={form.purpose} onChange={handleChange} className={inputClass('purpose')}>
                  {['Personal', 'Business', 'Tourism', 'Airport Transfer', 'Wedding', 'Other'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

        </form>
      </div>

      {/* RIGHT COLUMN: ESTIMATE */}
      <div className="w-full md:w-[35%] shrink-0 md:sticky md:top-4 mt-8 lg:mt-0">
        <div className="bg-card-bg rounded-3xl shadow-xl shadow-blue-500/5 border border-border-main overflow-hidden">
          <div className="bg-main-bg text-text-main p-6 relative overflow-hidden border-b border-border-main">
            <div className="absolute -right-10 -top-10 bg-blue-500/10 w-40 h-40 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black mb-1">Trip Estimate</h3>
                <p className="text-text-muted transform font-mono text-xs">{form.date} {form.startTime} - {form.endDate} {form.endTime}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/10">
                <Receipt className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="p-6">
            
            <div className="bg-main-bg/50 rounded-2xl p-4 mb-6 border border-border-main">
              <div className="flex items-center justify-between mb-4">
                 <div>
                    <h4 className="font-bold text-text-main">{selectedVehicle?.name || 'No Vehicle'}</h4>
                    <span className="text-xs font-mono text-text-muted bg-main-bg px-2 py-0.5 rounded border border-border-main">{selectedVehicle?.numberPlate || '-'}</span>
                 </div>
                 <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{distance} <span className="text-sm">KM</span></div>
                    <div className="text-xs text-text-muted">{form.days} {form.days === 1 ? 'Day' : 'Days'}</div>
                 </div>
              </div>
              
              <div className="relative py-2 mt-4 border-t border-border-main flex justify-between items-center text-sm">
                 <div className="w-1/2 pr-2">
                   <p className="text-xs text-text-muted font-semibold mb-0.5 uppercase tracking-wider">From</p>
                   <p className="font-medium text-text-main truncate">{form.from || 'Origin'}</p>
                 </div>
                 <div className="absolute left-1/2 -ml-3 bg-card-bg px-1 border border-border-main rounded-full p-1 text-text-muted">
                    <Navigation className="w-3 h-3 transform rotate-90" />
                 </div>
                 <div className="w-1/2 pl-4 text-right">
                   <p className="text-xs text-text-muted font-semibold mb-0.5 uppercase tracking-wider">To</p>
                   <p className="font-medium text-text-main truncate">{form.to || 'Destination'}</p>
                 </div>
              </div>
            </div>

            <div className="space-y-4 text-sm px-2">
              <div className={`flex justify-between items-center p-2 rounded-lg transition-colors ${form.billingMode === 'KM' ? 'bg-blue-500/10 text-blue-500 font-medium' : 'text-text-muted font-medium'}`}>
                <span>Base Rent (by KM)</span>
                <span className={form.billingMode === 'KM' ? 'text-blue-500' : 'text-text-muted opacity-50'}>
                  {form.billingMode === 'KM' ? `₹${costs.baseRent}` : '-'}
                </span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg transition-colors ${form.billingMode === 'DAY' ? 'bg-blue-500/10 text-blue-500 font-medium' : 'text-text-muted font-medium'}`}>
                <span>Base Rent (by Day)</span>
                <span className={form.billingMode === 'DAY' ? 'text-blue-500' : 'text-text-muted opacity-50'}>
                  {form.billingMode === 'DAY' ? `₹${costs.baseRent}` : '-'}
                </span>
              </div>
              
              <div className={`flex justify-between px-2 ${costs.fuelCost > 0 ? 'text-text-main font-medium' : 'text-text-muted opacity-50'}`}>
                <span>Fuel Cost <span className="text-xs text-orange-500">(Not in total)</span></span>
                <span>₹{costs.fuelCost}</span>
              </div>
              <div className={`flex justify-between px-2 ${costs.tollTax > 0 ? 'text-text-main font-medium' : 'text-text-muted opacity-50'}`}>
                <span>Toll Tax</span>
                <span>₹{costs.tollTax}</span>
              </div>
              <div className={`flex justify-between px-2 ${costs.borderTax > 0 ? 'text-text-main font-medium' : 'text-text-muted opacity-50'}`}>
                <span>Border Tax</span>
                <span>₹{costs.borderTax}</span>
              </div>
              <div className={`flex justify-between px-2 ${costs.driverAllowance > 0 ? 'text-text-main font-medium' : 'text-text-muted opacity-50'}`}>
                <span>Driver Allowance</span>
                <span>₹{costs.driverAllowance}</span>
              </div>
              <div className={`flex justify-between px-2 ${costs.otherCharges > 0 ? 'text-text-main font-medium' : 'text-text-muted opacity-50'}`}>
                <span>{form.otherChargesLabel || 'Other Charges'}</span>
                <span>₹{costs.otherCharges}</span>
              </div>
            </div>

            <CostComparison 
              vehicle={selectedVehicle} 
              distance={distance} 
              days={form.days} 
              activeMode={form.billingMode} 
              activeAC={form.acMode} 
            />

            <div className="mt-8 pt-4 border-t-2 border-dashed border-border-main">
               <div className="flex justify-between items-center px-2">
                 <span className="text-text-muted font-bold uppercase tracking-wider">Grand Total</span>
                 <span className="text-3xl font-extrabold text-green-600 dark:text-green-400">₹{costs.grandTotal}</span>
               </div>
            </div>

            <div className="mt-8 space-y-3">
              <button 
                onClick={handlePreview} 
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Save className="w-5 h-5" /> Calculate & Preview
              </button>
              <button 
                onClick={handleReset}
                className="w-full py-3 bg-main-bg text-text-muted rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-card-bg transition-colors border border-border-main"
               >
                <RefreshCw className="w-4 h-4" /> Reset Form
              </button>
            </div>

          </div>
        </div>
      </div>
      
      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tripData={currentTripData}
        onSave={saveConfirmedTrip}
        onNewTrip={handleReset}
      />
    </div>
  );
};

export default NewTrip;
