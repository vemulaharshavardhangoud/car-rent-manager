import React, { useMemo, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';

const BookingCalendar = ({ vehicles, bookings }) => {
  const scrollRef = useRef(null);
  
  // Calculate 30 days range from today
  const daysRange = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const getBookingBars = (vehicleId, day) => {
    const dayStr = day.toISOString().split('T')[0];
    return bookings.filter(b => 
      b.vehicleId === vehicleId && 
      b.status !== 'Cancelled' &&
      dayStr >= b.bookingStartDate && 
      dayStr <= b.bookingEndDate
    );
  };

  const isToday = (date) => date.toISOString().split('T')[0] === todayStr;

  return (
    <div className="bg-card-bg rounded-[2rem] shadow-sm border border-border-main overflow-hidden animate-fade-in-up">
      <div className="p-6 border-b border-border-main flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-text-main tracking-tight">Fleet Timeline</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Next 30 Days Availability</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Confirmed</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Pending</div>
        </div>
      </div>

      <div className="relative overflow-x-auto scrollbar-hide" ref={scrollRef}>
        <div className="min-w-[1200px]">
          {/* HEADER: Dates */}
          <div className="flex border-b border-border-main bg-main-bg/30">
            <div className="w-48 sticky left-0 z-20 bg-card-bg/95 backdrop-blur-sm border-r border-border-main p-4 font-black text-[10px] text-text-muted uppercase tracking-widest">
              Vehicle Name
            </div>
            <div className="flex flex-1">
              {daysRange.map((day, idx) => (
                <div 
                    key={idx} 
                    className={`flex-1 min-w-[40px] py-4 text-center border-r border-border-main/50 ${isToday(day) ? 'bg-blue-500/10' : ''}`}
                >
                  <div className={`text-[10px] font-black uppercase tracking-tighter ${isToday(day) ? 'text-blue-500' : 'text-text-muted'}`}>
                    {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm font-black mt-0.5 ${isToday(day) ? 'text-blue-500' : 'text-text-main'}`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROWS: Vehicles */}
          <div className="divide-y divide-border-main">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="flex group hover:bg-blue-500/5 transition-colors">
                <div className="w-48 sticky left-0 z-20 bg-card-bg/95 backdrop-blur-sm border-r border-border-main p-4 flex flex-col justify-center">
                  <div className="font-bold text-text-main text-xs truncate">{vehicle.name}</div>
                  <div className="text-[10px] text-text-muted font-mono mt-0.5">{vehicle.numberPlate}</div>
                </div>
                
                <div className="flex flex-1 relative">
                  {daysRange.map((day, idx) => {
                    const activeBookings = getBookingBars(vehicle.id, day);
                    const isBooked = activeBookings.length > 0;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`flex-1 min-w-[40px] h-14 border-r border-border-main/50 relative ${isToday(day) ? 'bg-blue-500/5' : ''}`}
                      >
                        {isBooked && activeBookings.map((b, bIdx) => {
                          const isConfirmed = b.status === 'Confirmed';
                          return (
                            <div 
                              key={b.id}
                              className={`absolute inset-y-2 inset-x-0.5 rounded-lg z-10 flex items-center justify-center cursor-help transition-all shadow-sm
                                ${isConfirmed ? 'bg-blue-600 shadow-blue-500/20' : 'bg-amber-400 shadow-amber-500/20'}
                              `}
                              title={`${b.customerName} - ${b.status}`}
                            >
                                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-main-bg/50 border-t border-border-main md:hidden">
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest justify-center">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Confirmed</div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> Pending</div>
            <div className="flex items-center gap-1.5 ml-2 text-text-muted"><Info className="w-3 h-3" /> Swipe left/right</div>
          </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
