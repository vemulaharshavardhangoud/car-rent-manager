import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = ({ setSidebarOpen }) => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/vehicles': return 'Manage Vehicles';
      case '/newtrip': return 'Record a New Trip';
      case '/history': return 'Trip History';
      default: return 'CarRent Manager';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-md text-gray-600"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-semibold text-gray-800">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-sm text-gray-500 hidden md:block font-medium">{currentDate}</span>
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
