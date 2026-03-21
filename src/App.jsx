import React, { useState, useEffect, useContext } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import * as emailApi from './utils/emailApi';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Bookings from './pages/Bookings';
import NewTrip from './pages/NewTrip';
import History from './pages/History';
import Settings from './pages/Settings';

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { bookings, vehicles } = useContext(AppContext);

  // Automated Email Triggers (Reminders & Overdue)
  useEffect(() => {
    if (bookings.length === 0 || vehicles.length === 0) return;

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
          console.log(`Sending reminder for ${b.id}`);
          await emailApi.notifyReminder(vehicle, b);
          localStorage.setItem(flag, 'true');
        }
      }

      // 2. Overdue: End date passed but still marked as Confirmed
      if (b.status === 'Confirmed' && b.bookingEndDate < todayStr) {
        const flag = `crm_sent_overdue_${b.id}`;
        if (!localStorage.getItem(flag)) {
          const overdueDays = Math.ceil((today.getTime() - new Date(b.bookingEndDate).getTime()) / (1000 * 3600 * 24));
          console.log(`Sending overdue alert for ${b.id} (${overdueDays} days)`);
          await emailApi.notifyOverdue(vehicle, overdueDays);
          localStorage.setItem(flag, 'true');
        }
      }
    });
  }, [bookings, vehicles]);

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col lg:pl-[250px] transition-spacing duration-300">
        <Header setSidebarOpen={setIsSidebarOpen} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f1f5f9] p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/newtrip" element={<NewTrip />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      <Toast />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout />
      </Router>
    </AppProvider>
  );
}

export default App;
