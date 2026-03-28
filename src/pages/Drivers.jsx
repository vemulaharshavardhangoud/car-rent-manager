import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  User, Plus, Search, Phone, Fingerprint, 
  Trash2, Edit, MoreVertical, X, Check,
  Camera, Briefcase, ShieldCheck, Mail
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Skeleton, { TableSkeleton } from '../components/Skeleton';

const Drivers = () => {
  const { drivers, addDriver, updateDriver, deleteDriver, isSyncing, requirePassword } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', licenseNumber: '', status: 'Active', photo: ''
  });

  const filtered = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.phone.includes(searchTerm) ||
    d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingDriver) {
      await updateDriver(editingDriver.id, formData);
    } else {
      await addDriver(formData);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', licenseNumber: '', status: 'Active', photo: '' });
    setEditingDriver(null);
  };

  const handleDelete = async (id) => {
    const verified = await requirePassword({ actionType: 'deleteDriver' });
    if (verified) deleteDriver(id);
  };

  return (
    <div className="pb-12 animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-text-main tracking-tight">Driver Profiles</h2>
          <p className="text-sm font-medium text-text-muted mt-1 uppercase tracking-widest opacity-60 italic">Personnel Management Center</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-blue-600 hover:bg-black text-white px-8 py-4 rounded-3xl md:rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Onboard Driver
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted opacity-40 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Lookup driver name, license or phone..."
          className="w-full pl-16 pr-6 py-5 bg-card-bg border border-border-main rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold text-text-main placeholder:text-text-muted/40 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isSyncing && drivers.length === 0 ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={User} 
          title="No Personnel Found" 
          message="Start by onboarding your first driver to assign them to active vehicle trips."
          actionLabel="Onboard Now"
          onAction={() => setIsModalOpen(true)}
          className="mt-8"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(driver => (
            <div key={driver.id} className="bg-card-bg rounded-3xl md:rounded-[2.5rem] border border-border-main p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-black/5 hover:border-blue-500/20 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-main-bg -mr-16 -mt-16 rounded-full opacity-50 transition-transform group-hover:scale-110"></div>
               
               <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-24 h-24 rounded-full overflow-hidden mb-6 border-4 border-main-bg shadow-lg ring-4 ring-blue-500/10">
                   {driver.photo ? (
                      <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full bg-blue-500/10 flex items-center justify-center">
                        <User className="w-10 h-10 text-blue-500 opacity-40" />
                      </div>
                   )}
                 </div>

                 <h3 className="text-xl font-black text-text-main tracking-tight line-clamp-1">{driver.name}</h3>
                 <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full mt-2 transition-colors ${driver.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                   {driver.status}
                 </span>

                 <div className="w-full mt-8 space-y-4">
                   <div className="flex items-center gap-4 bg-main-bg/50 p-4 rounded-2xl border border-transparent hover:border-border-main transition-all">
                     <Phone className="w-4 h-4 text-text-muted" />
                     <span className="text-sm font-bold text-text-main">{driver.phone}</span>
                   </div>
                   <div className="flex items-center gap-4 bg-main-bg/50 p-4 rounded-2xl border border-transparent hover:border-border-main transition-all">
                     <ShieldCheck className="w-4 h-4 text-text-muted" />
                     <span className="text-xs font-mono font-black text-text-main uppercase tracking-tighter opacity-80">{driver.licenseNumber}</span>
                   </div>
                 </div>

                 <div className="flex w-full gap-3 mt-8">
                   <button 
                     onClick={() => { setEditingDriver(driver); setFormData(driver); setIsModalOpen(true); }}
                     className="flex-1 py-3 bg-main-bg hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-border-main hover:border-blue-600"
                   >
                     Profile Edit
                   </button>
                   <button 
                     onClick={() => handleDelete(driver.id)}
                     className="p-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-card-bg rounded-t-3xl md:rounded-[3rem] shadow-2xl overflow-hidden border border-border-main animate-slide-up self-end md:self-center">
             <div className="p-6 md:p-10 border-b border-border-main bg-main-bg/20 flex items-center justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-text-main tracking-tight">Onboard Personnel</h3>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">New Driver Profile Registration</p>
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
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">DL No (License Number)</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 text-xs font-mono font-black text-text-main uppercase tracking-widest focus:border-blue-500 transition-all outline-none"
                    value={formData.licenseNumber}
                    onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Profile Photo (URL)</label>
                  <div className="relative">
                    <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                      type="url" 
                      className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 pl-12 text-xs font-medium text-text-main focus:border-blue-500 transition-all outline-none"
                      placeholder="https://..."
                      value={formData.photo}
                      onChange={e => setFormData({...formData, photo: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95">
                    {editingDriver ? 'Save Profile' : 'Confirm Registration'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
