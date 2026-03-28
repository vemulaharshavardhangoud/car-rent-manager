import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CarFront, CalendarCheck, MapPin, QrCode, Share2 } from 'lucide-react';

const CustomerDashboard = () => {
  const { vehicles, isSyncing } = useContext(AppContext);
  const navigate = useNavigate();

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const onTripVehicles = vehicles.filter(v => v.status === 'On Trip').length;

  // Premium Skeleton Loader for a 'WOW' first impression while syncing
  if (isSyncing && totalVehicles === 0) {
    return (
      <div className="space-y-8 animate-pulse pb-10">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-48 bg-border-main rounded-xl"></div>
          <div className="h-4 w-64 bg-border-main/50 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-card-bg border border-border-main rounded-[2.5rem]"></div>
          ))}
        </div>
        <div className="h-64 bg-border-main/30 rounded-[2.5rem]"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Fleet', value: totalVehicles, icon: CarFront, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Available Now', value: availableVehicles, icon: CalendarCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Currently on Trip', value: onTripVehicles, icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  // The link to the main website root
  const websiteLink = `${window.location.origin}${window.location.pathname}#/`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(websiteLink)}`;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-text-main tracking-tight">Customer <span className="text-blue-600">Dashboard</span></h1>
        <p className="text-text-muted font-medium">Welcome back! Here's a quick look at our fleet status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card-bg border border-border-main rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[80px] -mr-16 -mt-16 group-hover:blur-[100px] transition-all`}></div>
            <div className="relative z-10">
              <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-text-main tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20 flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-black tracking-tight mb-4 text-white">Ready for your next journey?</h2>
            <p className="text-white font-medium text-lg mb-8 leading-relaxed">Browse our wide range of premium vehicles and book your favorite one in seconds.</p>
            <button 
              onClick={() => navigate('/new-booking')}
              className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 shadow-xl"
            >
              Start New Booking
            </button>
          </div>
        </div>

        <div className="bg-card-bg border border-border-main rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-75 group-hover:scale-110 transition-transform"></div>
            <div className="bg-white p-4 rounded-2xl shadow-lg relative border border-gray-100">
               <img src={qrUrl} alt="Website QR Code" className="w-32 h-32" />
               <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl text-white shadow-lg">
                  <QrCode className="w-4 h-4" />
               </div>
            </div>
          </div>
          <h3 className="text-xl font-black text-text-main mb-2">Scan Website</h3>
          <p className="text-text-muted text-sm font-medium mb-6">Open your camera to scan and visit the website instantly.</p>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(websiteLink);
              alert('Website link copied to clipboard!');
            }}
            className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
          >
            <Share2 className="w-4 h-4" /> Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

