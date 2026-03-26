import React, { useState, useEffect, useContext } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import * as emailApi from './utils/emailApi';
import * as firestore from './utils/firestoreService';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Bookings from './pages/Bookings';
import NewTrip from './pages/NewTrip';
import Drivers from './pages/Drivers';
import History from './pages/History';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Login from './pages/Login';
import BottomNav from './components/BottomNav';

import CustomerDashboard from './pages/CustomerDashboard';
import VehicleAvailability from './pages/VehicleAvailability';
import NewBooking from './pages/NewBooking';
import MyBookings from './pages/MyBookings';
import { useAuth } from './context/AuthContext';

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { bookings, vehicles } = useContext(AppContext);
  const { isAdmin, isCustomer } = useAuth();

  // Automated Email Triggers (Reminders & Overdue)
  useEffect(() => {
    if (!isAdmin || bookings.length === 0 || vehicles.length === 0) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    bookings.forEach(async (b) => {
      const vehicle = vehicles.find(v => v.id === b.vehicleId);
      if (!vehicle) return;

      // 1. Reminder: Starts Tomorrow
      if (b.status === 'Confirmed' && b.bookingStartDate === tomorrowStr) {
        const flag = `crm_sent_reminder_${b.id}`;
        if (!localStorage.getItem(flag)) {
          const alreadySent = await firestore.isNotificationSent(b.id, 'reminder');
          if (!alreadySent) {
            console.log(`Sending reminder for ${b.id}`);
            const success = await emailApi.notifyReminder(vehicle, b);
            if (success) {
              await firestore.saveSentNotification({ bookingId: b.id, type: 'reminder' });
              localStorage.setItem(flag, 'true');
            }
          } else {
            localStorage.setItem(flag, 'true');
          }
        }
      }

      // 2. Overdue: End date passed but still marked as Confirmed
      if (b.status === 'Confirmed' && b.bookingEndDate < todayStr) {
        const flag = `crm_sent_overdue_${b.id}`;
        if (!localStorage.getItem(flag)) {
          const alreadySent = await firestore.isNotificationSent(b.id, 'overdue');
          if (!alreadySent) {
            const overdueDays = Math.ceil((today.getTime() - new Date(b.bookingEndDate).getTime()) / (1000 * 3600 * 24));
            console.log(`Sending overdue alert for ${b.id} (${overdueDays} days)`);
            const success = await emailApi.notifyOverdue(vehicle, overdueDays);
            if (success) {
              await firestore.saveSentNotification({ bookingId: b.id, type: 'overdue' });
              localStorage.setItem(flag, 'true');
            }
          } else {
            localStorage.setItem(flag, 'true');
          }
        }
      }
    });
  }, [bookings, vehicles, isAdmin]);

  return (
    <div className="flex h-screen bg-main-bg font-sans transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col lg:pl-[250px] transition-spacing duration-300">
        <Header setSidebarOpen={setIsSidebarOpen} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-main-bg p-4 lg:p-8 pb-32 lg:pb-8 max-w-screen-overflow transition-colors duration-300">

          <Routes>
            {/* Common Entry */}
            <Route path="/" element={isAdmin ? <Dashboard /> : <CustomerDashboard />} />
            
            {/* Admin Routes */}
            {isAdmin && (
              <>
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/newtrip" element={<NewTrip />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
              </>
            )}

            {/* Customer Routes */}
            {isCustomer && (
              <>
                <Route path="/vehicles" element={<VehicleAvailability />} />
                <Route path="/new-booking" element={<NewBooking />} />
                <Route path="/my-bookings" element={<MyBookings />} />
              </>
            )}
          </Routes>
        </main>
      </div>

      <BottomNav setSidebarOpen={setIsSidebarOpen} />
      <Toast />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
