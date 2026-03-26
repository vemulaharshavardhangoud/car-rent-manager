import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Car, History, Menu, DollarSign, CalendarDays, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNav = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAdmin, isCustomer, logout } = useAuth();

  const navItems = isAdmin ? [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Car, label: 'Vehicles', path: '/vehicles' },
    { icon: DollarSign, label: 'Finance', path: '/expenses' },
    { icon: LogOut, label: 'Logout', path: 'LOGOUT_ACTION' },
    { icon: Menu, label: 'Menu', path: 'MENU_TOGGLE' },
  ] : [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Car, label: 'Availability', path: '/vehicles' },
    { icon: LogOut, label: 'Logout', path: 'LOGOUT_ACTION' },
    { icon: Menu, label: 'Menu', path: 'MENU_TOGGLE' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 flex items-center justify-around px-2 py-3 z-50 safe-area-bottom pb-6">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const isMenu = item.path === 'MENU_TOGGLE';

        return (
          <button
            key={item.label}
            onClick={() => {
              if (isMenu) setSidebarOpen(true);
              else if (item.path === 'LOGOUT_ACTION') logout();
              else navigate(item.path);
            }}
            className={`flex flex-col items-center gap-1.5 min-w-[64px] py-1 transition-all active:scale-90 ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <item.icon className={`w-6 h-6 ${isActive ? 'fill-blue-600/10 stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;

