import { Menu, Bell, Cloud, CloudOff, RefreshCw, AlertTriangle, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Header = ({ setSidebarOpen }) => {
  const { isOnline, isSyncing, lastSyncedAt, syncError } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  
  const { isAdmin } = useAuth();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/vehicles': return isAdmin ? 'Manage Vehicles' : 'Available Fleet';
      case '/newtrip': return 'Record a New Trip';
      case '/history': return 'Trip History';
      case '/bookings': return 'Bookings';
      case '/new-booking': return 'Request Booking';
      case '/my-bookings': return 'My Bookings';
      case '/settings': return 'Settings';
      case '/drivers': return 'Drivers';
      case '/customers': return 'Customer Database';
      case '/expenses': return 'Finance & Expenses';
      default: return 'CarRent Manager';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getTimeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <header className="h-16 bg-card-bg border-b border-border-main shadow-sm flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 hover:bg-main-bg rounded-md text-text-muted transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-text-main">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 bg-main-bg hover:bg-blue-500/10 border border-border-main text-text-muted hover:text-blue-500 rounded-2xl transition-all active:scale-95"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Sync Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-main-bg rounded-full border border-border-main transition-colors">
          {isOnline ? (
            <>
              {syncError ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Sync Error</span>
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">Syncing...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
                    Synced {getTimeAgo(lastSyncedAt)}
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Offline Mode</span>
            </>
          )}
        </div>

        <span className="text-sm text-text-muted hidden md:block font-medium">{currentDate}</span>
        
        <button className="relative p-2 text-text-muted hover:bg-main-bg rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
