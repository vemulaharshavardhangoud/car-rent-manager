import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as storage from '../utils/storage';
import PasswordModal from '../components/PasswordModal';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });

  // Admin Session State
  const [adminSession, setAdminSession] = useState({
    active: false,
    expiresAt: null
  });

  // Password Modal State
  const [passwordModalConfig, setPasswordModalConfig] = useState({
    isOpen: false,
    actionInfo: null,
    resolve: null
  });

  const loadAllData = () => {
    setVehicles(storage.getAllVehicles());
    setAllTrips(storage.getAllTrips());
    setBookings(storage.getAllBookings());
  };

  useEffect(() => {
    loadAllData();
    
    // Global Settings Initialization
    if (!localStorage.getItem('crm_admin_password')) {
      localStorage.setItem('crm_admin_password', btoa('admin123'));
    }
    if (!localStorage.getItem('crm_protected_actions')) {
      const defaultToggles = {
        deleteVehicle: true,
        deleteTrip: true,
        deleteBooking: true,
        cancelBooking: true,
        editVehicle: true,
        editTrip: false,
        editBooking: true,
        clearData: true
      };
      localStorage.setItem('crm_protected_actions', JSON.stringify(defaultToggles));
    }
    if (!localStorage.getItem('crm_session_duration')) {
      localStorage.setItem('crm_session_duration', '5');
    }
  }, []);

  // Global Auth Guard Function
  const requirePassword = useCallback((actionInfo) => {
    return new Promise((resolve) => {
      const protectedActionsStr = localStorage.getItem('crm_protected_actions');
      const protectedActions = protectedActionsStr ? JSON.parse(protectedActionsStr) : {};
      
      const isProtected = protectedActions[actionInfo.actionType] ?? true;

      // clearData is absolutely protected no matter what settings say
      if (actionInfo.actionType !== 'clearData' && !isProtected) {
        return resolve(true);
      }

      // Check Active Session
      if (adminSession.active && adminSession.expiresAt > Date.now()) {
        return resolve(true);
      }

      // Prompt User
      setPasswordModalConfig({ isOpen: true, actionInfo, resolve });
    });
  }, [adminSession]);

  const handlePasswordSuccess = () => {
    const durationSetting = localStorage.getItem('crm_session_duration') || '5';
    let expiresAt = null;
    
    if (durationSetting === 'Until Page Refresh') {
      expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 365; // Indefinitely
    } else {
      expiresAt = Date.now() + parseInt(durationSetting, 10) * 60 * 1000;
    }

    setAdminSession({ active: true, expiresAt });
    if (passwordModalConfig.resolve) passwordModalConfig.resolve(true);
    setPasswordModalConfig({ isOpen: false, actionInfo: null, resolve: null });
  };

  const handlePasswordCancel = () => {
    if (passwordModalConfig.resolve) passwordModalConfig.resolve(false);
    setPasswordModalConfig({ isOpen: false, actionInfo: null, resolve: null });
  };

  const endAdminSession = useCallback(() => {
    setAdminSession({ active: false, expiresAt: null });
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const addVehicle = (vehicle) => {
    const saved = storage.saveVehicle(vehicle);
    if (saved) {
      setVehicles(storage.getAllVehicles());
      showToast('Vehicle added successfully');
    }
  };

  const updateVehicle = (id, updatedData) => {
    const updated = storage.updateVehicle(id, updatedData);
    if (updated) {
      setVehicles(storage.getAllVehicles());
      showToast('Vehicle updated successfully');
    }
  };

  const deleteVehicle = (id) => {
    if (storage.deleteVehicle(id)) {
      setVehicles(storage.getAllVehicles());
      setAllTrips(storage.getAllTrips());
      showToast('Vehicle deleted.', 'error');
    }
  };

  const addTrip = (trip) => {
    const saved = storage.saveTrip(trip.vehicleId, trip);
    if (saved) {
      setAllTrips(storage.getAllTrips());
      showToast('Trip added successfully');
    }
  };

  const deleteTrip = (id) => {
    const trip = allTrips.find(t => t.id === id);
    if (trip && storage.deleteTripById(trip.vehicleId, id)) {
      setAllTrips(storage.getAllTrips());
      showToast('Trip deleted successfully');
    }
  };

  const updateTrip = (id, updatedData) => {
    const trip = allTrips.find(t => t.id === id);
    if (trip) {
       const updated = storage.updateTrip(trip.vehicleId, id, updatedData);
       if (updated) {
          setAllTrips(storage.getAllTrips());
          showToast('Trip updated successfully');
       }
    }
  };

  const addBooking = (bookingData) => {
    const saved = storage.saveBooking(bookingData);
    if (saved) {
      setBookings(storage.getAllBookings());
      setVehicles(storage.getAllVehicles()); // Refresh as status changed
      showToast(`Booking ${saved.id} confirmed!`);
      return saved;
    }
    return null;
  };

  const updateBooking = (id, updatedFields) => {
    const updated = storage.updateBooking(id, updatedFields);
    if (updated) {
      setBookings(storage.getAllBookings());
      setVehicles(storage.getAllVehicles()); // Refresh in case vehicle changed
      showToast('Booking updated successfully');
      return updated;
    }
    return null;
  };

  const cancelBooking = (id, cancellationData) => {
    const updated = storage.cancelBooking(id, cancellationData);
    if (updated) {
      setBookings(storage.getAllBookings());
      setVehicles(storage.getAllVehicles()); // Refresh as status changed
      showToast('Booking cancelled', 'error');
      return updated;
    }
    return null;
  };

  const deleteBooking = (id) => {
    if (storage.deleteBooking(id)) {
      setBookings(storage.getAllBookings());
      setVehicles(storage.getAllVehicles()); // Refresh as status may reset
      showToast('Booking deleted', 'error');
      return true;
    }
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        vehicles,
        allTrips,
        bookings,
        toast,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addTrip,
        deleteTrip,
        updateTrip,
        addBooking,
        updateBooking,
        cancelBooking,
        deleteBooking,
        showToast,
        requirePassword,
        adminSession,
        endAdminSession
      }}
    >
      {children}
      <PasswordModal 
        isOpen={passwordModalConfig.isOpen}
        actionInfo={passwordModalConfig.actionInfo}
        onConfirm={handlePasswordSuccess}
        onCancel={handlePasswordCancel}
      />
    </AppContext.Provider>
  );
};
