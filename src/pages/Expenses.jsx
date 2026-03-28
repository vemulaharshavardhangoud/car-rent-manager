import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  DollarSign, Plus, Search, Filter, 
  Trash2, Edit, X, Calendar, 
  Fuel, Settings, User, AlertTriangle,
  ArrowUpRight, ArrowDownRight, TrendingUp,
  ChevronRight, Car
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';

const Expenses = () => {
  const { expenses, vehicles, addExpense, updateExpenseData, deleteExpenseData, isSyncing, requirePassword } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const categories = ['Fuel', 'Maintenance', 'Repairs', 'Driver Salary', 'Taxes', 'Others'];

  const initialForm = {
    amount: '',
    category: 'Fuel',
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    description: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const categoryTotals = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + (Number(e.amount) || 0);
      return acc;
    }, {});
    return { total, categoryTotals };
  }, [expenses]);

  const filtered = expenses.filter(e => {
    const matchesSearch = e.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, amount: Number(formData.amount) };
    if (editingExpense) {
      await updateExpenseData(editingExpense.id, data);
    } else {
      await addExpense(data);
    }
    setIsModalOpen(false);
    setFormData(initialForm);
    setEditingExpense(null);
  };

  const handleDelete = async (id) => {
    const verified = await requirePassword({ actionType: 'deleteBooking', actionLabel: 'DELETE expense record' });
    if (verified) deleteExpenseData(id);
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Fuel': return <Fuel className="w-5 h-5" />;
      case 'Maintenance': return <Settings className="w-5 h-5" />;
      case 'Driver Salary': return <User className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  return (
    <div className="pb-12 animate-fade-in space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-text-main tracking-tight">Financial Ledger</h2>
          <p className="text-sm font-medium text-text-muted mt-1 uppercase tracking-widest opacity-60 italic">Outgoing Expenses & Costs</p>
        </div>
        <button 
          onClick={() => { setEditingExpense(null); setFormData(initialForm); setIsModalOpen(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-red-600 hover:bg-black text-white px-6 py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-red-500/20 transition-all hover:-translate-y-1 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Log Expense
        </button>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card-bg rounded-[2.5rem] border border-border-main p-8 shadow-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-500/5 rounded-full group-hover:scale-110 transition-transform"></div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Total Outgoing</p>
            <h3 className="text-3xl font-black text-text-main mt-1">₹{stats.total.toLocaleString()}</h3>
          </div>
          <div className="mt-6 flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
            <ArrowUpRight className="w-4 h-4" /> Calculated lifetime
          </div>
        </div>

        <div className="bg-card-bg rounded-[2.5rem] border border-border-main p-8 shadow-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full group-hover:scale-110 transition-transform"></div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Fuel className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Fuel Expenditure</p>
            <h3 className="text-3xl font-black text-text-main mt-1">₹{(stats.categoryTotals['Fuel'] || 0).toLocaleString()}</h3>
          </div>
          <p className="mt-6 text-[10px] font-black text-text-muted/40 uppercase tracking-widest">Across entire fleet</p>
        </div>

        <div className="bg-card-bg rounded-[2.5rem] border border-border-main p-8 shadow-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/5 rounded-full group-hover:scale-110 transition-transform"></div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Maintenance</p>
            <h3 className="text-3xl font-black text-text-main mt-1">₹{(stats.categoryTotals['Maintenance'] || 0).toLocaleString()}</h3>
          </div>
          <p className="mt-6 text-[10px] font-black text-text-muted/40 uppercase tracking-widest">Repairs & Servicing</p>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted opacity-40 group-focus-within:text-red-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search description..."
            className="w-full pl-16 pr-6 py-5 bg-card-bg border border-border-main rounded-[2rem] focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-sm font-bold text-text-main placeholder:text-text-muted/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-card-bg p-2 rounded-[2rem] border border-border-main gap-2 overflow-x-auto no-scrollbar max-w-full">
           {['All', ...categories].map(cat => (
             <button
               key={cat}
               onClick={() => setCategoryFilter(cat)}
               className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'hover:bg-main-bg text-text-muted'}`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      {/* EXPENSE LIST */}
      {filtered.length === 0 ? (
        <EmptyState 
          icon={DollarSign} 
          title="No Expenses Logged" 
          message="Track every rupee spent to understand your business profitability."
          actionLabel="Add Expense Now"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(expense => (
            <div key={expense.id} className="bg-card-bg rounded-[2rem] border border-border-main p-6 flex items-center justify-between group hover:border-red-500/30 transition-all shadow-sm">
                <div className="flex items-center gap-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                     expense.category === 'Fuel' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                     expense.category === 'Maintenance' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                     'bg-red-500/10 border-red-500/20 text-red-600'
                   }`}>
                      {getCategoryIcon(expense.category)}
                   </div>
                   <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">{expense.date}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-border-main"></span>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{expense.category}</span>
                      </div>
                      <h4 className="text-lg font-black text-text-main mt-1 tracking-tight">{expense.description || 'No description'}</h4>
                      {expense.vehicleId && (
                        <p className="text-xs font-bold text-text-muted flex items-center gap-1.5 mt-1">
                          <Car className="w-3.5 h-3.5" /> {vehicles.find(v => v.id === expense.vehicleId)?.name}
                        </p>
                      )}
                   </div>
                </div>

                <div className="flex items-center gap-8 text-right">
                   <div>
                      <p className="text-2xl font-black text-text-main tracking-tight">₹{Number(expense.amount).toLocaleString()}</p>
                   </div>
                   <div className="hidden group-hover:flex items-center gap-2 animate-fade-in">
                      <button 
                        onClick={() => { setEditingExpense(expense); setFormData(expense); setIsModalOpen(true); }}
                        className="p-3 bg-main-bg hover:bg-black hover:text-white rounded-xl transition-all border border-border-main"
                      >
                         <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-3 bg-red-500/10 hover:bg-red-600 hover:text-white rounded-xl transition-all text-red-600"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-card-bg rounded-[3rem] shadow-2xl overflow-hidden border border-border-main animate-slide-up">
              <div className="p-10 border-b border-border-main bg-main-bg/20 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-text-main tracking-tight">{editingExpense ? 'Edit Expense' : 'New Expense Entry'}</h3>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1">Finance & Ledger</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-main-bg rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-text-muted" />
                </button>
             </div>

             <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Amount (₹)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 text-2xl font-black text-red-500 focus:border-red-500 transition-all outline-none"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Category</label>
                    <select 
                      className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 text-sm font-bold text-text-main focus:border-red-500 transition-all outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Date</label>
                    <input 
                      required
                      type="date" 
                      className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 text-sm font-bold text-text-main focus:border-red-500 transition-all outline-none"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Related Vehicle (Optional)</label>
                  <select 
                    className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 text-sm font-bold text-text-main focus:border-red-500 transition-all outline-none"
                    value={formData.vehicleId}
                    onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                  >
                    <option value="">N/A - General Expense</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.numberPlate})</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Description</label>
                  <textarea 
                    rows="2"
                    className="w-full bg-main-bg border-border-main border-2 rounded-2xl p-4 text-sm font-bold text-text-main focus:border-red-500 transition-all outline-none resize-none"
                    placeholder="What was this for?"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full py-5 bg-red-600 hover:bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3">
                    <TrendingUp className="w-5 h-5" />
                    {editingExpense ? 'Update Entry' : 'Post to Ledger'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
