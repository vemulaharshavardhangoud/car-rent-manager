import React, { useState, useEffect, useContext } from 'react';
import { Lock, Eye, EyeOff, Shield, Timer, AlertTriangle, CheckCircle2, Cloud, Info, Mail, Key } from 'lucide-react';
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

  // Delete PIN Form State
  const [currentDeletePass, setCurrentDeletePass] = useState('');
  const [newDeletePass, setNewDeletePass] = useState('');
  const [confirmDeletePass, setConfirmDeletePass] = useState('');
  const [showCurrentDelete, setShowCurrentDelete] = useState(false);
  const [showNewDelete, setShowNewDelete] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Clear Data State
  const [deleteInput, setDeleteInput] = useState('');

  // Email Config State
  const [emailConfig, setEmailConfig] = useState({
    serviceId: localStorage.getItem('crm_email_service_id') || '',
    templateId: localStorage.getItem('crm_email_template_id') || '',
    publicKey: localStorage.getItem('crm_email_public_key') || ''
  });

  const handleSaveEmailConfig = async (e) => {
    e.preventDefault();
    const ok = await requirePassword({ actionType: 'editSettings', actionLabel: 'SAVE EmailJS Integration Keys' });
    if (!ok) return;

    localStorage.setItem('crm_email_service_id', emailConfig.serviceId);
    localStorage.setItem('crm_email_template_id', emailConfig.templateId);
    localStorage.setItem('crm_email_public_key', emailConfig.publicKey);
    
    showToast('Email Configuration Saved', 'success');
  };

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
      deletePassword: localStorage.getItem('crm_delete_password'),
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

  const handleUpdateDeletePassword = (e) => {
    e.preventDefault();
    if (newDeletePass !== confirmDeletePass) {
      showToast('Delete PINs do not match', 'error');
      return;
    }

    const storedPass = localStorage.getItem('crm_delete_password');
    const isCurrentValid = storedPass ? atob(storedPass) === currentDeletePass : currentDeletePass === '654321';

    if (!isCurrentValid) {
      showToast('Current Delete PIN is incorrect', 'error');
      return;
    }

    if (newDeletePass.length !== 6 || !/^\d+$/.test(newDeletePass)) {
      showToast('Delete PIN must be exactly 6 digits', 'error');
      return;
    }

    // Success - Save locally and to Firestore
    const encodedPassword = btoa(newDeletePass);
    localStorage.setItem('crm_delete_password', encodedPassword);
    
    updateSettings({
      adminPassword: localStorage.getItem('crm_admin_password'),
      deletePassword: encodedPassword,
      protectedActions: toggles,
      sessionDuration: sessionDuration
    });

    showToast('Delete PIN updated & synced!');
    setCurrentDeletePass('');
    setNewDeletePass('');
    setConfirmDeletePass('');
  };

  const handleResetDefault = async () => {
    const confirmed = await requirePassword({ actionType: 'resetPassword', actionLabel: 'RESET Admin PIN to default' });
    if (confirmed) {
      const defaultPass = btoa('123456');
      localStorage.setItem('crm_admin_password', defaultPass);
      localStorage.removeItem('crm_password_changed_at');
      
      updateSettings({
        adminPassword: defaultPass,
        deletePassword: localStorage.getItem('crm_delete_password'),
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
      deletePassword: localStorage.getItem('crm_delete_password'),
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
      deletePassword: localStorage.getItem('crm_delete_password'),
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
        <h1 className="text-3xl font-black text-text-main tracking-tight">Settings</h1>
        <p className="text-text-muted font-medium">Manage security, passwords, and application preferences.</p>
      </div>

      <div className="space-y-8">
        {/* SECTION 1: PASSWORD MANAGEMENT */}
        <div className="bg-card-bg rounded-3xl shadow-sm border border-border-main overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border-main flex items-center gap-3 bg-main-bg/50">
            <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500"><Lock className="w-5 h-5" /></div>
            <h2 className="text-base sm:text-lg font-black text-text-main">Security Settings</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 flex items-start gap-4 mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-green-600 dark:text-green-400">Security PIN is active</h4>
                <p className="text-xs font-bold text-green-500/70 mt-1">Last rotated: {lastChanged}</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-text-muted uppercase mb-2">Current Admin PIN *</label>
                <div className="flex items-center bg-main-bg border border-border-main rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/20">
                  <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="6-digit PIN" maxLength={6} className="w-full bg-transparent outline-none text-sm font-bold text-text-main tracking-[0.5em]" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-text-muted hover:text-text-main ml-2"><Eye className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase mb-2">New Admin PIN *</label>
                  <div className="flex items-center bg-main-bg border border-border-main rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required maxLength={6} className="w-full bg-transparent outline-none text-sm font-bold text-text-main tracking-[0.5em]" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="text-text-muted hover:text-text-main ml-2"><Eye className="w-4 h-4" /></button>
                  </div>
                  {newPassword && <p className={`text-[10px] font-black uppercase mt-1 ${strength.color}`}>{strength.label}</p>}
                </div>
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase mb-2">Confirm New PIN *</label>
                  <div className="flex items-center bg-main-bg border border-border-main rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required maxLength={6} className="w-full bg-transparent outline-none text-sm font-bold text-text-main tracking-[0.5em]" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-text-muted hover:text-text-main ml-2"><Eye className="w-4 h-4" /></button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && <p className="text-red-500 text-[10px] font-black uppercase mt-1">PINs do not match</p>}
                  {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && <p className="text-green-500 text-[10px] font-black uppercase mt-1">PIN Matched ✓</p>}
                </div>
              </div>
              
              <div className="pt-4 flex flex-col md:flex-row items-center gap-4">
                <button type="submit" className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10">Update Password</button>
                <div className="flex-1"></div>
                <button type="button" onClick={handleResetDefault} className="w-full md:w-auto px-6 py-3 rounded-xl border-2 border-border-main text-text-muted font-bold hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-colors">Reset to Default Password</button>
              </div>
            </form>
          </div>
        </div>

        {/* SECTION 1B: DELETE PIN MANAGEMENT */}
        <div className="bg-card-bg rounded-3xl shadow-sm border border-border-main overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border-main flex items-center gap-3 bg-red-500/5">
            <div className="bg-red-500/10 p-2 rounded-xl text-red-500"><Lock className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-text-main">Delete PIN Management</h2>
              <p className="text-[10px] sm:text-xs font-bold text-text-muted">Set a separate PIN for sensitive delete operations</p>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <form onSubmit={handleUpdateDeletePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-text-muted uppercase mb-2">Current Delete PIN *</label>
                <div className="flex items-center bg-main-bg border border-border-main rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-red-500/20">
                  <input type={showCurrentDelete ? "text" : "password"} value={currentDeletePass} onChange={e => setCurrentDeletePass(e.target.value)} required placeholder="Default: 654321" maxLength={6} className="w-full bg-transparent outline-none text-sm font-bold text-text-main tracking-[0.5em]" />
                  <button type="button" onClick={() => setShowCurrentDelete(!showCurrentDelete)} className="text-text-muted hover:text-text-main ml-2"><Eye className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase mb-2">New Delete PIN *</label>
                  <div className="flex items-center bg-main-bg border border-border-main rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-red-500/20">
                    <input type={showNewDelete ? "text" : "password"} value={newDeletePass} onChange={e => setNewDeletePass(e.target.value)} required maxLength={6} className="w-full bg-transparent outline-none text-sm font-bold text-text-main tracking-[0.5em]" />
                    <button type="button" onClick={() => setShowNewDelete(!showNewDelete)} className="text-text-muted hover:text-text-main ml-2"><Eye className="w-4 h-4" /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase mb-2">Confirm Delete PIN *</label>
                  <div className="flex items-center bg-main-bg border border-border-main rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-red-500/20">
                    <input type={showConfirmDelete ? "text" : "password"} value={confirmDeletePass} onChange={e => setConfirmDeletePass(e.target.value)} required maxLength={6} className="w-full bg-transparent outline-none text-sm font-bold text-text-main tracking-[0.5em]" />
                    <button type="button" onClick={() => setShowConfirmDelete(!showConfirmDelete)} className="text-text-muted hover:text-text-main ml-2"><Eye className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button type="submit" className="w-full md:w-auto px-6 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 transition-colors shadow-lg shadow-red-500/10">Update Delete PIN</button>
              </div>
            </form>
          </div>
        </div>

        {/* SECTION 2: PROTECTED ACTIONS */}
        <div className="bg-card-bg rounded-3xl shadow-sm border border-border-main overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border-main flex items-center gap-3 bg-main-bg/50">
            <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500"><Shield className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-text-main">Protected Actions</h2>
              <p className="text-[10px] sm:text-xs font-bold text-text-muted">Choose which actions require PIN verification</p>
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
              <div key={item.key} className={`flex items-center justify-between p-4 hover:bg-main-bg transition-colors ${idx !== 0 ? 'border-t border-border-main/50' : ''}`}>
                <div>
                  <h4 className="font-bold text-text-main">{item.label}</h4>
                  {item.desc && <p className="text-xs text-text-muted mt-1">{item.desc}</p>}
                </div>
                <button 
                  onClick={() => handleToggle(item.key)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${toggles[item.key] ? 'bg-blue-500' : 'bg-border-main'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${toggles[item.key] ? 'transform translate-x-6' : ''}`}></div>
                </button>
              </div>
            ))}
            {/* Always On Toggle */}
            <div className="flex items-center justify-between p-4 border-t border-border-main/50 bg-main-bg/30">
              <div>
                <h4 className="font-bold text-text-main flex items-center gap-2">
                  Require PIN to clear all app data <Lock className="w-3 h-3 text-text-muted" />
                </h4>
                <p className="text-xs text-text-muted mt-1 uppercase font-black">Always required</p>
              </div>
              <button disabled className="w-12 h-6 rounded-full relative bg-blue-300 cursor-not-allowed">
                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transform translate-x-6 opacity-80"></div>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: SESSION SETTINGS */}
        <div className="bg-card-bg rounded-3xl shadow-sm border border-border-main overflow-hidden">
          <div className="p-6 border-b border-border-main flex items-center gap-3 bg-main-bg/50">
            <div className="bg-purple-500/10 p-2 rounded-xl text-purple-600"><Timer className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-black text-text-main">Session Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <label className="block font-bold text-text-main mb-1">Admin Session Duration</label>
            <p className="text-xs text-text-muted mb-4">After correct PIN how long before it is required again</p>
            <select value={sessionDuration} onChange={handleSessionChange} className="w-full md:w-1/2 px-4 py-3 bg-main-bg border border-border-main rounded-xl font-bold text-text-main outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
              <option value="2">2 Minutes</option>
              <option value="5">5 Minutes</option>
              <option value="10">10 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="Until Page Refresh">Until Page Refresh</option>
            </select>
          </div>
        </div>
        
        {/* SECTION 4: CLOUD SYNC INFO & LIMITS */}
        <div className="bg-blue-500/5 rounded-3xl shadow-sm border border-blue-500/20 overflow-hidden">
          <div className="p-6 border-b border-blue-500/20 flex items-center gap-3 bg-blue-500/10">
            <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500"><Cloud className="w-5 h-5" /></div>
            <h2 className="text-lg font-black text-blue-600">Cloud Sync & Quotas</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
               <div className="mt-1 bg-amber-500/10 p-2 rounded-lg text-amber-500 shrink-0"><AlertTriangle className="w-4 h-4" /></div>
               <div>
                  <h4 className="font-bold text-text-main mb-1">Firebase Spark (Free) Plan Limits</h4>
                  <p className="text-sm text-text-muted leading-relaxed mb-4">
                     Your data is synchronized using the Firebase free tier. Please be aware of the following daily limits. If these are exceeded, sync may stop until the next day.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { label: 'Data Storage', value: '1 GB Total', icon: Info },
                        { label: 'Reads / Day', value: '50,000', icon: Info },
                        { label: 'Writes / Day', value: '20,000', icon: Info },
                        { label: 'Deletes / Day', value: '20,000', icon: Info },
                     ].map((lim, i) => (
                        <div key={i} className="bg-card-bg/50 border border-blue-500/10 p-3 rounded-xl flex items-center justify-between">
                           <span className="text-xs font-bold text-text-muted uppercase">{lim.label}</span>
                           <span className="text-sm font-black text-blue-500">{lim.value}</span>
                        </div>
                     ))}
                  </div>
                  
                  <p className="text-[11px] text-text-muted mt-4 italic font-medium">
                     * This car rental app uses very small data packets, so these limits are extremely high for typical small-business usage.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* SECTION 4.5: EMAILJS CONFIGURATION */}
        <div className="bg-card-bg rounded-3xl shadow-sm border border-border-main overflow-hidden">
          <div className="p-6 border-b border-border-main flex items-center gap-3 bg-emerald-500/5">
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500"><Mail className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-black text-text-main">Email API Configuration</h2>
              <p className="text-[10px] sm:text-xs font-bold text-text-muted">Link your EmailJS account for automated alerts</p>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-6 flex items-start gap-3">
               <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
               <div className="text-sm">
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Free Tier Notice (200 Emails/Month)</h4>
                  <p className="text-emerald-600/80 dark:text-emerald-400/80 font-medium text-xs mt-1">If you exceed your free 200 emails a month, the system will log a warning and stop sending alerts until the next month unless upgraded on EmailJS.</p>
               </div>
            </div>

            <form onSubmit={handleSaveEmailConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase mb-2">Service ID</label>
                  <div className="flex items-center bg-main-bg border border-border-main rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500/20">
                    <input type="text" value={emailConfig.serviceId} onChange={e => setEmailConfig({...emailConfig, serviceId: e.target.value})} placeholder="e.g. service_xyz" className="w-full bg-transparent outline-none text-sm font-bold text-text-main" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-text-muted uppercase mb-2">Template ID</label>
                  <div className="flex items-center bg-main-bg border border-border-main rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500/20">
                    <input type="text" value={emailConfig.templateId} onChange={e => setEmailConfig({...emailConfig, templateId: e.target.value})} placeholder="e.g. template_abc" className="w-full bg-transparent outline-none text-sm font-bold text-text-main" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-text-muted uppercase mb-2">Public Key</label>
                <div className="flex items-center bg-main-bg border border-border-main rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <Key className="w-4 h-4 text-text-muted mr-3" />
                  <input type="text" value={emailConfig.publicKey} onChange={e => setEmailConfig({...emailConfig, publicKey: e.target.value})} placeholder="Your public key from Account tab" className="w-full bg-transparent outline-none text-sm font-bold text-text-main" />
                </div>
              </div>
              
              <div className="pt-4">
                <button type="submit" className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/10">Save Email Config</button>
              </div>
            </form>
          </div>
        </div>

        {/* SECTION 5: DANGER ZONE */}
        <div className="bg-red-500/5 rounded-3xl shadow-sm border-2 border-red-500/20 overflow-hidden">
          <div className="p-6 border-b border-red-500/20 flex items-center gap-3 bg-red-500/10">
            <div className="bg-red-500/10 p-2 rounded-xl text-red-500"><AlertTriangle className="w-5 h-5" /></div>
            <h2 className="text-lg font-black text-red-600">Danger Zone</h2>
          </div>
          <div className="p-6">
            <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">Clear All App Data</h3>
            <p className="text-sm font-medium text-text-muted mb-6">
              This will permanently delete ALL vehicles, ALL trips, ALL bookings. This action CANNOT be undone. Type <strong className="font-black bg-main-bg px-2 border border-red-500/20 rounded text-red-600">DELETE</strong> below to confirm.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Type DELETE" 
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                className="w-full md:w-1/3 px-4 py-3 bg-main-bg border border-red-500/20 rounded-xl font-bold text-text-main outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 placeholder:text-red-500/20 uppercase"
              />
              <button 
                disabled={deleteInput !== 'DELETE'}
                onClick={handleClearDataClick}
                className="px-6 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:bg-red-500/10 disabled:text-red-500/30 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/10 disabled:shadow-none"
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
