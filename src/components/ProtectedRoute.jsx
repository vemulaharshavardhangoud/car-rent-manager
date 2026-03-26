import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Securing Session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login but save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && session.role !== requiredRole) {
    // Role check failed (not OWNER)
    if (requiredRole === 'OWNER' && session.role !== 'OWNER') {
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-text-main mb-4 tracking-tight">Access Denied</h1>
            <p className="text-text-muted max-w-md mx-auto font-medium">
              You do not have the required <span className="text-red-500 font-bold">OWNER</span> privileges to view this high-security module.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg shadow-blue-500/10"
            >
              Go Back
            </button>
          </div>
        );
    }
  }

  return children;
};

export default ProtectedRoute;
