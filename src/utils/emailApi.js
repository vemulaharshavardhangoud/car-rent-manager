const BASE_URL = 'http://localhost:5000/api/email';

/**
 * Sends a booking confirmation email via the backend API.
 * @param {Object} vehicleData
 * @param {Object} bookingData
 * @returns {{ success: boolean }}
 */
export async function notifyBookingConfirmation(vehicleData, bookingData) {
  try {
    const res = await fetch(`${BASE_URL}/booking-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleData, bookingData })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Email API error (booking-confirmation):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a cancellation email via the backend API.
 * @param {Object} vehicleData
 * @param {Object} bookingData
 * @param {Object} cancellationData
 * @returns {{ success: boolean }}
 */
export async function notifyCancellation(vehicleData, bookingData, cancellationData) {
  try {
    const res = await fetch(`${BASE_URL}/cancellation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleData, bookingData, cancellationData })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Email API error (cancellation):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a booking reminder email via the backend API.
 * @param {Object} vehicleData
 * @param {Object} bookingData
 * @returns {{ success: boolean }}
 */
export async function notifyReminder(vehicleData, bookingData) {
  try {
    const res = await fetch(`${BASE_URL}/reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleData, bookingData })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Email API error (reminder):', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends an overdue booking alert email via the backend API.
 * @param {Object} vehicleData
 * @param {number} overdueDays
 * @returns {{ success: boolean }}
 */
export async function notifyOverdue(vehicleData, overdueDays) {
  try {
    const res = await fetch(`${BASE_URL}/overdue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleData, overdueDays })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Email API error (overdue):', err);
    return { success: false, error: err.message };
  }
}
