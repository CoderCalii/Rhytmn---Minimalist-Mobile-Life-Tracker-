import React, { useState, useMemo } from 'react';
import { 
  Home, 
  Activity, 
  CreditCard, 
  Plus, 
  ChevronLeft, 
  X, 
  Zap, 
  Wallet, 
  TrendingUp, 
  Check, 
  Search, 
  ShoppingBag, 
  Utensils, 
  Car, 
  Tv 
} from 'lucide-react';

// --- Types & Data ---

const INITIAL_TRANSACTIONS = [
  { id: 't1', title: 'Blue Bottle Coffee', category: 'Food & Drink', amount: 6.50, type: 'expense', date: 'Today', icon: <Utensils size={16} /> },
  { id: 't2', title: 'Salary Deposit', category: 'Work', amount: 4200.00, type: 'income', date: 'Today', icon: <TrendingUp size={16} /> },
  { id: 't3', title: 'Apple Store', category: 'Tech', amount: 129.00, type: 'expense', date: 'Yesterday', icon: <Zap size={16} /> },
  { id: 't4', title: 'Uber Trip', category: 'Transport', amount: 24.80, type: 'expense', date: 'Yesterday', icon: <Car size={16} /> },
  { id: 't5', title: 'Netflix', category: 'Entertainment', amount: 15.99, type: 'expense', date: 'Jan 1', icon: <Tv size={16} /> },
];

const INITIAL_GOALS = [
  { id: 'g1', name: 'Real Estate', target: 100000, current: 84200, color: 'bg-orange-50' },
  { id: 'g2', name: 'New Car', target: 45000, current: 12000, color: 'bg-purple-50' },
  { id: 'g3', name: 'Emergency Fund', target: 20000, current: 18500, color: 'bg-blue-50' },
  { id: 'g4', name: 'Japan Trip', target: 8000, current: 3200, color: 'bg-rose-50' },
];

const INITIAL_ACCOUNTS = [
  { name: 'Main Spending', balance: 12450.80, color: 'bg-black', text: 'text-white', number: '8821' },
  { name: 'High Yield Savings', balance: 45200.00, color: 'bg-blue-600', text: 'text-white', number: '4410' },
  { name: 'Business Pro', balance: 8900.25, color: 'bg-emerald-500', text: 'text-white', number: '1002' },
];

// --- Sub-components ---

const Header = () => {
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="px-6 pt-12 pb-6 sticky top-0 bg-white/80 backdrop-blur-md z-[60]">
      <h1 className="text-4xl font-black tracking-tight text-black">Portfolio</h1>
      <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{today}</p>
    </div>
  );
};

// --- Finance View ---

const FinanceView = ({ onGoalContribution }) => {
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);

  const cycleAccount = () => {
    setActiveAccountIndex((prev) => (prev + 1) % INITIAL_ACCOUNTS.length);
  };

  const getCardStyle = (index) => {
    const diff = (index - activeAccountIndex + INITIAL_ACCOUNTS.length) % INITIAL_ACCOUNTS.length;
    if (diff === 0) return { transform: 'translateY(0) scale(1)', zIndex: 30, opacity: 1 };
    if (diff === 1) return { transform: 'translateY(16px) scale(0.95)', zIndex: 20, opacity: 0.6 };
    return { transform: 'translateY(32px) scale(0.90)', zIndex: 10, opacity: 0.3 };
  };

  const groupedTransactions = useMemo(() => {
    return INITIAL_TRANSACTIONS.reduce((acc, t) => {
      if (!acc[t.date]) acc[t.date] = [];
      acc[t.date].push(t);
      return acc;
    }, {});
  }, []);

  return (
    <div className="flex-1 overflow-y-auto pb-44 no-scrollbar">
      <Header />
      
      <div className="px-6 max-w-lg mx-auto space-y-14">
        
        {/* 1. CARDS */}
        <section className="relative h-60 cursor-pointer mb-4" onClick={cycleAccount}>
          {INITIAL_ACCOUNTS.map((acc, i) => (
            <div 
              key={acc.name}
              style={getCardStyle(i)}
              className={`absolute inset-0 p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 ${acc.color} ${acc.text} flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] opacity-60 font-black uppercase tracking-[0.2em]">{acc.name}</p>
                  <h2 className="text-3xl font-black mt-2 tracking-tighter">
                    ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h2>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <Wallet size={20} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <p className="font-mono tracking-[0.3em] text-[10px] opacity-50 underline decoration-2 underline-offset-4 decoration-white/20">**** {acc.number}</p>
                <div className="h-8 w-12 bg-white/10 rounded-lg border border-white/20"></div>
              </div>
            </div>
          ))}
        </section>

        {/* 2. GOALS (Growth Targets) */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-xl font-black tracking-tight">Growth Targets</h3>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Manage</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {INITIAL_GOALS.map((goal) => {
              const progress = Math.round((goal.current / goal.target) * 100);
              return (
                <div 
                  key={goal.id} 
                  className={`${goal.color} p-5 rounded-[2.5rem] border border-white/50 shadow-sm relative overflow-hidden group active:scale-95 transition-all`}
                >
                  <div className="relative z-10">
                    {/* Progress and Button AT TOP as requested */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="px-3 py-1.5 rounded-full bg-white text-[11px] font-black shadow-sm text-slate-900">
                        {progress}%
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onGoalContribution(goal); }}
                        className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg shadow-black/10"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                    
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{goal.name}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">${(goal.current / 1000).toFixed(1)}k</p>
                  </div>
                  
                  {/* Subtle Progress Bar at bottom */}
                  <div className="absolute bottom-0 left-0 h-1.5 bg-black/5 w-full">
                    <div className="h-full bg-black/10 transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. ACTIVITY */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-xl font-black tracking-tight text-slate-900">Activity</h3>
            <button className="text-[11px] font-black text-slate-300 uppercase tracking-widest">History</button>
          </div>

          <div className="space-y-10">
            {Object.entries(groupedTransactions).map(([date, items]) => (
              <div key={date}>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">
                  {date}
                </p>
                <div className="space-y-4">
                  {items.map((t) => (
                    <div 
                      key={t.id} 
                      className="group flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'}`}>
                          {t.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 tracking-tight">{t.title}</h4>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{t.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>
                          {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter mt-0.5">12:30 PM</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Modals ---

const FinanceCaptureModal = ({ onClose, goals, initialGoalId }) => {
  const [amount, setAmount] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(initialGoalId);

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-10 sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
        <div className="p-10">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black tracking-tight">Log Entry</h2>
            <button onClick={onClose} className="p-3 bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
          </div>
          
          <div className="text-center mb-10">
            <p className="text-[10px] font-black text-slate-300 mb-2 uppercase tracking-[0.2em]">Amount (USD)</p>
            <div className="flex items-center justify-center text-6xl font-black tracking-tighter">
              <span className="text-slate-200 mr-2">$</span>
              <input type="number" autoFocus placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-48 bg-transparent outline-none border-none text-center placeholder:text-slate-100" />
            </div>
          </div>

          <div className="mb-10">
            <p className="text-[10px] font-black text-slate-300 mb-4 uppercase tracking-[0.2em]">Growth Destination</p>
            <div className="grid grid-cols-2 gap-3">
              {goals.map((g) => (
                <button key={g.id} onClick={() => setSelectedGoal(g.id)} className={`p-5 rounded-3xl border-2 text-[11px] font-black transition-all flex items-center justify-between ${selectedGoal === g.id ? 'border-black bg-black text-white shadow-lg' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}>
                  {g.name}
                  {selectedGoal === g.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <button onClick={onClose} className="w-full py-6 bg-black text-white rounded-[2.5rem] font-black text-lg active:scale-95 transition-all shadow-xl shadow-black/20">
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState('finance');
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [activeGoalId, setActiveGoalId] = useState(null);

  return (
    <div className="flex flex-col h-screen bg-white text-black font-sans max-w-md mx-auto relative overflow-hidden shadow-2xl">
      
      {view === 'finance' ? (
        <FinanceView onGoalContribution={(g) => { setActiveGoalId(g.id); setShowFinanceModal(true); }} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-300 font-black uppercase tracking-widest">
          Coming Soon
        </div>
      )}

      {showFinanceModal && <FinanceCaptureModal goals={INITIAL_GOALS} initialGoalId={activeGoalId} onClose={() => setShowFinanceModal(false)} />}
      
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white/80 backdrop-blur-2xl border border-slate-100/50 h-20 rounded-[2.8rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex items-center justify-around px-4 z-40">
        <button onClick={() => setView('home')} className={`p-4 transition-all ${view === 'home' ? 'text-black scale-110' : 'text-slate-300'}`}><Home size={22} strokeWidth={2.5} /></button>
        <button onClick={() => setView('finance')} className={`p-4 transition-all ${view === 'finance' ? 'text-black scale-110' : 'text-slate-300'}`}><Wallet size={22} strokeWidth={2.5} /></button>
        <div className="relative -top-8">
          <button onClick={() => { setActiveGoalId(null); setShowFinanceModal(true); }} className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] border-[6px] border-white active:scale-90 transition-all">
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>
        <button className="p-4 text-slate-300"><CreditCard size={22} strokeWidth={2.5} /></button>
        <button className="p-4 text-slate-300"><Search size={22} strokeWidth={2.5} /></button>
      </nav>
      
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}