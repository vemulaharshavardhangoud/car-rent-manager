import React from 'react';
import { Wind, Thermometer, Zap, Award } from 'lucide-react';

const CostComparison = ({ vehicle, distance, days, activeMode, activeAC }) => {
  if (!vehicle) return null;

  const scenarios = [
    { 
      label: 'Standard KM', 
      mode: 'KM', 
      ac: false, 
      rate: vehicle.ratePerKm, 
      total: (Number(distance) || 0) * Number(vehicle.ratePerKm),
      icon: Wind,
      color: 'blue'
    },
    { 
      label: 'Standard Day', 
      mode: 'DAY', 
      ac: false, 
      rate: vehicle.ratePerDay, 
      total: (Number(days) || 1) * Number(vehicle.ratePerDay),
      icon: Wind,
      color: 'emerald'
    },
    { 
      label: 'AC per KM', 
      mode: 'KM', 
      ac: true, 
      rate: vehicle.ratePerKmAC, 
      total: (Number(distance) || 0) * (Number(vehicle.ratePerKmAC) || Number(vehicle.ratePerKm)),
      icon: Thermometer,
      color: 'cyan',
      disabled: !vehicle.hasAC
    },
    { 
      label: 'AC per Day', 
      mode: 'DAY', 
      ac: true, 
      rate: vehicle.ratePerDayAC, 
      total: (Number(days) || 1) * (Number(vehicle.ratePerDayAC) || Number(vehicle.ratePerDay)),
      icon: Thermometer,
      color: 'indigo',
      disabled: !vehicle.hasAC
    }
  ];

  // Map modes to match parent logic
  const matchMode = (m) => {
    if (activeMode === 'perDay') return 'DAY'; // Bookings.jsx uses perDay
    if (activeMode === 'perKm') return 'KM';   // Bookings.jsx uses perKm
    return activeMode; // NewTrip.jsx uses KM/DAY
  };

  const isActive = (s) => matchMode(s.mode) === activeMode && s.ac === activeAC;

  // Find cheapest valid option
  const validScenarios = scenarios.filter(s => !s.disabled);
  const cheapest = [...validScenarios].sort((a, b) => a.total - b.total)[0];

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" /> Compare Possibilities
        </h4>
        <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Live Estimation</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {scenarios.map((s, idx) => {
          const active = isActive(s);
          const isCheapest = cheapest && s.total === cheapest.total && !s.disabled;
          
          if (s.disabled) return (
            <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200 opacity-40 flex flex-col justify-center items-center text-center">
              <span className="text-[9px] font-bold text-gray-400 uppercase">{s.label}</span>
              <span className="text-[8px] text-gray-400 mt-1 italic">N/A</span>
            </div>
          );

          return (
            <div 
              key={idx} 
              className={`relative p-4 rounded-2xl border-2 transition-all ${active ? 'bg-white border-blue-600 shadow-lg shadow-blue-100 ring-4 ring-blue-50' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
            >
              {active && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full shadow-md z-10">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
              
              {isCheapest && !active && (
                <div className="absolute -top-2 left-3 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                  <Award className="w-2.5 h-2.5" /> SAVER
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-3 h-3 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider ${active ? 'text-blue-900' : 'text-gray-500'}`}>{s.label}</span>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-black ${active ? 'text-blue-700' : 'text-gray-800'}`}>₹{Math.round(s.total)}</span>
              </div>
              
              <div className="mt-1 flex justify-between items-center">
                <span className={`text-[8px] font-bold ${active ? 'text-blue-400' : 'text-gray-400'}`}>₹{s.rate}/{s.mode}</span>
                {active && <span className="text-[9px] font-black text-blue-600 animate-bounce">●</span>}
              </div>
            </div>
          );
        })}
      </div>

      {cheapest && !isActive(cheapest) && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3 animate-pulse">
          <div className="bg-emerald-500 text-white p-1.5 rounded-lg">
            <Zap className="w-3 h-3" />
          </div>
          <p className="text-[10px] font-bold text-emerald-800 leading-tight">
            Switch to <span className="font-black underline">{cheapest.label}</span> to save <span className="text-sm font-black text-emerald-600 decoration-none">₹{Math.round(scenarios.find(isActive)?.total - cheapest.total || 0)}</span>!
          </p>
        </div>
      )}
    </div>
  );
};

export default CostComparison;
