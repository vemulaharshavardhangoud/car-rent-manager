import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Car, History, Menu } from 'lucide-react';

const BottomNav = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: User, label: 'You', path: '/settings' },
    { icon: Car, label: 'Fleet', path: '/vehicles' },
    { icon: History, label: 'Trips', path: '/history' },
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
            onClick={() => isMenu ? setSidebarOpen(true) : navigate(item.path)}
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

