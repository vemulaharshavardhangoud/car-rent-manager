/**
 * Utility functions for localStorage management in Car Rent Manager
 */

const PREFIX = 'crm_';
const VEHICLE_LIST_KEY = `${PREFIX}vehicle_list`;
const BOOKINGS_KEY = `${PREFIX}bookings`;
const NEXT_BOOKING_NUM_KEY = `${PREFIX}next_booking_number`;

/**
 * Saves a new vehicle to localStorage.
 * @param {Object} vehicleData - The data of the vehicle to save.
 * @returns {Object|null} The saved vehicle object including id and createdAt, or null on failure.
 */
export const saveVehicle = (vehicleData) => {
  try {
    const id = "v_" + Date.now();
    const newVehicle = {
      ...vehicleData,
      id,
      createdAt: new Date().toISOString()
    };
    
    // Save vehicle data
    localStorage.setItem(`${PREFIX}vehicle_${id}`, JSON.stringify(newVehicle));
    
    // Update vehicle list
    const list = JSON.parse(localStorage.getItem(VEHICLE_LIST_KEY) || '[]');
    list.push(id);
    localStorage.setItem(VEHICLE_LIST_KEY, JSON.stringify(list));
    
    return newVehicle;
  } catch (error) {
    console.error("Error saving vehicle:", error);
    return null;
  }
};

/**
 * Retrieves all vehicles from localStorage.
 * @returns {Array<Object>} Array of vehicle objects sorted by createdAt (newest first).
 */
export const getAllVehicles = () => {
  try {
    const list = JSON.parse(localStorage.getItem(VEHICLE_LIST_KEY) || '[]');
    const vehicles = list
      .map(id => {
        const data = localStorage.getItem(`${PREFIX}vehicle_${id}`);
        return data ? JSON.parse(data) : null;
      })
      .filter(v => v !== null);
      
    return vehicles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Error getting all vehicles:", error);
    return [];
  }
};

/**
 * Retrieves a single vehicle by its ID.
 * @param {string} id - The ID of the vehicle.
 * @returns {Object|null} The vehicle object or null if not found.
 */
export const getVehicleById = (id) => {
  try {
    const data = localStorage.getItem(`${PREFIX}vehicle_${id}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting vehicle by ID ${id}:`, error);
    return null;
  }
};

/**
 * Updates an existing vehicle.
 * @param {string} id - The ID of the vehicle to update.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|null} The updated vehicle object, or null on failure.
 */
export const updateVehicle = (id, updatedFields) => {
  try {
    const existing = getVehicleById(id);
    if (!existing) return null;
    
    const updatedVehicle = {
      ...existing,
      ...updatedFields,
      id, // Preserve original ID
      createdAt: existing.createdAt, // Preserve original createdAt
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`${PREFIX}vehicle_${id}`, JSON.stringify(updatedVehicle));
    return updatedVehicle;
  } catch (error) {
    console.error(`Error updating vehicle ${id}:`, error);
    return null;
  }
};

/**
 * Deletes a vehicle and all its associated trips.
 * @param {string} id - The ID of the vehicle to delete.
 * @returns {boolean} True on success, false on failure.
 */
export const deleteVehicle = (id) => {
  try {
    // Remove vehicle data
    localStorage.removeItem(`${PREFIX}vehicle_${id}`);
    
    // Remove from list
    const list = JSON.parse(localStorage.getItem(VEHICLE_LIST_KEY) || '[]');
    const updatedList = list.filter(vId => vId !== id);
    localStorage.setItem(VEHICLE_LIST_KEY, JSON.stringify(updatedList));
    
    // Remove associated trips
    localStorage.removeItem(`${PREFIX}trips_${id}`);
    
    return true;
  } catch (error) {
    console.error(`Error deleting vehicle ${id}:`, error);
    return false;
  }
};

/**
 * Saves a new trip for a specific vehicle.
 * @param {string} vehicleId - The ID of the vehicle.
 * @param {Object} tripData - The trip details.
 * @returns {Object|null} The saved trip object, or null on failure.
 */
export const saveTrip = (vehicleId, tripData) => {
  try {
    const id = "t_" + Date.now();
    const newTrip = {
      ...tripData,
      id,
      vehicleId,
      createdAt: new Date().toISOString()
    };
    
    const tripsKey = `${PREFIX}trips_${vehicleId}`;
    const trips = JSON.parse(localStorage.getItem(tripsKey) || '[]');
    trips.push(newTrip);
    
    localStorage.setItem(tripsKey, JSON.stringify(trips));
    return newTrip;
  } catch (error) {
    console.error(`Error saving trip for vehicle ${vehicleId}:`, error);
    return null;
  }
};

/**
 * Retrieves all trips for a specific vehicle.
 * @param {string} vehicleId - The ID of the vehicle.
 * @returns {Array<Object>} Array of trips sorted by date descending (newest first).
 */
export const getTripsForVehicle = (vehicleId) => {
  try {
    const tripsKey = `${PREFIX}trips_${vehicleId}`;
    const trips = JSON.parse(localStorage.getItem(tripsKey) || '[]');
    
    return trips.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error(`Error getting trips for vehicle ${vehicleId}:`, error);
    return [];
  }
};

/**
 * Retrieves all trips across all vehicles.
 * @returns {Array<Object>} Flat array of all trips sorted by createdAt descending.
 */
export const getAllTrips = () => {
  try {
    const vehicleList = JSON.parse(localStorage.getItem(VEHICLE_LIST_KEY) || '[]');
    let allTrips = [];
    
    for (const vId of vehicleList) {
      const vehicleTrips = getTripsForVehicle(vId);
      allTrips = allTrips.concat(vehicleTrips);
    }
    
    return allTrips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Error getting all trips:", error);
    return [];
  }
};

/**
 * Updates an existing trip.
 * @param {string} vehicleId - The ID of the vehicle the trip belongs to.
 * @param {string} tripId - The ID of the trip to update.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|null} The updated trip object, or null if not found.
 */
export const updateTrip = (vehicleId, tripId, updatedFields) => {
  try {
    const tripsKey = `${PREFIX}trips_${vehicleId}`;
    const trips = JSON.parse(localStorage.getItem(tripsKey) || '[]');
    
    const index = trips.findIndex(t => t.id === tripId);
    if (index === -1) return null;
    
    const updatedTrip = {
      ...trips[index],
      ...updatedFields,
      id: tripId, // Preserve original ID
      vehicleId, // Preserve original vehicleId
      updatedAt: new Date().toISOString()
    };
    
    trips[index] = updatedTrip;
    localStorage.setItem(tripsKey, JSON.stringify(trips));
    
    return updatedTrip;
  } catch (error) {
    console.error(`Error updating trip ${tripId}:`, error);
    return null;
  }
};

/**
 * Deletes a specific trip.
 * @param {string} vehicleId - The ID of the vehicle the trip belongs to.
 * @param {string} tripId - The ID of the trip to delete.
 * @returns {boolean} True on success, false on failure.
 */
export const deleteTripById = (vehicleId, tripId) => {
  try {
    const tripsKey = `${PREFIX}trips_${vehicleId}`;
    const trips = JSON.parse(localStorage.getItem(tripsKey) || '[]');
    
    const filteredTrips = trips.filter(t => t.id !== tripId);
    localStorage.setItem(tripsKey, JSON.stringify(filteredTrips));
    
    return true;
  } catch (error) {
    console.error(`Error deleting trip ${tripId}:`, error);
    return false;
  }
};

/**
 * Calculates statistics for trips.
 * @param {string|null} vehicleId - Optional vehicle ID. If null, calculates across all trips.
 * @returns {Object} Statistics including sums and averages.
 */
export const getTripStats = (vehicleId = null) => {
  try {
    const trips = vehicleId ? getTripsForVehicle(vehicleId) : getAllTrips();
    
    const stats = {
      totalTrips: trips.length,
      totalDistance: 0,
      totalFuelCost: 0,
      totalTollTax: 0,
      totalBorderTax: 0,
      totalRevenue: 0,
      averageDistance: 0,
      averageRevenue: 0
    };
    
    if (trips.length === 0) return stats;
    
    trips.forEach(t => {
      stats.totalDistance += (Number(t.distance) || 0);
      stats.totalFuelCost += (Number(t.fuelCost) || 0);
      stats.totalTollTax += (Number(t.tollTax) || 0);
      stats.totalBorderTax += (Number(t.borderTax) || 0);
      stats.totalRevenue += (Number(t.grandTotal) || 0);
    });
    
    stats.averageDistance = stats.totalDistance / stats.totalTrips;
    stats.averageRevenue = stats.totalRevenue / stats.totalTrips;
    
    return stats;
  } catch (error) {
    console.error("Error calculating trip stats:", error);
    return {
      totalTrips: 0, totalDistance: 0, totalFuelCost: 0, totalTollTax: 0,
      totalBorderTax: 0, totalRevenue: 0, averageDistance: 0, averageRevenue: 0
    };
  }
};

/**
 * Clears all localStorage data related to the application.
 * @returns {boolean} True on success, false on failure.
 */
export const clearAllData = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error("Error clearing all data:", error);
    return false;
  }
};

/**
 * Triggers a browser download of trips data as a CSV file.
 * @param {Array<Object>} trips - Array of trip objects to export.
 * @returns {boolean} True on success, false on failure.
 */
export const exportTripsAsCSV = (trips) => {
  try {
    if (!trips || trips.length === 0) return false;
    
    const headers = [
      'Date', 'Vehicle', 'From', 'To', 'StartKM', 'EndKM', 
      'Distance', 'Petrol', 'PricePerLitre', 'FuelCost', 
      'TollTax', 'BorderTax', 'DriverAllowance', 'OtherCharges', 'GrandTotal'
    ];
    
    const rows = trips.map(t => [
      t.date || '',
      t.vehicleName || '',
      t.fromLocation || '',
      t.toLocation || '',
      t.startKm || '',
      t.endKm || '',
      t.distance || '',
      t.litresFilled || '',
      t.pricePerLitre || '',
      t.fuelCost || '',
      t.tollTax || '',
      t.borderTax || '',
      t.driverAllowance || '',
      t.otherCharges || '',
      t.grandTotal || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `trips_export_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Error exporting trips as CSV:", error);
    return false;
  }
};

/**
 * Retrieves the top traveled routes.
 * @param {number} limit - The maximum number of routes to return.
 * @returns {Array<Object>} Array of objects like { route: string, count: number }
 */
export const getTopRoutes = (limit = 5) => {
  try {
    const allTrips = getAllTrips();
    const routeCounts = {};
    
    allTrips.forEach(t => {
      const from = String(t.fromLocation || 'Unknown').trim();
      const to = String(t.toLocation || 'Unknown').trim();
      if (from && to && from !== 'Unknown' && to !== 'Unknown') {
        const route = `${from} → ${to}`;
        routeCounts[route] = (routeCounts[route] || 0) + 1;
      }
    });
    
    const sortedResult = Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
      
    return sortedResult;
  } catch (error) {
    console.error("Error getting top routes:", error);
    return [];
  }
};

/**
 * Calculates statistics for a specific month.
 * @param {string|number} year - The year (e.g., 2026).
 * @param {string|number} month - The month (1-12 or '03').
 * @returns {Object|null} Statistics object or null on failure.
 */
export const getMonthlyStats = (year, month) => {
  try {
    const allTrips = getAllTrips();
    
    // Ensure month is two digits
    const formattedMonth = String(month).padStart(2, '0');
    const searchPrefix = `${year}-${formattedMonth}`;
    
    const monthTrips = allTrips.filter(t => t.date && t.date.startsWith(searchPrefix));
    
    const stats = {
      totalTrips: monthTrips.length,
      totalDistance: 0,
      totalFuelCost: 0,
      totalTollTax: 0,
      totalBorderTax: 0,
      totalRevenue: 0,
      averageDistance: 0,
      averageRevenue: 0,
      monthLabel: `${year}-${formattedMonth}`
    };
    
    if (monthTrips.length === 0) return stats;
    
    monthTrips.forEach(t => {
      stats.totalDistance += (Number(t.distance) || 0);
      stats.totalFuelCost += (Number(t.fuelCost) || 0);
      stats.totalTollTax += (Number(t.tollTax) || 0);
      stats.totalBorderTax += (Number(t.borderTax) || 0);
      stats.totalRevenue += (Number(t.grandTotal) || 0);
    });
    
    stats.averageDistance = stats.totalDistance / stats.totalTrips;
    stats.averageRevenue = stats.totalRevenue / stats.totalTrips;
    
    return stats;
  } catch (error) {
    console.error(`Error calculating monthly stats for ${year}-${month}:`, error);
    return null;
  }
};

/**
 * Saves a new booking to localStorage and updates vehicle status.
 * @param {Object} bookingData - The booking details.
 * @returns {Object|null} The saved booking object, or null on failure.
 */
export const saveBooking = (bookingData) => {
  try {
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    
    // Auto-generate booking number and ID
    const nextNum = Number(localStorage.getItem(NEXT_BOOKING_NUM_KEY) || '1');
    const bookingId = `BK-${String(nextNum).padStart(3, '0')}`;
    
    const newBooking = {
      ...bookingData,
      id: bookingId,
      bookingNumber: nextNum,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    localStorage.setItem(NEXT_BOOKING_NUM_KEY, String(nextNum + 1));
    
    // Update vehicle status to 'Booked'
    if (bookingData.vehicleId) {
      updateVehicle(bookingData.vehicleId, { bookingStatus: 'Booked' });
    }
    
    return newBooking;
  } catch (error) {
    console.error("Error saving booking:", error);
    return null;
  }
};

/**
 * Retrieves all bookings from localStorage.
 * @returns {Array<Object>} Array of booking objects sorted by createdAt descending.
 */
export const getAllBookings = () => {
  try {
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Error getting all bookings:", error);
    return [];
  }
};

/**
 * Retrieves a single booking by its ID.
 * @param {string} bookingId - The ID of the booking (e.g., BK-001).
 * @returns {Object|null} The booking object or null if not found.
 */
export const getBookingById = (bookingId) => {
  try {
    const bookings = getAllBookings();
    return bookings.find(b => b.id === bookingId) || null;
  } catch (error) {
    console.error(`Error getting booking ${bookingId}:`, error);
    return null;
  }
};

/**
 * Updates an existing booking.
 * @param {string} bookingId - The ID of the booking to update.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|null} The updated booking object, or null if not found.
 */
export const updateBooking = (bookingId, updatedFields) => {
  try {
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return null;
    
    // If vehicle changed, update both old and new vehicle statuses
    const oldBooking = bookings[index];
    if (updatedFields.vehicleId && updatedFields.vehicleId !== oldBooking.vehicleId) {
      updateVehicle(oldBooking.vehicleId, { bookingStatus: 'Available' });
      updateVehicle(updatedFields.vehicleId, { bookingStatus: 'Booked' });
    }
    
    const updatedBooking = {
      ...oldBooking,
      ...updatedFields,
      id: bookingId,
      updatedAt: new Date().toISOString()
    };
    
    bookings[index] = updatedBooking;
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    return updatedBooking;
  } catch (error) {
    console.error(`Error updating booking ${bookingId}:`, error);
    return null;
  }
};

/**
 * Cancels a booking and updates vehicle status to 'Available'.
 * @param {string} bookingId - The ID of the booking.
 * @param {Object} cancellationData - Details about the cancellation.
 * @returns {Object|null} The updated booking object, or null on failure.
 */
export const cancelBooking = (bookingId, cancellationData) => {
  try {
    const booking = getBookingById(bookingId);
    if (!booking) return null;
    
    const updated = updateBooking(bookingId, {
      status: 'Cancelled',
      cancellation: {
        ...cancellationData,
        cancelledAt: new Date().toISOString()
      }
    });
    
    if (updated && updated.vehicleId) {
      updateVehicle(updated.vehicleId, { bookingStatus: 'Available' });
    }
    
    return updated;
  } catch (error) {
    console.error(`Error cancelling booking ${bookingId}:`, error);
    return null;
  }
};

/**
 * Deletes a booking from localStorage.
 * @param {string} bookingId - The ID of the booking.
 * @returns {boolean} True on success, false on failure.
 */
export const deleteBooking = (bookingId) => {
  try {
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    const booking = bookings.find(b => b.id === bookingId);
    
    const updatedBookings = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updatedBookings));
    
    // If the booking was active, reset vehicle status
    if (booking && (booking.status === 'Confirmed' || booking.status === 'Pending')) {
      updateVehicle(booking.vehicleId, { bookingStatus: 'Available' });
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting booking ${bookingId}:`, error);
    return false;
  }
};

/**
 * Retrieves all bookings for a specific vehicle.
 * @param {string} vehicleId - The ID of the vehicle.
 * @returns {Array<Object>} Sorted array of bookings for the vehicle.
 */
export const getBookingsForVehicle = (vehicleId) => {
  try {
    const bookings = getAllBookings();
    return bookings.filter(b => b.vehicleId === vehicleId);
  } catch (error) {
    console.error(`Error getting bookings for vehicle ${vehicleId}:`, error);
    return [];
  }
};

/**
 * Exports bookings as a CSV file.
 * @param {Array<Object>} bookings - The bookings to export.
 * @returns {boolean} True on success.
 */
export const exportBookingsAsCSV = (bookings) => {
  try {
    if (!bookings || bookings.length === 0) return false;
    
    const headers = [
      'Booking ID', 'Status', 'Vehicle', 'Plate', 'Customer', 'Phone',
      'Start Date', 'End Date', 'Days', 'Pickup Location', 'Drop Location',
      'Cost', 'Advance', 'Payment Mode', 'Created At'
    ];
    
    const rows = bookings.map(b => [
      b.id, b.status, b.vehicleName, b.numberPlate, b.customerName, b.customerPhone,
      b.bookingStartDate, b.bookingEndDate, b.bookingDays, b.pickupLocation, b.dropLocation,
      b.estimatedCost, b.advancePaid, b.paymentMode, b.createdAt
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + rows.map(r => r.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `bookings_export_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Error exporting bookings:", error);
    return false;
  }
};
