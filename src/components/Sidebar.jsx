import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CarFront, PlusCircle, History, Settings, X, Car, CalendarDays, User, Users, DollarSign, Search, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { isAdmin, isCustomer, logout } = useAuth();

  const ownerItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vehicles', label: 'Vehicles', icon: CarFront },
    { path: '/bookings', label: 'Bookings', icon: CalendarDays },
    { path: '/drivers', label: 'Drivers', icon: User },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/expenses', label: 'Expenses', icon: DollarSign },
    { path: '/newtrip', label: 'New Trip', icon: PlusCircle },
    { path: '/history', label: 'History', icon: History },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const customerItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vehicles', label: 'Vehicles', icon: CarFront },
    { path: '/new-booking', label: 'New Booking', icon: PlusCircle },
    { path: '/my-bookings', label: 'My Booking', icon: Search },
  ];

  const navItems = isAdmin ? ownerItems : customerItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[250px] bg-card-bg text-text-main flex flex-col transition-all duration-300 ease-in-out border-r border-border-main lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-border-main bg-main-bg/20">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-text-main leading-none">CarRent <span className="text-blue-600">Pro</span></span>
              <span className="text-[9px] font-black text-blue-600 bg-blue-600/10 px-2 py-0.5 rounded-md self-start tracking-wider uppercase mt-2">{isAdmin ? 'Owner Portal' : 'Customer Portal'}</span>
            </div>
          </div>
          <button 
            className="lg:hidden p-2 hover:bg-main-bg rounded-xl transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6 text-text-muted" />
          </button>
        </div>

        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto min-h-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-4 mb-4 opacity-50">Portal Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 translate-x-1' 
                    : 'text-text-muted hover:bg-main-bg hover:text-text-main'
                }`
              }
            >
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110`} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-border-main bg-main-bg/10 flex flex-col gap-2 pb-safe">
          {isAdmin && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Version</span>
                <span className="text-xs font-bold text-text-main mt-0.5">2.0.4-Premium</span>
              </div>
              <NavLink 
                to="/settings" 
                onClick={() => setIsOpen(false)} 
                className={({isActive}) => `p-3 rounded-xl transition-all ${isActive ? 'text-blue-600 bg-blue-500/10' : 'text-text-muted hover:bg-blue-500/10 hover:text-blue-600'}`}
              >
                <Settings className="w-5 h-5" />
              </NavLink>
            </div>
          )}
          
          <button 
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
