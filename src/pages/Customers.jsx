import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  User, Plus, Search, Phone, Mail, MapPin,
  Trash2, Edit, MoreVertical, X, Check,
  ChevronRight, Calendar, History, DollarSign,
  ShieldCheck, ExternalLink
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Skeleton, { TableSkeleton } from '../components/Skeleton';

const Customers = () => {
  const { customers, bookings, allTrips, addCustomer, updateCustomerData, deleteCustomerData, isSyncing, requirePassword } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', licenseNumber: ''
  });

  const customerStats = useMemo(() => {
    return customers.reduce((acc, customer) => {
      const customerBookings = bookings.filter(b => b.customerPhone === customer.phone || b.customerId === customer.id);
      const totalRevenue = customerBookings.reduce((sum, b) => sum + (Number(b.estimatedCost) || 0), 0);
      acc[customer.id] = {
        bookingCount: customerBookings.length,
        totalRevenue
      };
      return acc;
    }, {});
  }, [customers, bookings]);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCustomer) {
      await updateCustomerData(editingCustomer.id, formData);
    } else {
      await addCustomer(formData);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '', licenseNumber: '' });
    setEditingCustomer(null);
  };

  const handleDelete = async (id) => {
    const verified = await requirePassword({ actionType: 'deleteBooking' }); // Reusing deleteBooking protection
    if (verified) deleteCustomerData(id);
  };

  return (
    <div className="pb-12 animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-text-main tracking-tight">Customer Directory</h2>
          <p className="text-sm font-medium text-text-muted mt-1 uppercase tracking-widest opacity-60 italic">Loyalty & Profiles Management</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-blue-600 hover:bg-black text-white px-8 py-4 rounded-3xl md:rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Add Customer
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted opacity-40 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Lookup by name, phone or email..."
          className="w-full pl-16 pr-6 py-5 bg-card-bg border border-border-main rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold text-text-main placeholder:text-text-muted/40 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isSyncing && customers.length === 0 ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={User} 
          title="No Customers Found" 
          message="Keep track of your regular clients to speed up the booking process."
          actionLabel="Create First Profile"
          onAction={() => setIsModalOpen(true)}
          className="mt-8"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(customer => {
            const stats = customerStats[customer.id] || { bookingCount: 0, totalRevenue: 0 };
            return (
              <div key={customer.id} className="bg-card-bg rounded-3xl md:rounded-[2.5rem] border border-border-main p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:border-blue-500/20 transition-all group relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-main-bg -mr-16 -mt-16 rounded-full opacity-50 transition-transform group-hover:scale-110"></div>
                
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingCustomer(customer); setFormData(customer); setIsModalOpen(true); }}
                      className="p-3 hover:bg-main-bg rounded-xl transition-colors text-text-muted hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(customer.id)}
                      className="p-3 hover:bg-main-bg rounded-xl transition-colors text-text-muted hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative z-10">
                  <h3 className="text-xl font-black text-text-main tracking-tight line-clamp-1">{customer.name}</h3>
                  <p className="text-sm font-bold text-blue-600 mt-1">{customer.phone}</p>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-main-bg/50 p-4 rounded-2xl border border-transparent group-hover:border-border-main transition-all">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Bookings</p>
                      <p className="text-lg font-black text-text-main">{stats.bookingCount}</p>
                    </div>
                    <div className="bg-main-bg/50 p-4 rounded-2xl border border-transparent group-hover:border-border-main transition-all">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Revenue</p>
                      <p className="text-lg font-black text-emerald-500">₹{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>

                  {customer.email && (
                    <div className="mt-4 flex items-center gap-3 text-sm font-medium text-text-muted opacity-70">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setViewingCustomer(customer)}
                  className="mt-8 w-full py-4 bg-main-bg hover:bg-black hover:text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border border-border-main flex items-center justify-center gap-2 group/btn"
                >
                  View History <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-card-bg rounded-t-3xl md:rounded-[3rem] shadow-2xl overflow-hidden border border-border-main animate-slide-up self-end md:self-center">
             <div className="p-6 md:p-10 border-b border-border-main bg-main-bg/20 flex items-center justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-text-main tracking-tight">{editingCustomer ? 'Edit Profile' : 'New Customer'}</h3>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Directory Management</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-main-bg rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-text-muted" />
                </button>
             </div>

             <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 text-sm font-bold text-text-main focus:border-blue-500 transition-all outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 text-sm font-bold text-text-main focus:border-blue-500 transition-all outline-none"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      type="email" 
                      className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 pl-12 text-sm font-bold text-text-main focus:border-blue-500 transition-all outline-none"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Physical Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-text-muted" />
                    <textarea 
                      rows="2"
                      className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 pl-12 text-sm font-bold text-text-main focus:border-blue-500 transition-all outline-none resize-none"
                      placeholder="Home or Office Address..."
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    ></textarea>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Identity/License Number</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      type="text" 
                      className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 pl-12 text-xs font-mono font-black text-text-main uppercase tracking-widest focus:border-blue-500 transition-all outline-none"
                      placeholder="AADHAR / DL / PAN"
                      value={formData.licenseNumber}
                      onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95">
                    {editingCustomer ? 'Update Profile' : 'Add to Directory'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* HISTORY SLIDE-OVER/MODAL */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingCustomer(null)}></div>
          <div className="relative w-full md:max-w-4xl max-h-[90vh] bg-main-bg rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col">
            <div className="p-8 md:p-10 bg-card-bg border-b border-border-main flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <History className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-text-main tracking-tight">{viewingCustomer.name}'s History</h3>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Complete Trip & Booking Ledger</p>
                </div>
              </div>
              <button onClick={() => setViewingCustomer(null)} className="p-3 hover:bg-main-bg rounded-2xl transition-colors">
                <X className="w-6 h-6 text-text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
              {bookings.filter(b => b.customerPhone === viewingCustomer.phone || b.customerId === viewingCustomer.id).length === 0 ? (
                <div className="text-center py-20 opacity-40 italic">No bookings recorded for this customer yet.</div>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .filter(b => b.customerPhone === viewingCustomer.phone || b.customerId === viewingCustomer.id)
                    .map((booking, idx) => (
                      <div key={booking.id} className="bg-card-bg rounded-3xl p-6 border border-border-main flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-main-bg flex items-center justify-center font-black text-xs text-text-muted group-hover:text-blue-600 transition-colors">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest">{booking.id}</p>
                            <h4 className="text-lg font-black text-text-main">{booking.vehicleName}</h4>
                            <p className="text-xs font-bold text-text-muted opacity-60">{booking.bookingStartDate} to {booking.bookingEndDate}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="px-4 py-2 bg-main-bg rounded-xl border border-border-main text-center min-w-[100px]">
                            <p className="text-[8px] font-black text-text-muted uppercase tracking-tighter">Amount</p>
                            <p className="text-sm font-black text-text-main">₹{Number(booking.estimatedCost).toLocaleString()}</p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl border text-center min-w-[100px] ${
                            booking.status === 'Confirmed' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' :
                            booking.status === 'Cancelled' ? 'bg-red-500/5 border-red-500/20 text-red-500' :
                            'bg-blue-500/5 border-blue-500/20 text-blue-500'
                          }`}>
                            <p className="text-[8px] font-black uppercase tracking-tighter opacity-60">Status</p>
                            <p className="text-sm font-black">{booking.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div className="p-8 bg-card-bg border-t border-border-main flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Lifetime Value</p>
                  <p className="text-xl font-black text-text-main">₹{(customerStats[viewingCustomer.id]?.totalRevenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
