import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CarFront, PlusCircle, History, Settings, X, Car } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vehicles', label: 'Vehicles', icon: CarFront },
    { path: '/newtrip', label: 'New Trip', icon: PlusCircle },
    { path: '/history', label: 'History', icon: History },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[250px] bg-[#1e293b] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-1.5 rounded-lg">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">CarRent Manager</span>
          </div>
          <button 
            className="lg:hidden p-1 hover:bg-white/10 rounded-md"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-500 text-white font-medium shadow-md' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between text-gray-400">
          <span className="text-sm">v1.0</span>
          <button className="p-2 hover:bg-white/10 hover:text-white rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
