/*
  HOW TO GET GMAIL APP PASSWORD:
  1. Go to your Google Account: https://myaccount.google.com
  2. Click on "Security" in the left menu
  3. Scroll down to "How you sign in to Google"
  4. Click on "2-Step Verification" and enable it if not already enabled
  5. After enabling 2-Step Verification go back to Security page
  6. Search for "App Passwords" in the search bar at top
  7. Click "App Passwords"
  8. In "Select App" choose "Mail"
  9. In "Select Device" choose "Other" and type "CarRent Manager"
  10. Click Generate
  11. Google will show you a 16 character password like: abcd efgh ijkl mnop
  12. Copy that password WITHOUT spaces: abcdefghijklmnop
  13. Paste it in server/.env as GMAIL_APP_PASSWORD=abcdefghijklmnop
  14. Never share this password with anyone
  15. Never push .env file to GitHub — add it to .gitignore
*/

const nodemailer = require('nodemailer');
require('dotenv').config();

const TO_EMAIL = 'harshavardhan277623@gmail.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.log('Gmail SMTP connection failed:', error.message);
  } else {
    console.log('✅ Gmail SMTP connected successfully');
  }
});

// ─── HTML HELPERS ───────────────────────────────────────────────────
const htmlBase = (headerTitle, bannerBg, bannerText, bannerSub, bodyContent) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <!-- HEADER -->
    <div style="background:#1e293b;padding:24px 30px;">
      <div style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">🚗 CarRent Manager</div>
      <div style="color:#94a3b8;font-size:13px;margin-top:4px;">${headerTitle}</div>
    </div>
    <!-- BANNER -->
    <div style="background:${bannerBg};padding:14px 30px;text-align:center;">
      <div style="color:#fff;font-size:18px;font-weight:bold;letter-spacing:1px;">${bannerText}</div>
      ${bannerSub ? `<div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">${bannerSub}</div>` : ''}
    </div>
    <!-- BODY -->
    <div style="padding:24px 30px;">
      ${bodyContent}
    </div>
    <!-- FOOTER -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 30px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">This is an automated notification from <strong>CarRent Manager App</strong></p>
      <p style="color:#cbd5e1;font-size:11px;margin:4px 0 0;">Do not reply to this email</p>
    </div>
  </div>
</body>
</html>`;

const vehicleBox = (v) => `
<div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:6px;padding:14px 18px;margin-bottom:20px;">
  <div style="font-size:13px;color:#1e40af;font-weight:bold;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Vehicle Details</div>
  <table style="width:100%;font-size:13px;color:#1e293b;border-collapse:collapse;">
    <tr><td style="padding:3px 0;color:#64748b;width:130px;">Vehicle Name</td><td style="font-weight:bold;">${v.name || 'N/A'}</td></tr>
    <tr><td style="padding:3px 0;color:#64748b;">Number Plate</td><td style="font-weight:bold;font-family:monospace;">${v.numberPlate || 'N/A'}</td></tr>
    <tr><td style="padding:3px 0;color:#64748b;">Vehicle Type</td><td>${v.type || 'N/A'}</td></tr>
    <tr><td style="padding:3px 0;color:#64748b;">Seating</td><td>${v.capacity ? v.capacity + ' Seats' : 'N/A'}</td></tr>
  </table>
</div>`;

const detailsTable = (rows) => `
<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:4px;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:600;width:45%;border-bottom:1px solid #e2e8f0;">Field</th>
      <th style="padding:8px 12px;text-align:left;color:#1e293b;font-weight:600;border-bottom:1px solid #e2e8f0;">Value</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
        <td style="padding:9px 12px;color:#64748b;border-bottom:1px solid #f1f5f9;">${r[0]}</td>
        <td style="padding:9px 12px;color:#1e293b;font-weight:500;border-bottom:1px solid #f1f5f9;">${r[1]}</td>
      </tr>`).join('')}
  </tbody>
</table>`;

const fmtDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const fmtDateTime = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

// ─── EMAIL FUNCTIONS ─────────────────────────────────────────────────

async function sendBookingConfirmationEmail(vehicleData, bookingData) {
  const body = vehicleBox(vehicleData) + detailsTable([
    ['Customer Name', bookingData.customerName || bookingData.bookedByName || 'N/A'],
    ['Phone Number', bookingData.customerPhone || bookingData.bookedByPhone || 'N/A'],
    ['Booking From', fmtDate(bookingData.startDate || bookingData.bookingStartDate)],
    ['Booking To', fmtDate(bookingData.endDate || bookingData.bookingEndDate)],
    ['Total Days', (bookingData.days || bookingData.bookingDays || 0) + ' Days'],
    ['Advance Paid', 'Rs. ' + (bookingData.advancePaid || 0)],
    ['Booking Notes', bookingData.notes || bookingData.bookingNotes || 'None'],
    ['Booked On', fmtDateTime(bookingData.createdAt || new Date().toISOString())]
  ]);

  await transporter.sendMail({
    from: `"CarRent Manager" <${process.env.GMAIL_USER}>`,
    to: TO_EMAIL,
    subject: `New Booking Confirmed — ${vehicleData.name} (${vehicleData.numberPlate})`,
    html: htmlBase('Booking Confirmation', '#22c55e', 'BOOKING CONFIRMED', null, body)
  });
}

async function sendCancellationEmail(vehicleData, bookingData, cancellationData) {
  const body = vehicleBox(vehicleData) + detailsTable([
    ['Customer Name', bookingData.customerName || bookingData.bookedByName || 'N/A'],
    ['Phone Number', bookingData.customerPhone || bookingData.bookedByPhone || 'N/A'],
    ['Was Booked From', fmtDate(bookingData.startDate || bookingData.bookingStartDate)],
    ['Was Booked To', fmtDate(bookingData.endDate || bookingData.bookingEndDate)],
    ['Cancelled On', fmtDate(cancellationData.cancelledOn || cancellationData.cancellationDate)],
    ['Reason', cancellationData.reason || cancellationData.cancellationReason || 'N/A'],
    ['Refund Amount', 'Rs. ' + (cancellationData.refundAmount || 0)],
    ['Notes', cancellationData.notes || cancellationData.cancellationNotes || 'None'],
    ['Cancelled At', fmtDateTime(cancellationData.cancelledAt || new Date().toISOString())]
  ]);

  await transporter.sendMail({
    from: `"CarRent Manager" <${process.env.GMAIL_USER}>`,
    to: TO_EMAIL,
    subject: `Booking Cancelled — ${vehicleData.name} (${vehicleData.numberPlate})`,
    html: htmlBase('Booking Cancellation', '#ef4444', 'BOOKING CANCELLED', null, body)
  });
}

async function sendBookingReminderEmail(vehicleData, bookingData) {
  const reminderNote = `<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:6px;padding:14px 18px;margin-top:20px;font-size:13px;color:#92400e;">
    ⚠️ <strong>Reminder:</strong> Please ensure the vehicle is cleaned, fuelled and ready for pickup tomorrow.
  </div>`;

  const body = vehicleBox(vehicleData) + detailsTable([
    ['Vehicle', `${vehicleData.name} (${vehicleData.numberPlate})`],
    ['Customer', bookingData.customerName || bookingData.bookedByName || 'N/A'],
    ['Phone', bookingData.customerPhone || bookingData.bookedByPhone || 'N/A'],
    ['Booking Date', fmtDate(bookingData.startDate || bookingData.bookingStartDate) + ' (Tomorrow)'],
    ['End Date', fmtDate(bookingData.endDate || bookingData.bookingEndDate)],
    ['Advance Paid', 'Rs. ' + (bookingData.advancePaid || 0)]
  ]) + reminderNote;

  await transporter.sendMail({
    from: `"CarRent Manager" <${process.env.GMAIL_USER}>`,
    to: TO_EMAIL,
    subject: `REMINDER: Booking Tomorrow — ${vehicleData.name} (${vehicleData.numberPlate})`,
    html: htmlBase('Booking Reminder', '#f59e0b', 'BOOKING REMINDER — TOMORROW', null, body)
  });
}

async function sendOverdueBookingEmail(vehicleData, bookingData, overdueDays) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const warningBox = `<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:6px;padding:14px 18px;margin-top:20px;font-size:13px;color:#991b1b;">
    🚨 <strong>Action Required:</strong> Please contact the customer and update the booking status immediately.
  </div>`;

  const body = vehicleBox(vehicleData) + detailsTable([
    ['Vehicle', `${vehicleData.name} (${vehicleData.numberPlate})`],
    ['Customer', bookingData.customerName || vehicleData.bookedByName || 'N/A'],
    ['Phone', bookingData.customerPhone || vehicleData.bookedByPhone || 'N/A'],
    ['Booking Start', fmtDate(bookingData.startDate || vehicleData.bookingStartDate)],
    ['Should End', fmtDate(bookingData.endDate || vehicleData.bookingEndDate)],
    ['Today', today],
    ['Overdue By', (overdueDays || 0) + ' Days']
  ]) + warningBox;

  await transporter.sendMail({
    from: `"CarRent Manager" <${process.env.GMAIL_USER}>`,
    to: TO_EMAIL,
    subject: `OVERDUE ALERT: Booking Expired — ${vehicleData.name} (${vehicleData.numberPlate})`,
    html: htmlBase('Overdue Alert', '#dc2626', 'BOOKING OVERDUE ALERT', 'This booking has passed its end date', body)
  });
}

module.exports = {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendBookingReminderEmail,
  sendOverdueBookingEmail
};
