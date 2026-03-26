import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerPassword, setOwnerPassword] = useState('admin123'); // Default fallback

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('crm_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

    // Still fetch owner password from settings for security
    const unsubOwner = onSnapshot(doc(db, 'settings', 'owner'), (docSnap) => {
      if (docSnap.exists()) {
        setOwnerPassword(docSnap.data().password);
      }
    });

    setLoading(false);
    return () => unsubOwner();
  }, []);

  const loginAsOwner = (password) => {
    if (password === ownerPassword) {
      const newSession = { role: 'OWNER', name: 'Owner' };
      setSession(newSession);
      localStorage.setItem('crm_session', JSON.stringify(newSession));
      return true;
    }
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
