import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import NewTrip from './pages/NewTrip';
import History from './pages/History';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AppProvider>
      <Router>
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
      </Router>
    </AppProvider>
  );
}

export default App;
