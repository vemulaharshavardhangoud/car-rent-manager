import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as storage from '../utils/storage';
import PasswordModal from '../components/PasswordModal';
import * as firestore from '../utils/firestoreService';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

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
    const initSettings = async () => {
      const remoteSettings = await firestore.getSettingsFromFirestore();
      if (remoteSettings) {
        localStorage.setItem('crm_admin_password', remoteSettings.adminPassword);
        localStorage.setItem('crm_protected_actions', JSON.stringify(remoteSettings.protectedActions));
        localStorage.setItem('crm_session_duration', remoteSettings.sessionDuration.toString());
      } else {
        // Fallback or Initial Setup
        if (!localStorage.getItem('crm_admin_password')) {
          localStorage.setItem('crm_admin_password', btoa('admin123'));
        }
        if (!localStorage.getItem('crm_protected_actions')) {
          const defaultToggles = {
            deleteVehicle: true, deleteTrip: true, deleteBooking: true,
            cancelBooking: true, editVehicle: true, editTrip: false,
            editBooking: true, clearData: true
          };
          localStorage.setItem('crm_protected_actions', JSON.stringify(defaultToggles));
        }
        if (!localStorage.getItem('crm_session_duration')) {
          localStorage.setItem('crm_session_duration', '5');
        }
        // Save defaults to firestore
        firestore.saveSettingsToFirestore({
          adminPassword: localStorage.getItem('crm_admin_password'),
          protectedActions: JSON.parse(localStorage.getItem('crm_protected_actions')),
          sessionDuration: localStorage.getItem('crm_session_duration')
        });
      }
    };

    initSettings();

    // Listeners with error handling
    setIsSyncing(true);
    let unsubVehicles = () => {};
    let unsubTrips = () => {};
    let unsubBookings = () => {};
    let unsubSettings = () => {};

    try {
      unsubVehicles = firestore.listenToVehicles((data) => {
        setVehicles(data);
        localStorage.setItem('crm_vehicles', JSON.stringify(data));
        setLastSyncedAt(new Date());
      });
      
      unsubTrips = firestore.listenToTrips((data) => {
        setAllTrips(data);
        localStorage.setItem('crm_all_trips', JSON.stringify(data));
        setLastSyncedAt(new Date());
      });
      
      unsubBookings = firestore.listenToBookings((data) => {
        setBookings(data);
        localStorage.setItem('crm_bookings', JSON.stringify(data));
        setLastSyncedAt(new Date());
      });
      
      unsubSettings = firestore.listenToSettings((data) => {
        if (data) {
          localStorage.setItem('crm_admin_password', data.adminPassword);
          localStorage.setItem('crm_protected_actions', JSON.stringify(data.protectedActions));
          localStorage.setItem('crm_session_duration', data.sessionDuration.toString());
        }
        setLastSyncedAt(new Date());
      });
    } catch (err) {
      console.warn("Firestore listeners failed to initialize:", err);
      showToast("Sync unavailable: Check Firebase config", "warning");
    }

    setIsSyncing(false);

    // Online Status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubVehicles();
      unsubTrips();
      unsubBookings();
      unsubSettings();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

  const addVehicle = async (vehicle) => {
    try {
      setIsSyncing(true);
      const savedLocally = storage.saveVehicle(vehicle);
      if (savedLocally) {
        await firestore.saveVehicleToFirestore(savedLocally);
        showToast('Vehicle added & synced successfully');
      }
    } catch (err) {
      console.error(err);
      showToast('Offline: Saved locally but sync failed', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateVehicle = async (id, updatedData) => {
    try {
      setIsSyncing(true);
      const updatedLocally = storage.updateVehicle(id, updatedData);
      if (updatedLocally) {
        await firestore.updateVehicleInFirestore(id, updatedData);
        showToast('Vehicle updated & synced');
      }
    } catch (err) {
      console.error(err);
      showToast('Offline: Updated locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteVehicle = async (id) => {
    try {
      setIsSyncing(true);
      if (storage.deleteVehicle(id)) {
        await firestore.deleteVehicleFromFirestore(id);
        showToast('Vehicle deleted & synced', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Offline: Deleted locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const addTrip = async (trip) => {
    try {
      setIsSyncing(true);
      const savedLocally = storage.saveTrip(trip.vehicleId, trip);
      if (savedLocally) {
        await firestore.saveTripToFirestore(savedLocally);
        showToast('Trip recorded & synced');
      }
    } catch (err) {
      console.error(err);
      showToast('Offline: Recorded locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteTrip = async (id) => {
    try {
      setIsSyncing(true);
      const trip = allTrips.find(t => t.id === id);
      if (trip && storage.deleteTripById(trip.vehicleId, id)) {
        await firestore.deleteTripFromFirestore(id);
        showToast('Trip deleted & synced', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Offline: Deleted locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateTrip = async (id, updatedData) => {
    try {
      setIsSyncing(true);
      const trip = allTrips.find(t => t.id === id);
      if (trip) {
        const updatedLocally = storage.updateTrip(trip.vehicleId, id, updatedData);
        if (updatedLocally) {
          await firestore.updateTripInFirestore(id, updatedData);
          showToast('Trip updated & synced');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Offline: Updated locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const addBooking = async (bookingData) => {
    try {
      setIsSyncing(true);
      const savedLocally = storage.saveBooking(bookingData);
      if (savedLocally) {
        await firestore.saveBookingToFirestore(savedLocally);
        // Refresh vehicle status locally immediately if possible, though listener will take care
        setVehicles(storage.getAllVehicles());
        showToast(`Booking ${savedLocally.id} synced!`);
        return savedLocally;
      }
    } catch (err) {
      console.error(err);
      showToast('Offline: Booking saved locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
    return null;
  };

  const updateBooking = async (id, updatedFields) => {
    try {
      setIsSyncing(true);
      const updatedLocally = storage.updateBooking(id, updatedFields);
      if (updatedLocally) {
        await firestore.updateBookingInFirestore(id, updatedFields);
        showToast('Booking updated & synced');
        return updatedLocally;
      }
    } catch (err) {
      console.error(err);
      showToast('Offline: Updated locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
    return null;
  };

  const cancelBooking = async (id, cancellationData) => {
    try {
      setIsSyncing(true);
      const updatedLocally = storage.cancelBooking(id, cancellationData);
      if (updatedLocally) {
        await firestore.updateBookingInFirestore(id, updatedLocally);
        showToast('Booking cancelled & synced', 'error');
        return updatedLocally;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
    return null;
  };

  const deleteBooking = async (id) => {
    try {
      setIsSyncing(true);
      if (storage.deleteBooking(id)) {
        await firestore.deleteBookingFromFirestore(id);
        showToast('Booking deleted & synced', 'error');
        return true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  const updateSettings = async (settings) => {
    try {
      setIsSyncing(true);
      await firestore.saveSettingsToFirestore(settings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
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
        updateSettings,
        showToast,
        requirePassword,
        adminSession,
        endAdminSession,
        isSyncing,
        isOnline,
        lastSyncedAt
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
