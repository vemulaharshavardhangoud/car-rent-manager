import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const PasswordModal = ({ isOpen, actionInfo, onConfirm, onCancel }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setAttempts(3);
      setIsLocked(false);
      setCountdown(0);
      setShowPassword(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && isLocked) {
      onCancel(); // auto close
    }
    return () => clearTimeout(timer);
  }, [countdown, isLocked, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLocked) return;

    const storedPass = localStorage.getItem('crm_admin_password');
    let isValid = false;
    
    // Default fallback check
    if (!storedPass && password === 'admin123') isValid = true;
    else if (storedPass && btoa(password) === storedPass) isValid = true;

    if (isValid) {
      onConfirm(password);
    } else {
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      if (newAttempts <= 0) {
        setIsLocked(true);
        setCountdown(5);
        setError('Too many wrong attempts. Please try again later.');
      } else {
        setError(`Incorrect password. ${newAttempts} attempt(s) remaining.`);
        setPassword('');
        inputRef.current?.focus();
        
        // Shake animation triggering
        const el = document.getElementById('pwd-input-container');
        if (el) {
          el.classList.remove('animate-shake');
          void el.offsetWidth; // trigger reflow
          el.classList.add('animate-shake');
        }
      }
    }
  };
  
  const getModalTitleSubtitle = () => {
    const defaultSubtitle = "Enter password to proceed";
    if (!actionInfo) return defaultSubtitle;
    
    switch(actionInfo.actionType) {
      case 'deleteVehicle': return "Enter password to delete this vehicle";
      case 'deleteTrip': return "Enter password to delete this trip";
      case 'deleteBooking': return "Enter password to delete this booking";
      case 'cancelBooking': return "Enter password to cancel this booking";
      case 'editVehicle': return "Enter password to edit vehicle details";
      case 'editTrip': return "Enter password to edit this trip";
      case 'editBooking': return "Enter password to edit this booking";
      case 'clearData': return "Enter password to clear all app data";
      default: return defaultSubtitle;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden animate-fade-in-up">
        
        <div className="p-6 text-center border-b border-slate-100">
          <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-red-600">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Admin Verification Required</h2>
          <p className="text-sm font-bold text-slate-400 mt-1">{getModalTitleSubtitle()}</p>
        </div>

        <div className="p-6">
          {actionInfo?.actionLabel && (
            <div className="bg-red-50 p-3 rounded-xl border border-red-100 mb-6 text-center">
              <p className="text-xs font-black text-red-600 uppercase tracking-wide">You are about to</p>
              <p className="text-sm font-bold text-red-900 mt-1">
                {actionInfo.actionLabel}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Admin Password</label>
              <div 
                id="pwd-input-container"
                className={`flex items-center bg-slate-50 border rounded-xl overflow-hidden transition-all focus-within:ring-4 focus-within:ring-blue-100 ${error ? 'border-red-400' : 'border-slate-200 focus-within:border-blue-400'}`}
              >
                <input 
                  ref={inputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 bg-transparent outline-none font-bold text-slate-700"
                  disabled={isLocked}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  disabled={isLocked}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <div className="mt-2 text-center">
                  <p className="text-red-500 font-bold text-xs">{error}</p>
                  {isLocked && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">Closing in {countdown}... {countdown === 5 || countdown > 3 ? countdown-1 : ''}... {countdown > 4 ? countdown-2 : ''}...</p>}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLocked || password.length === 0}
                className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
