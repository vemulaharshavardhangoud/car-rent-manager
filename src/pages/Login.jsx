import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, Eye, Shield, CarFront, ArrowRight, UserCheck } from 'lucide-react';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('CUSTOMER'); // Default to Customer Hub
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { 
    loginAsOwner, 
    loginAsCustomer, 
    session 
  } = useAuth();
  const navigate = useNavigate();

  // If already logged in, go to dashboard
  if (session) {
    return <Navigate to="/" />;
  }


  const handleOwnerLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // The actual loginAsOwner function is defined in AuthContext.js
    // This console log traces the input to the login function from the Login component
    console.log('handleOwnerLogin called with password:', password);
    const success = loginAsOwner(password);
    console.log('HandleOwnerLogin Result:', success);
    if (success) {
      navigate('/');
    } else {
      setError(`Incorrect Owner Password. (Debug: v6.0.1)`);
    }
    setLoading(false);
  };

  const handleCustomerLogin = () => {
    setLoading(true);
    loginAsCustomer();
    navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-300">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-4xl relative z-10 animate-fade-in">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/20 rotate-12 mb-6">
            <CarFront className="w-10 h-10 text-white -rotate-12" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-3">CarRent Manager</h1>
          <p className="text-slate-200 font-medium lg:text-lg">Choose Your Portal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 px-2">
          {/* Owner Card */}
          <div 
            onClick={() => setSelectedRole('OWNER')}
            className={`cursor-pointer group relative overflow-hidden transition-all duration-500 rounded-[2.5rem] p-1 ${
              selectedRole === 'OWNER' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="bg-slate-900 h-full rounded-[2.4rem] p-8 lg:p-10 flex flex-col">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <Lock className={`w-8 h-8 lg:w-9 lg:h-9 ${selectedRole === 'OWNER' ? 'text-blue-500' : 'text-slate-500 transition-colors'}`} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">Owner Portal</h2>
              <p className="text-slate-500 font-medium text-sm lg:text-base mb-10 leading-relaxed italic">Management access for owners.</p>
              
              {selectedRole === 'OWNER' ? (
                <form onSubmit={handleOwnerLogin} className="space-y-6 mt-auto animate-fade-in">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      autoFocus
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Owner Login Key"
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white font-medium focus:border-blue-500 outline-none transition-all uppercase tracking-widest text-xs"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <Lock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </button>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all active:scale-95">
                    Authorized Entry
                  </button>
                </form>
              ) : (
                <div className="mt-auto flex items-center text-blue-500 font-bold text-sm uppercase tracking-widest gap-2 group-hover:gap-4 transition-all duration-300">
                  Select <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Customer Card */}
          <div 
            onClick={() => setSelectedRole('CUSTOMER')}
            className={`cursor-pointer group relative overflow-hidden transition-all duration-500 rounded-[2.5rem] p-1 ${
              selectedRole === 'CUSTOMER' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="bg-slate-900 h-full rounded-[2.4rem] p-8 lg:p-10 flex flex-col">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <Eye className={`w-8 h-8 lg:w-9 lg:h-9 ${selectedRole === 'CUSTOMER' ? 'text-emerald-500' : 'text-slate-500 transition-colors'}`} />
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">Customer Hub</h2>
              <p className="text-slate-500 font-medium text-sm lg:text-base mb-10 leading-relaxed italic">Book vehicles and track your rentals.</p>
              
              {selectedRole === 'CUSTOMER' ? (
                <div className="space-y-6 mt-auto animate-fade-in">
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-slate-400 text-xs font-medium flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-emerald-500" />
                    No password required for customers.
                  </div>
                  <button 
                    onClick={handleCustomerLogin}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    Enter Now
                  </button>
                </div>
              ) : (
                <div className="mt-auto flex items-center text-emerald-500 font-bold text-sm uppercase tracking-widest gap-2 group-hover:gap-4 transition-all duration-300">
                  Select <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center animate-shake">
            {error}
          </div>
        )}

        <p className="text-center mt-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
          Version 6.0.0 • Secured Access System
        </p>
      </div>
    </div>
  );
};

export default Login;
