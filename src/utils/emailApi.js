import emailjs from '@emailjs/browser';

/**
 * Gets the configured EmailJS credentials from localStorage.
 */
const getEmailConfig = () => {
    return {
        serviceId: localStorage.getItem('crm_email_service_id') || '',
        templateIdBooking: localStorage.getItem('crm_email_template_id') || '',
        templateIdCancel: localStorage.getItem('crm_email_template_id') || '',
        publicKey: localStorage.getItem('crm_email_public_key') || ''
    };
};

/**
 * Sends a booking confirmation email.
 */
export async function notifyBookingConfirmation(vehicleData, bookingData) {
  const config = getEmailConfig();
  if (!config.serviceId || !config.templateIdBooking || !config.publicKey) {
      console.warn('EmailJS is not configured. Skipping email notification.');
      return { success: false, error: 'EmailJS keys missing' };
  }

  try {
    emailjs.init(config.publicKey);
    const templateParams = {
        to_name: bookingData.customerName,
        to_email: bookingData.customerEmail,
        vehicle_name: vehicleData.name,
        pickup_date: bookingData.bookingStartDate,
        return_date: bookingData.bookingEndDate,
        estimated_cost: bookingData.estimatedCost,
        booking_id: bookingData.id
    };

    const res = await emailjs.send(config.serviceId, config.templateIdBooking, templateParams);
    return { success: true, response: res };
  } catch (err) {
    console.error('EmailJS error (booking-confirmation):', err);
    // Determine if it was a quota limit error
    const errorMessage = err.text || err.message || '';
    if (errorMessage.toLowerCase().includes('limit') || errorMessage.toLowerCase().includes('quota') || err.status === 429) {
        return { success: false, error: 'EMAIL_LIMIT_REACHED' };
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Sends a cancellation email.
 */
export async function notifyCancellation(vehicleData, bookingData, cancellationData) {
  const config = getEmailConfig();
  if (!config.serviceId || !config.templateIdCancel || !config.publicKey) return { success: false, error: 'Keys missing' };

  try {
    emailjs.init(config.publicKey);
    const templateParams = {
        to_name: bookingData.customerName,
        to_email: bookingData.customerEmail,
        vehicle_name: vehicleData.name,
        reason: cancellationData.reason,
        refund_amount: cancellationData.refundAmount,
        booking_id: bookingData.id
    };

    const res = await emailjs.send(config.serviceId, config.templateIdCancel, templateParams);
    return { success: true, response: res };
  } catch (err) {
    console.error('EmailJS error (cancellation):', err);
    const errorMessage = err.text || err.message || '';
    if (errorMessage.toLowerCase().includes('limit') || errorMessage.toLowerCase().includes('quota') || err.status === 429) {
        return { success: false, error: 'EMAIL_LIMIT_REACHED' };
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Notifies the fleet manager about overdue vehicles or reminders.
 */
export async function notifyReminder(vehicleData, bookingData) {
  console.log('Reminder triggered for:', bookingData.id);
  // Implementation for owner-facing email goes here
  return { success: true };
}

export async function notifyOverdue(vehicleData, overdueDays) {
  console.log('Overdue alert for:', vehicleData.name, 'Days:', overdueDays);
  // Implementation for owner-facing email goes here
  return { success: true };
}
