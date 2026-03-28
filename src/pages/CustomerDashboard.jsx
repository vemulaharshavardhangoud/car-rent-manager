import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CarFront, CalendarCheck, MapPin } from 'lucide-react';

const CustomerDashboard = () => {
  const { vehicles, bookings } = useContext(AppContext);
  const navigate = useNavigate();

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const onTripVehicles = vehicles.filter(v => v.status === 'On Trip').length;

  const stats = [
    { label: 'Total Fleet', value: totalVehicles, icon: CarFront, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Available Now', value: availableVehicles, icon: CalendarCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Currently on Trip', value: onTripVehicles, icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-text-main tracking-tight">Customer <span className="text-blue-600">Dashboard</span></h1>
        <p className="text-text-muted font-medium">Welcome back! Here's a quick look at our fleet status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#0d1b2a] border border-white/10 rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[80px] -mr-16 -mt-16 group-hover:blur-[100px] transition-all`}></div>
            <div className="relative z-10 text-white">
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-black tracking-tight mb-4">Ready for your next journey?</h2>
          <p className="text-white font-medium text-lg mb-8 leading-relaxed">Browse our wide range of premium vehicles and book your favorite one in seconds.</p>
          <button 
            onClick={() => navigate('/new-booking')}
            className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 shadow-xl"
          >
            Start New Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
