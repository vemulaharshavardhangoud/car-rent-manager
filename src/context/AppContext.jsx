import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as storage from '../utils/storage';
import PasswordModal from '../components/PasswordModal';
import * as firestore from '../utils/firestoreService';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError] = useState(null);

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
    setDrivers(storage.getAllDrivers());
    setCustomers(storage.getAllCustomers());
    setExpenses(storage.getAllExpenses());
  };

  useEffect(() => {
    // Load local data immediately (instant UI on startup)
    loadAllData();

    // Initialize default settings in localStorage if not set
    if (!localStorage.getItem('crm_admin_password')) {
      localStorage.setItem('crm_admin_password', btoa('123456'));
    }
    if (!localStorage.getItem('crm_delete_password')) {
      localStorage.setItem('crm_delete_password', btoa('654321')); // Default delete PIN
    }
    if (!localStorage.getItem('crm_protected_actions')) {
      localStorage.setItem('crm_protected_actions', JSON.stringify({
        deleteVehicle: true, deleteTrip: true, deleteBooking: true,
        cancelBooking: true, editVehicle: true, editTrip: false,
        editBooking: true, clearData: true
      }));
    }
    if (!localStorage.getItem('crm_session_duration')) {
      localStorage.setItem('crm_session_duration', '5');
    }

    // Declare unsub refs at effect scope so cleanup can access them
    let unsubVehicles = () => {};
    let unsubTrips = () => {};
    let unsubBookings = () => {};
    let unsubSettings = () => {};
    let unsubExpenses = () => {};

    const startSync = async () => {
      setIsSyncing(true);
      setSyncError(null);

      // 1. Setup real-time Firestore listeners
      try {
        unsubVehicles = firestore.listenToVehicles((data) => {
          // Photos are already merged from localStorage inside listenToVehicles
          // (base64 photos are too large for Firestore, stored locally only)
          setVehicles(data);
          // Save back to localStorage (photos are already included from the merge)
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
            if (data.deletePassword) {
              localStorage.setItem('crm_delete_password', data.deletePassword);
            }
            localStorage.setItem('crm_protected_actions', JSON.stringify(data.protectedActions));
            localStorage.setItem('crm_session_duration', data.sessionDuration.toString());
          }
          setLastSyncedAt(new Date());
        });

        firestore.listenToDrivers((data) => {
          setDrivers(data);
          localStorage.setItem('crm_driver_list', JSON.stringify(data.map(d => d.id)));
          data.forEach(d => localStorage.setItem(`crm_driver_${d.id}`, JSON.stringify(d)));
          setLastSyncedAt(new Date());
        });

        firestore.listenToFuelLogs((data) => {
          setFuelLogs(data);
          // Group by vehicleId and save to local storage
          const grouped = data.reduce((acc, log) => {
            if (!acc[log.vehicleId]) acc[log.vehicleId] = [];
            acc[log.vehicleId].push(log);
            return acc;
          }, {});
          Object.entries(grouped).forEach(([vId, logs]) => {
            localStorage.setItem(`crm_fuel_logs_${vId}`, JSON.stringify(logs));
          });
          setLastSyncedAt(new Date());
        });

        firestore.listenToCustomers((data) => {
          setCustomers(data);
          localStorage.setItem('crm_customer_list', JSON.stringify(data.map(c => c.id)));
          data.forEach(c => localStorage.setItem(`crm_customer_${c.id}`, JSON.stringify(c)));
          setLastSyncedAt(new Date());
        });

        unsubExpenses = firestore.listenToExpenses((data) => {
          setExpenses(data);
          localStorage.setItem('crm_expense_list', JSON.stringify(data.map(e => e.id)));
          data.forEach(e => localStorage.setItem(`crm_expense_${e.id}`, JSON.stringify(e)));
          setLastSyncedAt(new Date());
        });
      } catch (err) {
        console.warn("Firestore listeners could not start:", err);
        setSyncError(err.message);
      }

      // 2. Pull initial settings with a 5-second timeout
      try {
        const settingsPromise = firestore.getSettingsFromFirestore();
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Sync Timeout')), 5000)
        );
        const remoteSettings = await Promise.race([settingsPromise, timeout]);
        if (remoteSettings) {
          localStorage.setItem('crm_admin_password', remoteSettings.adminPassword);
          if (remoteSettings.deletePassword) {
            localStorage.setItem('crm_delete_password', remoteSettings.deletePassword);
          }
          localStorage.setItem('crm_protected_actions', JSON.stringify(remoteSettings.protectedActions));
          localStorage.setItem('crm_session_duration', remoteSettings.sessionDuration.toString());
        }
      } catch (err) {
        console.warn("Initial settings fetch skipped:", err.message);
      } finally {
        setIsSyncing(false);
      }
    };

    startSync();

    // Online / Offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup: close all Firestore listeners
    return () => {
      unsubVehicles();
      unsubTrips();
      unsubBookings();
      unsubSettings();
      unsubExpenses();
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
      setPasswordModalConfig({ 
        isOpen: true, 
        actionInfo: {
          ...actionInfo,
          isDeleteAction: actionInfo.actionType.toLowerCase().includes('delete') || actionInfo.actionType === 'clearData'
        }, 
        resolve 
      });
    });
  }, [adminSession]);

  const handlePasswordSuccess = () => {
    const durationSetting = localStorage.getItem('crm_session_duration') || '30'; // default: 30 seconds
    let expiresAt = null;
    
    if (durationSetting === 'Until Page Refresh') {
      expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 365; // Indefinitely
    } else {
      // Duration is stored in seconds
      expiresAt = Date.now() + parseInt(durationSetting, 10) * 1000;
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

  const updateVehicleDocuments = async (id, documents) => {
    return await updateVehicle(id, documents);
  };

  const addMaintenanceLog = async (id, log) => {
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;
    const maintenance = vehicle.maintenance || [];
    const updatedMaintenance = [
      { ...log, id: "m_" + Date.now(), createdAt: new Date().toISOString() },
      ...maintenance
    ];
    return await updateVehicle(id, { maintenance: updatedMaintenance });
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

  const addDriver = async (driver) => {
    try {
      setIsSyncing(true);
      const savedLocally = storage.saveDriver(driver);
      if (savedLocally) {
        await firestore.saveDriverToFirestore(savedLocally);
        showToast('Driver added & synced!');
      }
    } catch (err) {
      showToast('Offline: Saved locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateDriver = async (id, updatedFields) => {
    try {
      setIsSyncing(true);
      const updated = storage.updateDriver(id, updatedFields);
      if (updated) {
        await firestore.updateDriverInFirestore(id, updatedFields);
        showToast('Driver updated & synced');
      }
    } catch (err) {
      showToast('Offline: Updated locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteDriver = async (id) => {
    try {
      setIsSyncing(true);
      if (storage.deleteDriver(id)) {
        await firestore.deleteDriverFromFirestore(id);
        showToast('Driver deleted', 'error');
      }
    } catch (err) {
      showToast('Offline: Deleted locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const addFuelLog = async (vehicleId, fuelData) => {
    try {
      setIsSyncing(true);
      const savedLocally = storage.saveFuelLog(vehicleId, fuelData);
      if (savedLocally) {
        await firestore.saveFuelLogToFirestore(savedLocally);
        showToast('Fuel expenditure logged!');
      }
    } catch (err) {
      showToast('Offline: Saved locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteFuelLog = async (vehicleId, id) => {
    try {
      setIsSyncing(true);
      if (storage.deleteFuelLog(vehicleId, id)) {
        await firestore.deleteFuelLogFromFirestore(id);
        showToast('Fuel log removed', 'error');
      }
    } catch (err) {
      showToast('Offline: Deleted locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const addCustomer = async (customer) => {
    try {
      setIsSyncing(true);
      const savedLocally = storage.saveCustomer(customer);
      if (savedLocally) {
        await firestore.saveCustomerToFirestore(savedLocally);
        showToast('Customer profile created!');
      }
    } catch (err) {
      showToast('Offline: Saved locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateCustomerData = async (id, updatedFields) => {
    try {
      setIsSyncing(true);
      const updated = storage.updateCustomer(id, updatedFields);
      if (updated) {
        await firestore.updateCustomerInFirestore(id, updatedFields);
        showToast('Customer updated');
      }
    } catch (err) {
      showToast('Offline: Updated locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteCustomerData = async (id) => {
    try {
      setIsSyncing(true);
      if (storage.deleteCustomer(id)) {
        await firestore.deleteCustomerFromFirestore(id);
        showToast('Customer deleted', 'error');
      }
    } catch (err) {
      showToast('Offline: Deleted locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const addExpense = async (expense) => {
    try {
      setIsSyncing(true);
      const savedLocally = storage.saveExpense(expense);
      if (savedLocally) {
        await firestore.saveExpenseToFirestore(savedLocally);
        showToast('Expense recorded & synced!');
      }
    } catch (err) {
      showToast('Offline: Saved locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateExpenseData = async (id, updatedFields) => {
    try {
      setIsSyncing(true);
      const updated = storage.updateExpense(id, updatedFields);
      if (updated) {
        await firestore.updateExpenseInFirestore(id, updatedFields);
        showToast('Expense updated & synced');
      }
    } catch (err) {
      showToast('Offline: Updated locally', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteExpenseData = async (id) => {
    try {
      setIsSyncing(true);
      if (storage.deleteExpense(id)) {
        await firestore.deleteExpenseFromFirestore(id);
        showToast('Expense deleted', 'error');
      }
    } catch (err) {
      showToast('Offline: Deleted locally', 'warning');
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
        lastSyncedAt,
        syncError,
        drivers,
        fuelLogs,
        addDriver,
        updateDriver,
        deleteDriver,
        addFuelLog,
        deleteFuelLog,
        updateVehicleDocuments,
        addMaintenanceLog,
        customers,
        addCustomer,
        updateCustomerData,
        deleteCustomerData,
        expenses,
        addExpense,
        updateExpenseData,
        deleteExpenseData
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
