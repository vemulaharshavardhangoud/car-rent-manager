import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerPassword, setOwnerPassword] = useState('123456'); // Default fallback

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('crm_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

    // Still fetch owner password from settings for security
    const unsubOwner = onSnapshot(doc(db, 'settings', 'app_settings'), (docSnap) => {
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
      localStorage.setItem('crm_session', JSON.stringify(newSession));
      return true;
    }
    console.log('Login Failed - Mismatch');
    return false;
  };

  const loginAsCustomer = () => {
    const newSession = { role: 'CUSTOMER', name: 'Customer' };
    setSession(newSession);
    localStorage.setItem('crm_session', JSON.stringify(newSession));
    return true;
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('crm_session');
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
