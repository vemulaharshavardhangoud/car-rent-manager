import emailjs from '@emailjs/browser';

/*
  EMAILJS SETUP STEPS:
  1. Go to https://www.emailjs.com and create a free account
  2. Click "Add New Service" and connect your Gmail account
  3. Copy your Service ID (looks like: service_xxxxxxx)
  4. Go to Email Templates and click "Create New Template"
  5. In the template set:
     - To Email: harshavardhan277623@gmail.com
     - Subject: {{subject}}
     - Body: {{message}}
  6. Copy your Template ID (looks like: template_xxxxxxx)
  7. Go to Account > API Keys and copy your Public Key
  8. Replace these values in emailService.js:
     const SERVICE_ID = "service_xxxxxxx"
     const TEMPLATE_ID = "template_xxxxxxx"
     const PUBLIC_KEY = "your_public_key"
*/

const SERVICE_ID = "service_xxxxxxx";
const TEMPLATE_ID = "template_xxxxxxx";
const PUBLIC_KEY = "your_public_key";

const TO_EMAIL = "harshavardhan277623@gmail.com";
const FROM_NAME = "CarRent Manager App";

export const sendEmail = async (subject, message) => {
  try {
    if (SERVICE_ID === "service_xxxxxxx") return false; // Ignore if not configured
    
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: TO_EMAIL,
        from_name: FROM_NAME,
        subject: subject,
        message: message
      },
      PUBLIC_KEY
    );
    return true;
  } catch (err) {
    console.error("EmailJS Error:", err);
    throw err;
  }
};

export const sendBookingConfirmationEmail = async (vehicleData, bookingData) => {
  const subject = `New Booking Confirmed \u2014 ${vehicleData.name} (${vehicleData.numberPlate})`;
  
  const formattedDate = new Date(bookingData.createdAt || Date.now()).toLocaleString('en-GB', { 
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
  });

  const message = `--------------------------------
NEW BOOKING CONFIRMED
--------------------------------
Vehicle     : ${vehicleData.name} (${vehicleData.numberPlate})
Type        : ${vehicleData.type}

Customer    : ${bookingData.customerName || 'N/A'}
Phone       : ${bookingData.customerPhone || 'N/A'}

Booking From: ${new Date(bookingData.startDate).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'})}
Booking To  : ${new Date(bookingData.endDate).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'})}
Total Days  : ${bookingData.days} Days

Advance Paid: \u20B9${bookingData.advancePaid || 0}
Notes       : ${bookingData.notes || 'None'}

Booked On   : ${formattedDate}
--------------------------------
This is an automated notification
from CarRent Manager App.`;

  return await sendEmail(subject, message);
};

export const sendCancellationEmail = async (vehicleData, bookingData, cancellationData) => {
  const subject = `Booking Cancelled \u2014 ${vehicleData.name} (${vehicleData.numberPlate})`;
  
  const formattedCancelOn = new Date(cancellationData.cancelledOn).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
  const formattedCancelAt = new Date(cancellationData.cancelledAt || Date.now()).toLocaleString('en-GB', { 
    day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
  });
  
  const fromDate = new Date(bookingData.startDate).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
  const toDate = new Date(bookingData.endDate).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});

  const message = `--------------------------------
BOOKING CANCELLED
--------------------------------
Vehicle     : ${vehicleData.name} (${vehicleData.numberPlate})
Type        : ${vehicleData.type}

Customer    : ${bookingData.customerName || 'N/A'}
Phone       : ${bookingData.customerPhone || 'N/A'}

Was Booked  : ${fromDate} to ${toDate}
Cancelled On: ${formattedCancelOn}

Reason      : ${cancellationData.reason}
Notes       : ${cancellationData.notes || 'None'}
Refund      : \u20B9${cancellationData.refundAmount || 0}

Cancelled At: ${formattedCancelAt}
--------------------------------
This is an automated notification
from CarRent Manager App.`;

  return await sendEmail(subject, message);
};

export const sendBookingReminderEmail = async (vehicleData, bookingData) => {
  const subject = `Reminder: Booking Tomorrow \u2014 ${vehicleData.name}`;

  const fromDate = new Date(bookingData.startDate).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
  const toDate = new Date(bookingData.endDate).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});

  const message = `--------------------------------
BOOKING REMINDER
--------------------------------
This is a reminder that the following
vehicle has a booking tomorrow.

Vehicle     : ${vehicleData.name} (${vehicleData.numberPlate})
Customer    : ${bookingData.customerName || 'N/A'}
Phone       : ${bookingData.customerPhone || 'N/A'}

Booking Date: ${fromDate}
End Date    : ${toDate}

Please ensure the vehicle is ready.
--------------------------------
CarRent Manager App`;

  return await sendEmail(subject, message);
};

export const sendOverdueBookingEmail = async (vehicleData, bookingData, overdueDays) => {
  const subject = `OVERDUE: Booking Expired \u2014 ${vehicleData.name} (${vehicleData.numberPlate})`;

  const fromDate = new Date(bookingData.startDate).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
  const toDate = new Date(bookingData.endDate).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
  const today = new Date().toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});

  const message = `--------------------------------
BOOKING OVERDUE ALERT
--------------------------------
The following vehicle booking has
passed its end date but is still
marked as Booked.

Vehicle     : ${vehicleData.name} (${vehicleData.numberPlate})
Customer    : ${bookingData.customerName || 'N/A'}
Phone       : ${bookingData.customerPhone || 'N/A'}

Booking Was : ${fromDate}
Should End  : ${toDate}
Today       : ${today}
Overdue By  : ${overdueDays} Days

Please update the booking status.
--------------------------------
CarRent Manager App`;

  return await sendEmail(subject, message);
};
