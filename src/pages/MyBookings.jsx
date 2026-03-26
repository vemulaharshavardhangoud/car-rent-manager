import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Phone, Calendar, Clock, Car, Tag, MapPin, IndianRupee, Info } from 'lucide-react';

const MyBookings = () => {
  const { bookings } = useContext(AppContext);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searched, setSearched] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const { cancelBooking } = useContext(AppContext);

  const handleCancelRequest = async (id) => {
    await cancelBooking(id, { reason: 'Cancelled by customer', date: new Date().toISOString() });
    setCancellingId(null);
  };

  const myBookings = bookings.filter(b => b.customerPhone === phoneNumber);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-500/10 text-amber-500';
      case 'Confirmed': return 'bg-emerald-500/10 text-emerald-500';
      case 'Rejected': return 'bg-red-500/10 text-red-500';
      case 'On Trip': return 'bg-blue-500/10 text-blue-500';
      case 'Completed': return 'bg-slate-500/10 text-slate-500';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) {
      setSearched(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 text-text-main">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">My <span className="text-blue-600">Bookings</span></h1>
        <p className="text-text-muted font-medium">Track your rental requests and trip status.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-card-bg border border-border-main rounded-[2.5rem] p-8 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="tel"
              placeholder="Enter your 10-digit phone number..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-main-bg border border-border-main rounded-2xl py-4 pl-12 pr-4 text-text-main font-medium focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
          >
            Find Bookings <Search className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <h2 className="text-sm font-black text-text-main uppercase tracking-[0.2em]">Found {myBookings.length} Bookings</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {myBookings.map((booking) => (
              <div key={booking.id} className="bg-card-bg border border-border-main rounded-[2.5rem] p-8 hover:shadow-2xl transition-all group overflow-hidden relative">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  {/* Left: Info */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <div className="bg-main-bg p-2 px-4 rounded-xl border border-border-main">
                        <span className="text-xs font-black text-blue-500 tracking-widest">{booking.id}</span>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-2xl font-black text-text-main tracking-tight">{booking.vehicleName}</h3>
                      <p className="text-text-muted text-xs font-bold uppercase tracking-widest">{booking.numberPlate}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-text-muted" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Dates</span>
                          <span className="text-sm text-text-main font-bold">{booking.bookingStartDate} to {booking.bookingEndDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <IndianRupee className="w-5 h-5 text-emerald-500" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Est. Cost</span>
                          <span className="text-sm text-text-main font-bold">₹{booking.totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border-main/50">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-400" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Pickup Location</span>
                          <span className="text-xs text-text-main font-medium">{booking.pickupLocation || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-tight">Return Location</span>
                          <span className="text-xs text-text-main font-medium">{booking.returnLocation || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                    {booking.specialInstructions && (
                      <div className="p-4 bg-main-bg/50 rounded-2xl border border-border-main text-xs italic text-text-muted">
                        <Info className="w-4 h-4 inline-block mr-2 text-blue-500" />
                        {booking.specialInstructions}
                      </div>
                    )}
                  </div>

                  {/* Right: Message/CTA */}
                  <div className="flex flex-col justify-center items-center md:items-end md:w-64 border-t md:border-t-0 md:border-l border-border-main/50 pt-8 md:pt-0 md:pl-8">
                    {booking.status === 'Pending' && (
                      <div className="text-center md:text-right space-y-4">
                        {cancellingId === booking.id ? (
                          <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Confirm Cancellation?</p>
                            <div className="flex gap-2 justify-center md:justify-end">
                              <button 
                                onClick={() => handleCancelRequest(booking.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                              >
                                Yes, Cancel
                              </button>
                              <button 
                                onClick={() => setCancellingId(null)}
                                className="px-4 py-2 bg-main-bg border border-border-main text-text-muted rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-text-muted transition-all"
                              >
                                Back
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1">
                              <p className="text-sm text-blue-500 font-bold">Seeking Approval</p>
                              <p className="text-[10px] text-text-muted leading-relaxed italic">The owner will contact you shortly to confirm your booking.</p>
                            </div>
                            <button 
                              onClick={() => setCancellingId(booking.id)}
                              className="w-full md:w-auto px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                              Cancel Request
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {booking.status === 'Confirmed' && (
                      <div className="text-center md:text-right space-y-2 text-emerald-500">
                        <p className="text-sm font-black uppercase tracking-widest">Confirmed!</p>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Your vehicle is reserved. Please arrive at the pickup location on time.</p>
                      </div>
                    )}
                    {booking.status === 'Rejected' && (
                      <div className="text-center md:text-right space-y-2 text-red-500">
                        <p className="text-sm font-black uppercase tracking-widest">Rejected</p>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Unfortunately, your request was declined. Please try another vehicle.</p>
                      </div>
                    )}
                    {booking.status === 'On Trip' && (
                      <div className="text-center md:text-right space-y-2 text-blue-500">
                        <p className="text-sm font-black uppercase tracking-widest">Active Trip</p>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">You are currently on your trip. Drive safe!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {myBookings.length === 0 && (
              <div className="bg-card-bg border border-border-main rounded-[2.5rem] p-20 text-center">
                <div className="w-20 h-20 bg-main-bg rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-text-muted opacity-40" />
                </div>
                <h3 className="text-2xl font-black text-text-main tracking-tight mb-2">No bookings found</h3>
                <p className="text-text-muted font-medium">We couldn't find any bookings for {phoneNumber}.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helper Note */}
      <div className="bg-blue-600/5 border border-blue-500/10 rounded-3xl p-6 flex gap-4">
        <Info className="w-6 h-6 text-blue-500 shrink-0" />
        <p className="text-xs text-text-muted font-medium leading-relaxed">
          Need to change or cancel your booking? Please contact our support team or the vehicle owner directly. 
          Customers cannot modify bookings once submitted to ensure coordination with our fleet management.
        </p>
      </div>
    </div>
  );
};

export default MyBookings;
