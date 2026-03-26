import React from 'react';
import { ShieldAlert, Calendar, ChevronRight, AlertCircle } from 'lucide-react';

const ExpiryAlerts = ({ vehicles, onVehicleClick }) => {
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(dateString);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const alerts = [];

  vehicles.forEach(v => {
    const docs = [
      { label: 'Insurance', key: 'insuranceExpiry', date: v.insuranceExpiry },
      { label: 'Permit', key: 'permitExpiry', date: v.permitExpiry },
      { label: 'Fitness', key: 'fitnessExpiry', date: v.fitnessExpiry }
    ];

    docs.forEach(doc => {
      const days = getDaysRemaining(doc.date);
      if (days !== null && days <= 30) {
        alerts.push({
          vehicleId: v.id,
          vehicleName: v.name,
          plate: v.numberPlate,
          docType: doc.label,
          days,
          date: doc.date,
          vehicle: v
        });
      }
    });
  });

  // Sort by urgency (days remaining)
  alerts.sort((a, b) => a.days - b.days);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-card-bg rounded-[2.5rem] border border-border-main overflow-hidden transition-colors shadow-sm">
      <div className="p-8 border-b border-border-main flex items-center justify-between bg-main-bg/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main tracking-tight">Compliance Alerts</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Documents expiring within 30 days</p>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
          {alerts.length} Urgent
        </div>
      </div>
      
      <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
        {alerts.map((alert, idx) => {
          let statusColor = 'text-red-500 bg-red-500/10 border-red-500/20';
          let statusText = alert.days < 0 ? 'Expired' : alert.days === 0 ? 'Expires Today' : `${alert.days} Days Left`;
          
          if (alert.days > 15) {
            statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
          } else if (alert.days > 0) {
            statusColor = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
          }
          
          return (
            <div 
              key={`${alert.vehicleId}-${alert.docType}-${idx}`}
              onClick={() => onVehicleClick(alert.vehicle)}
              className="group p-4 bg-main-bg/50 hover:bg-main-bg border border-border-main rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${statusColor}`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-text-main">{alert.vehicleName}</span>
                    <span className="text-[10px] font-mono text-text-muted uppercase">{alert.plate}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{alert.docType}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>
                  {statusText}
                </span>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExpiryAlerts;
