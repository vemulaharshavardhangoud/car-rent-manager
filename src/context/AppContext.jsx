import React, { createContext, useState, useEffect } from 'react';
import * as storage from '../utils/storage';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });

  const loadAllData = () => {
    setVehicles(storage.getAllVehicles());
    setAllTrips(storage.getAllTrips());
    setBookings(storage.getAllBookings());
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
