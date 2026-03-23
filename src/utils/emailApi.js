import emailjs from '@emailjs/browser';

// CONFIGURATION: Replace these with your EmailJS credentials
// Get them from: https://dashboard.emailjs.com/
const SERVICE_ID = 'service_carrent';
const TEMPLATE_ID_BOOKING = 'template_booking';
const TEMPLATE_ID_CANCEL = 'template_cancel';
const PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

/**
 * Initialize EmailJS
 */
export const initEmail = () => {
    emailjs.init(PUBLIC_KEY);
};

/**
 * Sends a booking confirmation email.
 */
export async function notifyBookingConfirmation(vehicleData, bookingData) {
  try {
    const templateParams = {
        to_name: bookingData.customerName,
        to_email: bookingData.customerEmail,
        vehicle_name: vehicleData.name,
        pickup_date: bookingData.bookingStartDate,
        return_date: bookingData.bookingEndDate,
        estimated_cost: bookingData.estimatedCost,
        booking_id: bookingData.id
    };

    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID_BOOKING, templateParams);
    return { success: true, response: res };
  } catch (err) {
    console.error('EmailJS error (booking-confirmation):', err);
    return { success: false, error: err.text || err.message };
  }
}

/**
 * Sends a cancellation email.
 */
export async function notifyCancellation(vehicleData, bookingData, cancellationData) {
  try {
    const templateParams = {
        to_name: bookingData.customerName,
        to_email: bookingData.customerEmail,
        vehicle_name: vehicleData.name,
        reason: cancellationData.reason,
        refund_amount: cancellationData.refundAmount,
        booking_id: bookingData.id
    };

    const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID_CANCEL, templateParams);
    return { success: true, response: res };
  } catch (err) {
    console.error('EmailJS error (cancellation):', err);
    return { success: false, error: err.text || err.message };
  }
}

/**
 * Notifies the fleet manager about overdue vehicles or reminders.
 */
export async function notifyReminder(vehicleData, bookingData) {
  // Can be implemented similarly with a manager-facing template
  console.log('Reminder triggered for:', bookingData.id);
  return { success: true };
}

export async function notifyOverdue(vehicleData, overdueDays) {
  console.log('Overdue alert for:', vehicleData.name, 'Days:', overdueDays);
  return { success: true };
}
