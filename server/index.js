const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendBookingReminderEmail,
  sendOverdueBookingEmail
} = require('./emailService');

const app = express();
app.use(cors());
app.use(express.json());

// ─── HEALTH CHECK ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CarRent Manager email server running' });
});

// ─── BOOKING CONFIRMATION ─────────────────────────────────────────────
app.post('/api/email/booking-confirmation', async (req, res) => {
  try {
    const { vehicleData, bookingData } = req.body;
    if (!vehicleData || !bookingData) {
      return res.status(400).json({ success: false, error: 'Missing vehicleData or bookingData' });
    }
    await sendBookingConfirmationEmail(vehicleData, bookingData);
    console.log(`✅ Booking confirmation email sent for ${vehicleData.name}`);
    res.json({ success: true, message: 'Booking confirmation email sent' });
  } catch (err) {
    console.error('❌ Booking confirmation email error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── CANCELLATION ────────────────────────────────────────────────────
app.post('/api/email/cancellation', async (req, res) => {
  try {
    const { vehicleData, bookingData, cancellationData } = req.body;
    if (!vehicleData || !bookingData || !cancellationData) {
      return res.status(400).json({ success: false, error: 'Missing required data' });
    }
    await sendCancellationEmail(vehicleData, bookingData, cancellationData);
    console.log(`✅ Cancellation email sent for ${vehicleData.name}`);
    res.json({ success: true, message: 'Cancellation email sent' });
  } catch (err) {
    console.error('❌ Cancellation email error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── REMINDER ────────────────────────────────────────────────────────
app.post('/api/email/reminder', async (req, res) => {
  try {
    const { vehicleData, bookingData } = req.body;
    if (!vehicleData || !bookingData) {
      return res.status(400).json({ success: false, error: 'Missing vehicleData or bookingData' });
    }
    await sendBookingReminderEmail(vehicleData, bookingData);
    console.log(`✅ Reminder email sent for ${vehicleData.name}`);
    res.json({ success: true, message: 'Reminder email sent' });
  } catch (err) {
    console.error('❌ Reminder email error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── OVERDUE ALERT ────────────────────────────────────────────────────
app.post('/api/email/overdue', async (req, res) => {
  try {
    const { vehicleData, overdueDays } = req.body;
    if (!vehicleData) {
      return res.status(400).json({ success: false, error: 'Missing vehicleData' });
    }
    await sendOverdueBookingEmail(vehicleData, vehicleData, overdueDays || 0);
    console.log(`✅ Overdue alert email sent for ${vehicleData.name}`);
    res.json({ success: true, message: 'Overdue alert email sent' });
  } catch (err) {
    console.error('❌ Overdue alert email error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── START ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚗 CarRent Manager email server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
