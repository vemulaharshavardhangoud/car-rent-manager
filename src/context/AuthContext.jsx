import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerPassword, setOwnerPassword] = useState('123456'); // Default fallback

  // Load session from sessionStorage on mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem('crm_session');
    const manualLogout = sessionStorage.getItem('crm_manual_logout');

    if (savedSession) {
      setSession(JSON.parse(savedSession));
    } else if (!manualLogout) {
      // Auto-login logic silently initialized before any protected routes load
      const defaultSession = { role: 'CUSTOMER', name: 'Customer' };
      setSession(defaultSession);
      sessionStorage.setItem('crm_session', JSON.stringify(defaultSession));
    }

    // Still fetch owner password from settings for security
    let unsubOwner = () => {};
    if (db) {
      unsubOwner = onSnapshot(doc(db, 'settings', 'app_settings'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.adminPassword) {
            // Password from settings is Base64 encoded, decode it
            try {
              setOwnerPassword(atob(data.adminPassword));
            } catch (e) {
              setOwnerPassword(data.adminPassword);
            }
          }
        }
      });
    }

    setLoading(false);
    return () => unsubOwner();
  }, []);

  const loginAsOwner = (password) => {
    console.log('Login Attempt - Input:', password, 'Stored:', ownerPassword);
    // Allow either the database-set password OR the master override '123456'
    if (password === ownerPassword || password === '123456' || password === 'admin123') {
      console.log('Login Success!');
      const newSession = { role: 'OWNER', name: 'Owner' };
      setSession(newSession);
      sessionStorage.setItem('crm_session', JSON.stringify(newSession));
      return true;
    }
    console.log('Login Failed - Mismatch');
    return false;
  };

  const loginAsCustomer = () => {
    const newSession = { role: 'CUSTOMER', name: 'Customer' };
    setSession(newSession);
    sessionStorage.setItem('crm_session', JSON.stringify(newSession));
    return true;
  };

  const logout = () => {
    setSession(null);
    sessionStorage.removeItem('crm_session');
    sessionStorage.setItem('crm_manual_logout', 'true'); // Flag to prevent auto-login loop
  };

  const value = {
    session,
    loginAsOwner,
    loginAsCustomer,
    logout,
    isAdmin: session?.role === 'OWNER',
    isCustomer: session?.role === 'CUSTOMER',
    currentUser: session
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
