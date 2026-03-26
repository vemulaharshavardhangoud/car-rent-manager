import React, { useState, useEffect, useContext } from 'react';
import { Lock, Eye, EyeOff, Shield, Timer, AlertTriangle, CheckCircle2, Cloud, Info } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import * as storage from '../utils/storage';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { showToast, requirePassword, endAdminSession, updateSettings } = useContext(AppContext);
  const navigate = useNavigate();

  // Settings State
  const [lastChanged, setLastChanged] = useState('');
  const [toggles, setToggles] = useState({
    deleteVehicle: true, deleteTrip: true, deleteBooking: true,
    cancelBooking: true, editVehicle: true, editTrip: false,
    editBooking: true, clearData: true
  });
  const [sessionDuration, setSessionDuration] = useState('5');

  // PIN Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Clear Data State
  const [deleteInput, setDeleteInput] = useState('');

  // Initial Load
  useEffect(() => {
    // Load data from localStorage (initial cache)
    const changedAt = localStorage.getItem('crm_password_changed_at');
    if (changedAt) {
      setLastChanged(new Date(changedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    } else {
      setLastChanged('Never (Using Default)');
    }

    const savedToggles = localStorage.getItem('crm_protected_actions');
    if (savedToggles) setToggles(JSON.parse(savedToggles));

    const savedDuration = localStorage.getItem('crm_session_duration');
    if (savedDuration) setSessionDuration(savedDuration);
  }, []);

  // --- PASSWORD MANAGEMENT ---
  const getStrengthLabel = (pass) => {
    if (pass.length === 0) return { label: '', color: '' };
    if (pass.length !== 6 || !/^\d+$/.test(pass)) return { label: 'Must be 6 digits', color: 'text-red-500' };
    if (/(\d)\1{2,}/.test(pass)) return { label: 'Weak (Repeating Digits)', color: 'text-orange-500' };
    return { label: 'Secure PIN', color: 'text-green-500' };
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('PINs do not match', 'error');
      return;
    }

    const storedPass = localStorage.getItem('crm_admin_password');
    const isCurrentValid = storedPass ? atob(storedPass) === currentPassword : currentPassword === '123456';

    if (!isCurrentValid) {
      showToast('Current PIN is incorrect', 'error');
      return;
    }

    if (newPassword.length !== 6 || !/^\d+$/.test(newPassword)) {
      showToast('PIN must be exactly 6 digits', 'error');
      return;
    }

    // Success - Save locally and to Firestore
    const encodedPassword = btoa(newPassword);
    const now = new Date().toISOString();
    
    localStorage.setItem('crm_admin_password', encodedPassword);
    localStorage.setItem('crm_password_changed_at', now);
    
    updateSettings({
      adminPassword: encodedPassword,
      passwordChangedAt: now,
      protectedActions: toggles,
      sessionDuration: sessionDuration
    });

    setLastChanged(new Date(now).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    showToast('PIN updated & synced!');
    endAdminSession(); 
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleResetDefault = async () => {
    const confirmed = await requirePassword({ actionType: 'resetPassword', actionLabel: 'RESET Admin PIN to default' });
    if (confirmed) {
      const defaultPass = btoa('123456');
      localStorage.setItem('crm_admin_password', defaultPass);
      localStorage.removeItem('crm_password_changed_at');
      
      updateSettings({
        adminPassword: defaultPass,
        passwordChangedAt: null,
        protectedActions: toggles,
        sessionDuration: sessionDuration
      });

      setLastChanged('Never (Using Default)');
      showToast('Password reset to default and synced');
      endAdminSession();
    }
  };

  // --- TOGGLE ACTIONS ---
  const handleToggle = async (key) => {
    if (key === 'clearData') return; 
    
    const ok = await requirePassword({ actionType: 'editSettings', actionLabel: `UPDATE security toggle for ${key}` });
    if (!ok) return;

    const newToggles = { ...toggles, [key]: !toggles[key] };
    setToggles(newToggles);
    localStorage.setItem('crm_protected_actions', JSON.stringify(newToggles));
    
    updateSettings({
      adminPassword: localStorage.getItem('crm_admin_password'),
      protectedActions: newToggles,
      sessionDuration: sessionDuration
    });
    showToast('Setting updated & synced');
  };

  // --- SESSION SETTINGS ---
  const handleSessionChange = async (e) => {
    const val = e.target.value;
    
    const ok = await requirePassword({ actionType: 'editSettings', actionLabel: 'CHANGE session timeout duration' });
    if (!ok) return;

    setSessionDuration(val);
    localStorage.setItem('crm_session_duration', val);
    
    updateSettings({
      adminPassword: localStorage.getItem('crm_admin_password'),
      protectedActions: toggles,
      sessionDuration: val
    });
    showToast('Session duration updated & synced');
  };

  // --- DANGER ZONE ---
  const handleClearDataClick = async () => {
    if (deleteInput !== 'DELETE') return;
    const ok = await requirePassword({ actionType: "clearData", actionLabel: "CLEAR ALL APP DATA permanently" });
    if (ok) {
      const success = storage.clearAllData();
      if (success) {
        showToast('All data has been cleared', 'success');
        localStorage.setItem('crm_admin_password', btoa('123456')); // ensure app continues to work smoothly on fresh load
        // Note: storage.clearAllData removes ALL localStorage including the password. So I am putting default back immediately.
        setTimeout(() => window.location.reload(), 500); // hard reset state
      }
    }
  };

  const strength = getStrengthLabel(newPassword);

  return (
    <div className="max-w-[700px] mx-auto pb-20 animate-fade-in">
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium">Manage security, passwords, and application preferences.</p>
      </div>

      <div className="space-y-8">
        {/* SECTION 1: PASSWORD MANAGEMENT */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Lock className="w-5 h-5" /></div>
            <h2 className="text-lg font-black text-slate-800">Security Settings</h2>
          </div>
          <div className="p-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-start gap-4 mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-green-800">Security PIN is active</h4>
                <p className="text-xs font-bold text-green-600 mt-1">Last rotated: {lastChanged}</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Current Admin PIN *</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100">
                  <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="6-digit PIN" maxLength={6} className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 tracking-[0.5em]" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-slate-400 hover:text-slate-600 ml-2"><Eye className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">New Admin PIN *</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100">
                    <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required maxLength={6} className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 tracking-[0.5em]" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="text-slate-400 hover:text-slate-600 ml-2"><Eye className="w-4 h-4" /></button>
                  </div>
                  {newPassword && <p className={`text-[10px] font-black uppercase mt-1 ${strength.color}`}>{strength.label}</p>}
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Confirm New PIN *</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100">
                    <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required maxLength={6} className="w-full bg-transparent outline-none text-sm font-bold text-slate-700 tracking-[0.5em]" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-slate-400 hover:text-slate-600 ml-2"><Eye className="w-4 h-4" /></button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && <p className="text-red-500 text-[10px] font-black uppercase mt-1">PINs do not match</p>}
                  {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && <p className="text-green-500 text-[10px] font-black uppercase mt-1">PIN Matched ✓</p>}
                </div>
              </div>
              
              <div className="pt-4 flex flex-col md:flex-row items-center gap-4">
                <button type="submit" className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors">Update Password</button>
                <div className="flex-1"></div>
                <button type="button" onClick={handleResetDefault} className="w-full md:w-auto px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors">Reset to Default Password</button>
              </div>
            </form>
          </div>
        </div>

        {/* SECTION 2: PROTECTED ACTIONS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Shield className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Protected Actions</h2>
              <p className="text-xs font-bold text-slate-400">Choose which actions require PIN verification</p>
            </div>
          </div>
          <div className="p-2">
            {[
              { key: 'deleteVehicle', label: 'Require PIN to delete a vehicle', desc: 'PIN will be asked before deleting any vehicle' },
              { key: 'deleteTrip', label: 'Require PIN to delete a trip record', desc: '' },
              { key: 'deleteBooking', label: 'Require PIN to delete a booking', desc: '' },
              { key: 'cancelBooking', label: 'Require PIN to cancel a booking', desc: '' },
              { key: 'editVehicle', label: 'Require PIN to edit vehicle details', desc: '' },
              { key: 'editTrip', label: 'Require PIN to edit a trip record', desc: 'Turn on for stricter control' },
              { key: 'editBooking', label: 'Require PIN to edit a booking', desc: '' },
            ].map((item, idx) => (
              <div key={item.key} className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${idx !== 0 ? 'border-t border-slate-50' : ''}`}>
                <div>
                  <h4 className="font-bold text-slate-700">{item.label}</h4>
                  {item.desc && <p className="text-xs text-slate-400 mt-1">{item.desc}</p>}
                </div>
                <button 
                  onClick={() => handleToggle(item.key)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${toggles[item.key] ? 'bg-blue-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${toggles[item.key] ? 'transform translate-x-6' : ''}`}></div>
                </button>
              </div>
            ))}
            {/* Always On Toggle */}
            <div className="flex items-center justify-between p-4 border-t border-slate-50 bg-slate-50/50">
              <div>
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  Require PIN to clear all app data <Lock className="w-3 h-3 text-slate-400" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 uppercase font-black">Always required</p>
              </div>
              <button disabled className="w-12 h-6 rounded-full relative bg-blue-300 cursor-not-allowed">
                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transform translate-x-6 opacity-80"></div>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: SESSION SETTINGS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Timer className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Session Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <label className="block font-bold text-slate-700 mb-1">Admin Session Duration</label>
            <p className="text-xs text-slate-400 mb-4">After correct PIN how long before it is required again</p>
            <select value={sessionDuration} onChange={handleSessionChange} className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
              <option value="2">2 Minutes</option>
              <option value="5">5 Minutes</option>
              <option value="10">10 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="Until Page Refresh">Until Page Refresh</option>
            </select>
          </div>
        </div>
        
        {/* SECTION 4: CLOUD SYNC INFO & LIMITS */}
        <div className="bg-blue-50/30 rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="p-6 border-b border-blue-100 flex items-center gap-3 bg-blue-50">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Cloud className="w-5 h-5" /></div>
            <h2 className="text-lg font-black text-blue-800">Cloud Sync & Quotas</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
               <div className="mt-1 bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0"><AlertTriangle className="w-4 h-4" /></div>
               <div>
                  <h4 className="font-bold text-slate-800 mb-1">Firebase Spark (Free) Plan Limits</h4>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                     Your data is synchronized using the Firebase free tier. Please be aware of the following daily limits. If these are exceeded, sync may stop until the next day.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { label: 'Data Storage', value: '1 GB Total', icon: Info },
                        { label: 'Reads / Day', value: '50,000', icon: Info },
                        { label: 'Writes / Day', value: '20,000', icon: Info },
                        { label: 'Deletes / Day', value: '20,000', icon: Info },
                     ].map((lim, i) => (
                        <div key={i} className="bg-white/80 border border-blue-100 p-3 rounded-xl flex items-center justify-between">
                           <span className="text-xs font-bold text-slate-500 uppercase">{lim.label}</span>
                           <span className="text-sm font-black text-blue-700">{lim.value}</span>
                        </div>
                     ))}
                  </div>
                  
                  <p className="text-[11px] text-slate-400 mt-4 italic font-medium">
                     * This car rental app uses very small data packets, so these limits are extremely high for typical small-business usage.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: DANGER ZONE */}
        <div className="bg-red-50/30 rounded-3xl shadow-sm border-2 border-red-100 overflow-hidden">
          <div className="p-6 border-b border-red-100 flex items-center gap-3 bg-red-50">
            <div className="bg-red-100 p-2 rounded-xl text-red-600"><AlertTriangle className="w-5 h-5" /></div>
            <h2 className="text-lg font-black text-red-800">Danger Zone</h2>
          </div>
          <div className="p-6">
            <h3 className="font-bold text-red-900 mb-2">Clear All App Data</h3>
            <p className="text-sm font-medium text-red-700/80 mb-6">
              This will permanently delete ALL vehicles, ALL trips, ALL bookings. This action CANNOT be undone. Type <strong className="font-black bg-white px-1 border border-red-200 rounded">DELETE</strong> below to confirm.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Type DELETE" 
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                className="w-full md:w-1/3 px-4 py-3 bg-white border border-red-200 rounded-xl font-bold text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 placeholder:text-red-200 uppercase"
              />
              <button 
                disabled={deleteInput !== 'DELETE'}
                onClick={handleClearDataClick}
                className="px-6 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:bg-red-100 disabled:text-red-300 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 disabled:shadow-none"
              >
                I understand, Delete Everything
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
