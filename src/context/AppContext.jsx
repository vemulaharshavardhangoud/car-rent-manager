import React, { createContext, useState, useEffect } from 'react';
import * as storage from '../utils/storage';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });

  const loadAllData = () => {
    setVehicles(storage.getAllVehicles());
    setAllTrips(storage.getAllTrips());
  };

  useEffect(() => {
    loadAllData();
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

  return (
    <AppContext.Provider
      value={{
        vehicles,
        allTrips,
        toast,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addTrip,
        deleteTrip,
        updateTrip,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
