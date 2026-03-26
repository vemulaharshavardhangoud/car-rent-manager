import React, { useState, useContext, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import * as storage from '../utils/storage';
import * as emailApi from '../utils/emailApi';
import { 
  Plus, Search, Filter, Calendar, CalendarDays, 
  Download, Car, User, Phone, Mail, 
  MapPin, Clock, CreditCard, Info, 
  ChevronLeft, ChevronRight, MoreVertical, 
  Eye, Pencil, X, Trash2, CheckCircle2, 
  AlertCircle, ArrowRight, Printer, AlertTriangle, Wind, Thermometer, TrendingUp
} from 'lucide-react';
import { usePasswordProtection } from '../hooks/usePasswordProtection';
import CostComparison from '../components/CostComparison';

const Bookings = () => {
  const { vehicles, bookings, customers, addBooking, updateBooking, cancelBooking, deleteBooking, showToast } = useContext(AppContext);
  const { requirePassword } = usePasswordProtection();

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);
  const [cancelBookingItem, setCancelBookingItem] = useState(null);
  const [showCustomerList, setShowCustomerList] = useState(false);

  const location = useLocation();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Handle URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [location]);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Form State
  const initialForm = {
    vehicleId: '',
    vehicleName: '',
    numberPlate: '',
    vehicleType: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    bookingStartDate: new Date().toISOString().split('T')[0],
    bookingEndDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickupTime: '09:00',
    returnTime: '09:00',
    pickupLocation: '',
    dropLocation: '',
    billingMode: 'perDay',
    estimatedDistance: '',
    advancePaid: 0,
    paymentMode: 'Cash',
    status: 'Confirmed',
    specialInstructions: '',
    acMode: false
  };
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const filteredCustomers = useMemo(() => {
    if (!form.customerName) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(form.customerName.toLowerCase()) || 
      c.phone.includes(form.customerName)
    ).slice(0, 5);
  }, [customers, form.customerName]);

  const selectCustomer = (c) => {
    setForm(prev => ({ 
      ...prev, 
      customerName: c.name, 
      customerPhone: c.phone, 
      customerEmail: c.email || '',
      customerId: c.id 
    }));
    setShowCustomerList(false);
  };

  // Cancellation Form State
  const [cancelForm, setCancelForm] = useState({
    cancellationDate: new Date().toISOString().split('T')[0],
    reason: 'Customer Request',
    notes: '',
    refundAmount: 0
  });

  // Derived Values
  const getToday = () => new Date().toISOString().split('T')[0];

  const bookingDays = useMemo(() => {
    if (!form.bookingStartDate || !form.bookingEndDate) return 0;
    const start = new Date(form.bookingStartDate);
    const end = new Date(form.bookingEndDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return days >= 1 ? days : 1;
  }, [form.bookingStartDate, form.bookingEndDate]);

  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === form.vehicleId) || null;
  }, [form.vehicleId, vehicles]);

  const estimatedCost = useMemo(() => {
    if (!selectedVehicle) return 0;
    const useAC = form.acMode && selectedVehicle.hasAC;
    const rateDay = useAC ? (Number(selectedVehicle.ratePerDayAC) || 0) : (Number(selectedVehicle.ratePerDay) || 0);
    const rateKm = useAC ? (Number(selectedVehicle.ratePerKmAC) || 0) : (Number(selectedVehicle.ratePerKm) || 0);

    if (form.billingMode === 'perDay') {
      return bookingDays * rateDay;
    } else {
      return (Number(form.estimatedDistance) || 0) * rateKm;
    }
  }, [selectedVehicle, form.billingMode, bookingDays, form.estimatedDistance, form.acMode]);

  // Filtering Logic
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerPhone?.includes(searchTerm) ||
        b.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVehicle = vehicleFilter === 'all' || b.vehicleId === vehicleFilter;
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesFromDate = !fromDate || b.bookingStartDate >= fromDate;
      const matchesToDate = !toDate || b.bookingStartDate <= toDate;

      return matchesSearch && matchesVehicle && matchesStatus && matchesFromDate && matchesToDate;
    }).sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [bookings, searchTerm, vehicleFilter, statusFilter, fromDate, toDate, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Form Submission
  const validateForm = () => {
    const errors = {};
    if (!form.vehicleId) errors.vehicleId = 'Vehicle is required';
    if (!form.customerName || form.customerName.length < 2) errors.customerName = 'Name must be at least 2 chars';
    if (!form.customerPhone || !/^\d{10}$/.test(form.customerPhone)) errors.customerPhone = 'Enter valid 10-digit number';
    if (!form.bookingStartDate) errors.bookingStartDate = 'Required';
    else if (form.bookingStartDate < getToday()) errors.bookingStartDate = 'Cannot be past date';
    if (!form.bookingEndDate) errors.bookingEndDate = 'Required';
    else if (form.bookingEndDate < form.bookingStartDate) errors.bookingEndDate = 'Cannot be before start date';
    if (!form.pickupLocation) errors.pickupLocation = 'Required';
    if (!form.dropLocation) errors.dropLocation = 'Required';
    if (form.billingMode === 'perKm' && (!form.estimatedDistance || form.estimatedDistance < 1)) errors.estimatedDistance = 'Required';
    
    // Check vehicle availability if active booking
    if (selectedVehicle && (form.status === 'Booked' || form.status === 'Confirmed')) {
        // Robust Date Range Conflict Check
        const start = new Date(`${form.bookingStartDate}T${form.pickupTime || '00:00'}`);
        const end = new Date(`${form.bookingEndDate}T${form.returnTime || '23:59'}`);

        const hasConflict = bookings.find(b => {
          if (b.vehicleId !== form.vehicleId) return false;
          if (b.id === editingId) return false; // Don't conflict with itself
          if (b.status === 'Rejected' || b.status === 'Cancelled') return false;

          const bStart = new Date(`${b.bookingStartDate}T${b.pickupTime || '00:00'}`);
          const bEnd = new Date(`${b.bookingEndDate}T${b.returnTime || '23:59'}`);

          return (start < bEnd && end > bStart);
        });

        if (hasConflict) {
          errors.vehicleId = 'This vehicle has an overlapping booking for these dates';
        }

    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const bookingData = {
      ...form,
      bookingDays,
      vehicleName: selectedVehicle.name,
      numberPlate: selectedVehicle.numberPlate,
      vehicleType: selectedVehicle.type,
      estimatedCost,
      balanceDue: estimatedCost - form.advancePaid
    };

    if (editingId) {
      const updated = await updateBooking(editingId, bookingData);
      if (updated) {
        setShowForm(false);
        setEditingId(null);
        setForm(initialForm);
      }
    } else {
      const saved = await addBooking(bookingData);
      if (saved) {
        // Email Notification
        try {
            await emailApi.notifyBookingConfirmation(selectedVehicle, saved);
            showToast(`Booking saved! Notification sent to ${selectedVehicle.name} owner`);
        } catch (err) {
            console.error("Email failed:", err);
        }
        setShowForm(false);
        setForm(initialForm);
      }
    }
  };

  const handleEdit = async (booking) => {
    const ok = await requirePassword({ actionType: "editBooking", actionLabel: "EDIT booking " + booking.id + " for " + booking.customerName });
    if (ok) {
      setForm(booking);
      setEditingId(booking.id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelClick = async (booking) => {
    const ok = await requirePassword({ actionType: "cancelBooking", actionLabel: "CANCEL booking " + booking.id + " for " + booking.customerName });
    if (ok) {
      setCancelBookingItem(booking);
      setCancelForm({
        cancellationDate: getToday(),
        reason: 'Customer Request',
        notes: '',
        refundAmount: booking.advancePaid
      });
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancelForm.reason) return;
    
    const updated = await cancelBooking(cancelBookingItem.id, cancelForm);
    if (updated) {
       // Email Notification
       try {
           const vehicle = vehicles.find(v => v.id === updated.vehicleId);
           await emailApi.notifyCancellation(vehicle, updated, cancelForm);
           showToast('Booking cancelled and notification sent');
       } catch (err) {
           console.error("Email failed:", err);
       }
       setCancelBookingItem(null);
    }
  };

  const handleDeleteClick = async (booking) => {
    const ok = await requirePassword({ actionType: "deleteBooking", actionLabel: "DELETE booking " + booking.id + " for " + booking.customerName });
    if (ok) {
      await deleteBooking(booking.id);
    }
  };

  const handleApprove = async (booking) => {
    const ok = await requirePassword({ actionType: "editBooking", actionLabel: "APPROVE booking " + booking.id });
    if (ok) {
      await updateBooking(booking.id, { status: 'Confirmed' });
      showToast(`Booking ${booking.id} approved!`);
    }
  };

  const handleReject = async (booking) => {
    const ok = await requirePassword({ actionType: "editBooking", actionLabel: "REJECT booking " + booking.id });
    if (ok) {
      await updateBooking(booking.id, { status: 'Rejected' });
      showToast(`Booking ${booking.id} rejected.`, 'error');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setVehicleFilter('all');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">Confirmed</span>;
      case 'Pending': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase animate-pulse">Pending Review</span>;
      case 'Cancelled': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">Cancelled</span>;
      case 'Rejected': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">Rejected</span>;
      case 'Completed': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">Completed</span>;
      case 'On Trip': return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">On Trip</span>;
      default: return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">{status}</span>;
    }
  };

  return (
    <div className="pb-20 animate-fade-in">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight">Vehicle Bookings</h1>
          <p className="text-text-muted font-medium">Manage all vehicle booking and cancellation dates</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => storage.exportBookingsAsCSV(filteredBookings)}
            className="flex items-center gap-2 bg-card-bg border border-border-main text-text-main px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-main-bg transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            <Plus className="w-4 h-4" /> New Booking
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-card-bg p-4 rounded-2xl shadow-sm border border-border-main mb-8 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by customer, phone, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-main-bg border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm text-text-main"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-text-muted hover:text-text-main"><X className="w-4 h-4" /></button>}
        </div>

        <select 
          value={vehicleFilter} 
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="bg-main-bg border border-border-main rounded-xl px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">All Vehicles</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} - {v.numberPlate}</option>)}
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-main-bg border border-border-main rounded-xl px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
        </select>

        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-main-bg border border-border-main rounded-xl px-3 py-2 text-sm text-text-main" />
          <span className="text-text-muted text-xs font-bold uppercase">To</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-main-bg border border-border-main rounded-xl px-3 py-2 text-sm text-text-main" />
        </div>

        <button 
          onClick={clearFilters}
          className="text-slate-500 hover:text-red-500 text-sm font-bold ml-auto px-4 py-2 transition-colors flex items-center gap-1"
        >
          <X className="w-4 h-4" /> Clear
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* LEFT PANEL: BOOKINGS LIST */}
        <div className="flex-1 w-full order-2 md:order-1 text-text-main">
          <div className="bg-card-bg rounded-3xl shadow-sm border border-border-main overflow-hidden">
            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-main-bg/50 border-b border-border-main">
                  <tr className="text-text-muted text-[11px] font-black uppercase tracking-wider">
                    <th className="px-6 py-4">Booking ID</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/50">
                  {paginatedBookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <CalendarDays className="w-16 h-16 mb-4 opacity-20" />
                          <p className="text-lg font-bold">No bookings recorded yet</p>
                          <p className="text-sm">Click New Booking button to add your first booking</p>
                          <button 
                            onClick={() => setShowForm(true)}
                            className="mt-6 bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                          >
                            Add First Booking
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((b, idx) => (
                      <tr 
                        key={b.id} 
                        className={`hover:bg-main-bg transition-colors cursor-pointer group ${idx % 2 === 0 ? 'bg-card-bg' : 'bg-main-bg/30'}`}
                        onClick={() => setViewBooking(b)}
                      >
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="font-black text-text-main">{b.id}</span>
                            {b.source === 'Customer Portal' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 text-[8px] font-black uppercase tracking-tight rounded-md border border-indigo-500/20 w-fit">
                                <User className="w-2 h-2" /> Customer Request
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <div className="font-bold text-text-main">{b.vehicleName}</div>
                            <div className="text-xs text-text-muted font-mono">{b.numberPlate}</div>
                            <span className="mt-1 inline-block px-2 py-0.5 bg-main-bg text-[9px] font-black rounded uppercase text-text-muted">{b.vehicleType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <div className="font-bold text-slate-700">{b.customerName}</div>
                            <div className="text-xs text-slate-400">{b.customerPhone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs">
                            <div className="font-medium text-slate-600">F: {b.bookingStartDate}</div>
                            <div className="font-medium text-slate-600">T: {b.bookingEndDate}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">({b.bookingDays} Days)</div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <div className="font-black text-emerald-600">₹{b.advancePaid}</div>
                            <div className="text-[10px] text-slate-400">advance</div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(b.status)}
                        </td>
                        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewBooking(b)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="View Details"><Eye className="w-4 h-4" /></button>
                            {b.status === 'Pending' && (
                              <>
                                <button onClick={() => handleApprove(b)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                                <button onClick={() => handleReject(b)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Reject"><X className="w-4 h-4" /></button>
                              </>
                            )}
                            <button onClick={() => handleEdit(b)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit"><Pencil className="w-4 h-4" /></button>
                            {b.status !== 'Pending' && b.status !== 'Rejected' && b.status !== 'Cancelled' && (
                              <button onClick={() => handleCancelClick(b)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all" title="Cancel Booking"><X className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => handleDeleteClick(b)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedBookings.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center">
                  <CalendarDays className="w-12 h-12 text-slate-200 mb-2" />
                  <p className="text-slate-400 font-bold">No bookings found</p>
                </div>
              ) : (
                paginatedBookings.map((b) => (
                  <div key={b.id} className="p-4 active:bg-slate-50 transition-colors" onClick={() => setViewBooking(b)}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">#{b.id}</span>
                        <h4 className="font-bold text-slate-800 mt-1">{b.customerName}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {b.customerPhone}</p>
                      </div>
                      {getStatusBadge(b.status)}
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2">
                       <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Vehicle</span>
                          <span className="font-bold text-slate-700">{b.vehicleName} <span className="text-[10px] font-mono text-slate-400">({b.numberPlate})</span></span>
                       </div>
                       <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Dates</span>
                          <span className="font-bold text-slate-700">{b.bookingStartDate} → {b.bookingEndDate}</span>
                       </div>
                       <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium tracking-tight">Advance Paid</span>
                          <span className="font-black text-emerald-600">₹{b.advancePaid}</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                       <button onClick={() => setViewBooking(b)} className="flex-1 py-2.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                          <Eye className="w-3.5 h-3.5" /> View
                       </button>
                       <button onClick={() => handleEdit(b)} className="flex-1 py-2.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                       </button>
                       <div className="flex gap-2">
                          <button onClick={() => handleCancelClick(b)} className="p-2.5 bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-xl transition-all" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(b)} className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
                <p className="text-xs text-slate-400 font-bold">Showing {(currentPage-1)*itemsPerPage + 1}-{Math.min(currentPage*itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings</p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black px-3">Page {currentPage} / {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: ADD/EDIT FORM (Slide-over on Mobile) */}
        {showForm && (
          <div className="fixed inset-0 z-[60] md:relative md:inset-auto md:z-auto md:w-[450px] md:order-2">
            {/* Backdrop for Mobile */}
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setShowForm(false)}></div>
            
            <div className="fixed bottom-0 left-0 right-0 top-12 bg-card-bg rounded-t-[40px] shadow-2xl flex flex-col md:sticky md:top-4 md:rounded-3xl md:shadow-sm md:border md:border-border-main animate-slide-up md:animate-fade-in-right">
              <div className="p-6 border-b border-border-main flex items-center justify-between bg-main-bg/50 shrink-0">
                <h2 className="text-xl font-black text-text-main tracking-tight">
                  {editingId ? `Edit Booking #${editingId}` : 'New Booking'}
                </h2>
                <button 
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(initialForm); }}
                  className="p-2 text-text-muted hover:text-text-main hover:bg-card-bg rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Vehicle Selection */}
                  <div>
                    <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Select Vehicle *</label>
                    <select 
                      name="vehicleId" 
                      required
                      value={form.vehicleId} 
                      onChange={(e) => setForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                      className={`w-full px-4 py-3 bg-main-bg border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-text-main ${formErrors.vehicleId ? 'border-red-300' : 'border-border-main'}`}
                    >
                      <option value="">Choose a vehicle</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} - {v.numberPlate}</option>)}
                    </select>
                    {formErrors.vehicleId && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.vehicleId}</p>}

                    {selectedVehicle && (
                       <div className="mt-3 space-y-3">
                          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase">{selectedVehicle.type} • {selectedVehicle.capacity} Seats</span>
                                    <h4 className="font-bold text-text-main">{selectedVehicle.name}</h4>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${selectedVehicle.status === 'Available' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {selectedVehicle.status || 'Available'}
                                </span>
                            </div>
                            <div className="flex gap-4 text-[10px] font-bold text-blue-500 mt-2 pt-2 border-t border-blue-500/10">
                                <span>Day: ₹{selectedVehicle.ratePerDay}</span>
                                <span>KM: ₹{selectedVehicle.ratePerKm}</span>
                                {selectedVehicle.hasAC && <span className="text-blue-400">AC: ₹{selectedVehicle.ratePerDayAC}/Day</span>}
                            </div>
                          </div>

                          {selectedVehicle.hasAC && (
                            <div className="flex p-1 bg-main-bg rounded-2xl">
                              <button 
                                  type="button"
                                  onClick={() => setForm(prev => ({ ...prev, acMode: false }))}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-[10px] transition-all ${!form.acMode ? 'bg-card-bg text-blue-600 shadow-sm' : 'text-text-muted'}`}
                              >
                                  <Wind className="w-3 h-3" /> Non-AC
                              </button>
                              <button 
                                  type="button"
                                  onClick={() => setForm(prev => ({ ...prev, acMode: true }))}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-[10px] transition-all ${form.acMode ? 'bg-blue-600 text-white shadow-sm' : 'text-text-muted'}`}
                              >
                                  <Thermometer className="w-3 h-3" /> With AC
                              </button>
                            </div>
                          )}
                       </div>
                    )}
                  </div>

                  {/* Customer Details */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Customer Name *</label>
                      <input 
                        type="text" 
                        placeholder="Full name or lookup..."
                        value={form.customerName}
                        onFocus={() => setShowCustomerList(true)}
                        onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                        className={`w-full px-4 py-3 bg-main-bg border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-text-main ${formErrors.customerName ? 'border-red-300' : 'border-border-main'}`}
                      />
                      {showCustomerList && filteredCustomers.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-card-bg border border-border-main rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                          {filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCustomer(c)}
                              className="w-full px-5 py-4 text-left hover:bg-blue-500/5 transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <p className="font-bold text-text-main group-hover:text-blue-600 transition-colors">{c.name}</p>
                                <p className="text-[10px] text-text-muted font-bold">{c.phone}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                            </button>
                          ))}
                        </div>
                      )}
                      {formErrors.customerName && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.customerName}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Phone *</label>
                            <input 
                                type="tel" 
                                placeholder="10 Digits"
                                value={form.customerPhone}
                                onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                                className={`w-full px-4 py-3 bg-main-bg border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-text-main ${formErrors.customerPhone ? 'border-red-300' : 'border-border-main'}`}
                            />
                            {formErrors.customerPhone && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.customerPhone}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Email</label>
                            <input 
                                type="email" 
                                placeholder="Optional"
                                value={form.customerEmail}
                                onChange={(e) => setForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                                className="w-full px-4 py-3 bg-main-bg border border-border-main rounded-xl font-bold text-text-main"
                            />
                        </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pickup Date *</label>
                      <input 
                        type="date"
                        value={form.bookingStartDate}
                        onChange={(e) => setForm(prev => ({ ...prev, bookingStartDate: e.target.value }))}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700 ${formErrors.bookingStartDate ? 'border-red-300' : 'border-slate-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Return Date *</label>
                      <input 
                        type="date"
                        value={form.bookingEndDate}
                        onChange={(e) => setForm(prev => ({ ...prev, bookingEndDate: e.target.value }))}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700 ${formErrors.bookingEndDate ? 'border-red-300' : 'border-slate-100'}`}
                      />
                    </div>
                  </div>

                  {/* Calculated Days */}
                  <div className="p-3 bg-blue-600 rounded-2xl flex items-center justify-between text-white shadow-lg shadow-blue-500/20">
                    <span className="text-xs font-black uppercase tracking-widest">Total Duration</span>
                    <span className="text-lg font-black">{bookingDays} Days</span>
                  </div>

                  {/* Times & Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pickup Time</label>
                      <input type="time" value={form.pickupTime} onChange={(e) => setForm(prev => ({ ...prev, pickupTime: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Return Time</label>
                      <input type="time" value={form.returnTime} onChange={(e) => setForm(prev => ({ ...prev, returnTime: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pickup Location *</label>
                    <input 
                      type="text" 
                      placeholder="Address"
                      value={form.pickupLocation}
                      onChange={(e) => setForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700 ${formErrors.pickupLocation ? 'border-red-300' : 'border-slate-100'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Drop Location *</label>
                    <input 
                      type="text" 
                      placeholder="Address"
                      value={form.dropLocation}
                      onChange={(e) => setForm(prev => ({ ...prev, dropLocation: e.target.value }))}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-700 ${formErrors.dropLocation ? 'border-red-300' : 'border-slate-100'}`}
                    />
                  </div>

                  {/* Billing Mode */}
                  <div className="flex items-center gap-6 p-1 bg-slate-100 rounded-2xl">
                     <button 
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, billingMode: 'perDay' }))}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${form.billingMode === 'perDay' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                     >
                        Per Day
                     </button>
                     <button 
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, billingMode: 'perKm' }))}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${form.billingMode === 'perKm' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                     >
                        Per KM
                     </button>
                  </div>

                  {form.billingMode === 'perKm' && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Est. Distance (KM)</label>
                      <input 
                        type="number" 
                        value={form.estimatedDistance}
                        onChange={(e) => setForm(prev => ({ ...prev, estimatedDistance: e.target.value }))}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-slate-700 ${formErrors.estimatedDistance ? 'border-red-300' : 'border-slate-100'}`}
                      />
                    </div>
                  )}

                  <CostComparison 
                    vehicle={selectedVehicle} 
                    distance={form.estimatedDistance} 
                    days={bookingDays} 
                    activeMode={form.billingMode} 
                    activeAC={form.acMode} 
                  />

                  {/* Est Cost */}
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-800 uppercase">Estimated Cost</span>
                      <span className="text-xl font-black text-emerald-600">₹{estimatedCost}</span>
                  </div>

                  {/* Payment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Advance Paid (₹)</label>
                      <input 
                        type="number" 
                        value={form.advancePaid}
                        onChange={(e) => setForm(prev => ({ ...prev, advancePaid: Number(e.target.value) }))}
                        className="w-full px-4 py-3 bg-main-bg border border-border-main rounded-xl font-bold text-text-main" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Payment Mode</label>
                      <select value={form.paymentMode} onChange={(e) => setForm(prev => ({ ...prev, paymentMode: e.target.value }))} className="w-full px-4 py-3 bg-main-bg border border-border-main rounded-xl font-bold text-text-main">
                        <option>Cash</option>
                        <option>UPI</option>
                        <option>Bank Transfer</option>
                        <option>Card</option>
                        <option>Cheque</option>
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Booking Status</label>
                    <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-3 bg-main-bg border border-border-main rounded-xl font-bold text-text-main">
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-2">Special Instructions</label>
                    <textarea 
                      placeholder="Any notes..."
                      value={form.specialInstructions}
                      onChange={(e) => setForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-3 bg-main-bg border border-border-main rounded-xl font-bold text-text-main text-sm focus:outline-none"
                    ></textarea>
                  </div>

                  {/* Submit Errors */}
                  {Object.keys(formErrors).length > 0 && (
                     <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                           <p className="text-xs font-black text-red-700 uppercase mb-1">Please fix errors</p>
                           <ul className="text-[10px] text-red-600 font-bold list-disc pl-4">
                              {Object.values(formErrors).map((v, i) => <li key={i}>{v}</li>)}
                           </ul>
                        </div>
                     </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => { setShowForm(false); setEditingId(null); setForm(initialForm); }}
                      className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className={`flex-[2] py-3.5 rounded-2xl font-black text-sm text-white transition-all shadow-lg ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                    >
                      {editingId ? 'Update Booking' : 'Save Booking'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {viewBooking && (
        <BookingDetailsModal 
          booking={viewBooking} 
          onClose={() => setViewBooking(null)} 
          onEdit={() => { handleEdit(viewBooking); setViewBooking(null); }}
          onCancel={() => { handleCancelClick(viewBooking); setViewBooking(null); }}
          onComplete={async () => { await updateBooking(viewBooking.id, { status: 'Completed' }); setViewBooking(null); }}
          onApprove={async () => { await handleApprove(viewBooking); setViewBooking(null); }}
          onReject={async () => { await handleReject(viewBooking); setViewBooking(null); }}
          vehicles={vehicles}
        />
      )}

      {cancelBookingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-50/30">
              <div className="flex items-center gap-3">
                 <div className="bg-red-100 p-2 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800">Cancel Booking</h3>
                    <p className="text-xs font-bold text-slate-400">#{cancelBookingItem.id} • {cancelBookingItem.customerName}</p>
                 </div>
              </div>
              <button onClick={() => setCancelBookingItem(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cancellation Date *</label>
                    <input type="date" value={cancelForm.cancellationDate} onChange={(e) => setCancelForm(prev => ({ ...prev, cancellationDate: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reason *</label>
                    <select value={cancelForm.reason} onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700">
                      <option>Customer Request</option>
                      <option>Vehicle Breakdown</option>
                      <option>Weather Condition</option>
                      <option>Double Booking Error</option>
                      <option>Payment Not Received</option>
                      <option>Emergency</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Additional Notes</label>
                    <textarea rows="2" value={cancelForm.notes} onChange={(e) => setCancelForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Explain cancellation..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 text-sm"></textarea>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <label className="block text-xs font-black text-orange-400 uppercase mb-2">Refund Amount (₹)</label>
                    <input type="number" value={cancelForm.refundAmount} onChange={(e) => setCancelForm(prev => ({ ...prev, refundAmount: Number(e.target.value) }))} className="w-full bg-white border border-orange-200 px-4 py-2 rounded-xl font-black text-orange-600 focus:outline-none focus:border-orange-400" />
                    <p className="text-[10px] text-orange-400 mt-2">Advance paid: ₹{cancelBookingItem.advancePaid}</p>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-slate-50/50 flex gap-4 border-t border-slate-100">
              <button onClick={() => setCancelBookingItem(null)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-white transition-all">Go Back</button>
              <button 
                onClick={handleConfirmCancellation}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Delete Dialog removed in favor of PasswordModal flow */}
    </div>
  );
};

// HELPER COMPONENT: Details Modal
const BookingDetailsModal = ({ booking, onClose, onEdit, onCancel, onComplete, onApprove, onReject, vehicles }) => {
  const vehicle = vehicles.find(v => v.id === booking.vehicleId);
  
  const sections = [
    {
      title: 'Vehicle Info',
      bg: 'bg-blue-50',
      icon: Car,
      color: 'blue',
      items: [
        { label: 'Name', value: booking.vehicleName, bold: true },
        { label: 'Plate', value: booking.numberPlate, mono: true },
        { label: 'Rate/KM', value: `₹${vehicle?.ratePerKm || '-'}` },
        { label: 'Rate/Day', value: `₹${vehicle?.ratePerDay || '-'}` }
      ]
    },
    {
      title: 'Customer Info',
      bg: 'bg-slate-50',
      icon: User,
      color: 'slate',
      items: [
        { label: 'Contact', value: booking.customerName, bold: true },
        { label: 'Phone', value: booking.customerPhone },
        { label: 'Email', value: booking.customerEmail || 'N/A' }
      ]
    },
    {
      title: 'Payment Info',
      bg: 'bg-emerald-50',
      icon: CreditCard,
      color: 'emerald',
      items: [
        { label: 'Total Est.', value: `₹${booking.estimatedCost}`, bold: true, color: 'text-emerald-700' },
        { label: 'Advance', value: `₹${booking.advancePaid}` },
        { label: 'Due', value: `₹${(booking.estimatedCost || 0) - (booking.advancePaid || 0)}`, bold: true, color: 'text-red-600' },
        { label: 'Mode', value: booking.paymentMode }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Booking Details</h3>
               <span className="px-3 py-1 bg-slate-100 text-[10px] font-black rounded-lg text-slate-600 uppercase tracking-widest">{booking.id}</span>
            </div>
            <div className="flex items-center gap-4">
               {booking.status === 'Confirmed' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded uppercase">Confirmed</span>}
               {booking.status === 'Pending' && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-black rounded uppercase">Pending</span>}
               {booking.status === 'Cancelled' && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded uppercase">Cancelled</span>}
               {booking.status === 'Completed' && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded uppercase">Completed</span>}
               <span className="text-[10px] font-bold text-slate-400">Created: {new Date(booking.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sections.map((sec, i) => (
              <div key={i} className={`p-5 rounded-3xl ${sec.bg} border border-${sec.color}-100/50`}>
                <div className="flex items-center gap-2 mb-4">
                   <sec.icon className={`w-4 h-4 text-${sec.color}-500`} />
                   <h4 className={`text-[10px] font-black text-${sec.color}-600 uppercase tracking-widest`}>{sec.title}</h4>
                </div>
                <div className="space-y-3">
                   {sec.items.map((item, j) => (
                      <div key={j}>
                         <span className="text-[9px] text-slate-400 font-bold uppercase block">{item.label}</span>
                         <span className={`text-xs font-bold ${item.bold ? 'text-slate-800' : 'text-slate-600'} ${item.mono ? 'font-mono' : ''} ${item.color || ''}`}>{item.value}</span>
                      </div>
                   ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
             <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trip Logistics</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="absolute left-1/2 top-4 bottom-4 w-px bg-slate-200 hidden md:block"></div>
                
                <div className="space-y-6">
                   <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm shrink-0">1</div>
                      <div>
                         <span className="text-[10px] font-black text-slate-400 uppercase">Pickup Location</span>
                         <p className="text-sm font-bold text-slate-700">{booking.pickupLocation}</p>
                         <p className="text-[11px] font-bold text-blue-500 mt-1">{booking.bookingStartDate} @ {booking.pickupTime}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm shrink-0">2</div>
                      <div>
                         <span className="text-[10px] font-black text-slate-400 uppercase">Drop Location</span>
                         <p className="text-sm font-bold text-slate-700">{booking.dropLocation}</p>
                         <p className="text-[11px] font-bold text-blue-500 mt-1">{booking.bookingEndDate} @ {booking.returnTime}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6 md:pl-4">
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Billing Mode</span>
                        <p className="text-sm font-bold text-slate-700 capitalize">{booking.billingMode === 'perDay' ? 'Fixed Daily Rate' : `KM Based (${booking.estimatedDistance} KM Est.)`}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Total Trip Days</span>
                        <p className="text-xl font-black text-blue-600">{booking.bookingDays} Days</p>
                    </div>
                </div>
             </div>
          </div>

          {booking.specialInstructions && (
              <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                   <Info className="w-4 h-4 text-slate-400" />
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Special Instructions</h4>
                </div>
                <p className="text-sm text-slate-600 font-medium italic">"{booking.specialInstructions}"</p>
              </div>
          )}

          {/* Timeline */}
          <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Booking Lifecycle</h4>
              </div>
              <div className="flex justify-between relative px-2">
                 <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 -z-10"></div>
                 {[
                    { label: 'Created', active: true },
                    { label: 'Confirmed', active: booking.status !== 'Pending' },
                    { label: 'Dispatched', active: booking.status === 'Completed' },
                    { label: 'Returned', active: booking.status === 'Completed' }
                 ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                       <div className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-md transition-all ${step.active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          <CheckCircle2 className="w-4 h-4" />
                       </div>
                       <span className={`text-[9px] font-black uppercase ${step.active ? 'text-blue-600' : 'text-slate-400'}`}>{step.label}</span>
                    </div>
                 ))}
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all">
            <Printer className="w-4 h-4" /> Print
          </button>
          
          <div className="flex-1"></div>

          {booking.status === 'Pending' && (
            <>
              <button 
                onClick={onReject}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-red-100 text-red-600 font-bold text-xs hover:bg-red-50 transition-all font-black uppercase tracking-widest"
              >
                <X className="w-4 h-4" /> Reject Request
              </button>
              <button 
                onClick={onApprove}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Booking
              </button>
            </>
          )}

          {(booking.status === 'Confirmed') && (
            <>
              <button 
                onClick={onCancel}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-red-100 text-red-600 font-bold text-xs hover:bg-red-50 transition-all"
              >
                <X className="w-4 h-4" /> Cancel Booking
              </button>
              <button 
                onClick={onComplete}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-600 text-white font-black text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-100"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Completed
              </button>
            </>
          )}

          <button 
             onClick={onEdit}
             className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
             Edit Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
