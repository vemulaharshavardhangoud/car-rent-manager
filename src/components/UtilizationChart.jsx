import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';

const UtilizationChart = ({ vehicles, allTrips }) => {
  // Data for Pie Chart: Operational Status
  const statusData = [
    { name: 'Available', value: vehicles.filter(v => v.status === 'Available').length },
    { name: 'On Trip', value: vehicles.filter(v => v.status === 'On Trip' || v.status === 'Booked').length },
    { name: 'Maintenance', value: vehicles.filter(v => v.status === 'Under Maintenance').length },
  ].filter(d => d.value > 0);

  // Status Colors: Available (Emerald), On Trip (Blue), Maintenance (Slate)
  const COLORS = ['#10b981', '#3b82f6', '#94a3b8'];

  // Data for Bar Chart: Trips over last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const tripTrends = last7Days.map(date => {
    const count = allTrips.filter(t => t.date === date).length;
    return { date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), trips: count };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
      {/* PIE CHART: FLEET STATUS */}
      <div className="bg-card-bg p-8 rounded-[2.5rem] border border-border-main shadow-sm flex flex-col transition-colors">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-8">Fleet Allocation</h4>
        <div className="h-[260px] w-full flex items-center justify-center">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    borderRadius: '1.5rem', 
                    border: '1px solid var(--border-main)', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px',
                    color: 'var(--text-main)'
                  }}
                  itemStyle={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(val) => <span className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-main-bg rounded-full flex items-center justify-center mx-auto mb-3">
                <PieChart className="w-5 h-5 text-text-muted opacity-20" />
              </div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No Stats Available</p>
            </div>
          )}
        </div>
      </div>

      {/* BAR CHART: TRIP TRENDS */}
      <div className="bg-card-bg p-8 rounded-[2.5rem] border border-border-main shadow-sm flex flex-col transition-colors">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-8">Activity Trends (Last 7 Days)</h4>
          <div className="h-[260px] w-full flex items-center justify-center">
            {tripTrends.some(t => t.trips > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tripTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--text-muted)' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--text-muted)' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--main-bg)', opacity: 0.5 }}
                    contentStyle={{ 
                      backgroundColor: 'var(--card-bg)', 
                      borderRadius: '1.5rem', 
                      border: '1px solid var(--border-main)', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '12px 16px'
                    }}
                    itemStyle={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="trips" fill="#3b82f6" radius={[8, 8, 8, 8]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-main-bg rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart className="w-5 h-5 text-text-muted opacity-20" />
                </div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No Recent Activity</p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default UtilizationChart;
