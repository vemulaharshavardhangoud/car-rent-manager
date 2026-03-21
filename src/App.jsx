import React, { useState, useEffect, useContext } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { sendBookingReminderEmail, sendOverdueBookingEmail } from './utils/emailService';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import NewTrip from './pages/NewTrip';
import History from './pages/History';

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { vehicles } = useContext(AppContext);

  useEffect(() => {
    // Run automated triggers when vehicles are loaded
    if (!vehicles || vehicles.length === 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    vehicles.forEach(v => {
      if (v.bookingStatus === 'Booked' || v.bookingStatus === 'On Trip') {
        const bd = {
          startDate: v.bookingStartDate, 
          endDate: v.bookingEndDate, 
          customerName: v.bookedByName, 
          customerPhone: v.bookedByPhone
        };
        
        // Reminder
        if (v.bookingStartDate === tomorrow) {
          const key = `crm_sent_reminders_${v.id}_${v.bookingStartDate}_reminder`;
          if (!localStorage.getItem(key)) {
            sendBookingReminderEmail(v, bd).then(() => {
              localStorage.setItem(key, 'true');
            }).catch(()=>{});
          }
        }

        // Overdue check
        if (v.bookingEndDate < today && v.bookingStatus === 'Booked') {
          const endD = new Date(v.bookingEndDate);
          const nowD = new Date();
          const overdueDays = Math.ceil((nowD - endD) / (1000 * 60 * 60 * 24));
          
          const key = `crm_sent_reminders_${v.id}_${v.bookingEndDate}_overdue`;
          if (!localStorage.getItem(key)) {
            sendOverdueBookingEmail(v, bd, overdueDays).then(() => {
              localStorage.setItem(key, 'true');
            }).catch(()=>{});
          }
        }
      }
    });
  }, [vehicles]);

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col lg:pl-[250px] transition-spacing duration-300">
        <Header setSidebarOpen={setIsSidebarOpen} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f1f5f9] p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/newtrip" element={<NewTrip />} />
            <Route path="/history" element={<History />} />
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
