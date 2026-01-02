import React, { useMemo, useState } from 'react';
import { 
  Home, 
  CheckSquare, 
  Activity, 
  CreditCard, 
  Plus, 
  ChevronLeft, 
  Zap,
  Sun,
  Sparkles,
  X,
  ArrowRight,
  TrendingUp,
  Wallet,
  Check,
  Flame,
  Clock,
  FileText,
  Tag,
  Utensils,
  Car,
  Tv
} from 'lucide-react';

// --- Types ---

type ViewState = 'home' | 'tasks' | 'habits' | 'finance' | 'page_detail';
type TimeScale = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

interface Block {
  id: string;
  type: 'text' | 'heading' | 'todo' | 'habit_widget' | 'finance_widget';
  content: any;
}

interface Page {
  id: string;
  title: string;
  icon: string;
  category?: string;
  blocks: Block[];
  updatedAt: string;
}

interface FinanceGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
}

interface FinanceAccount {
  name: string;
  balance: number;
  color: string;
  text: string;
  number: string;
}

interface FinanceTransaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  icon: React.ReactNode;
}

interface Habit {
  id: string;
  name: string;
  meta: string;
  color: string;
  data: number[];
  monthly: number;
  yearly: number;
}

// --- Mock Data ---

const INITIAL_PAGES: Page[] = [
  {
    id: 'daily',
    title: 'Today',
    icon: 'ðŸ—“ï¸',
    category: 'system',
    updatedAt: 'Now',
    blocks: [
      { id: 'b1', type: 'heading', content: 'Morning Focus' },
      { id: 'b2', type: 'todo', content: { text: 'Review Q4 strategy document', done: false } },
      { id: 'b3', type: 'todo', content: { text: 'Email marketing team', done: true } },
    ]
  },
  {
    id: '1',
    title: 'Product Strategy',
    icon: 'ðŸ§ ',
    updatedAt: '2h ago',
    blocks: [
      { id: 'b4', type: 'heading', content: 'Core Principles' },
      { id: 'b5', type: 'text', content: 'Simplicity is the ultimate sophistication.' },
    ]
  },
];

const INITIAL_TRANSACTIONS: FinanceTransaction[] = [
  { id: 't1', title: 'Blue Bottle Coffee', category: 'Food & Drink', amount: 6.50, type: 'expense', date: 'Today', icon: <Utensils size={16} /> },
  { id: 't2', title: 'Salary Deposit', category: 'Work', amount: 4200.00, type: 'income', date: 'Today', icon: <TrendingUp size={16} /> },
  { id: 't3', title: 'Apple Store', category: 'Tech', amount: 129.00, type: 'expense', date: 'Yesterday', icon: <Zap size={16} /> },
  { id: 't4', title: 'Uber Trip', category: 'Transport', amount: 24.80, type: 'expense', date: 'Yesterday', icon: <Car size={16} /> },
  { id: 't5', title: 'Netflix', category: 'Entertainment', amount: 15.99, type: 'expense', date: 'Jan 1', icon: <Tv size={16} /> },
];

const INITIAL_GOALS: FinanceGoal[] = [
  { id: 'g1', name: 'Real Estate', target: 100000, current: 84200, color: 'bg-orange-50' },
  { id: 'g2', name: 'New Car', target: 45000, current: 12000, color: 'bg-purple-50' },
  { id: 'g3', name: 'Emergency Fund', target: 20000, current: 18500, color: 'bg-blue-50' },
  { id: 'g4', name: 'Japan Trip', target: 8000, current: 3200, color: 'bg-rose-50' },
];

const INITIAL_ACCOUNTS: FinanceAccount[] = [
  { name: 'Main Spending', balance: 12450.80, color: 'bg-black', text: 'text-white', number: '8821' },
  { name: 'High Yield Savings', balance: 45200.00, color: 'bg-blue-600', text: 'text-white', number: '4410' },
  { name: 'Business Pro', balance: 8900.25, color: 'bg-emerald-500', text: 'text-white', number: '1002' },
];

const INITIAL_HABITS: Habit[] = [
  { id: 'h1', name: 'Deep Work', meta: '2h/day', color: 'bg-black', data: [1, 1, 0, 1, 1, 1, 0], monthly: 22, yearly: 245 },
  { id: 'h2', name: 'Reading', meta: '20p/day', color: 'bg-black', data: [0, 1, 1, 1, 0, 1, 1], monthly: 18, yearly: 190 },
  { id: 'h3', name: 'Movement', meta: '45m/day', color: 'bg-black', data: [1, 0, 1, 0, 1, 1, 1], monthly: 25, yearly: 310 }
];

// --- Sub-components ---

const Header = ({ title, subtitle, rightAction }: { title: string, subtitle?: string, rightAction?: React.ReactNode }) => (
  <div className="px-6 pt-12 pb-4 flex justify-between items-end bg-white/95 backdrop-blur-sm sticky top-0 z-10">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-black">{title}</h1>
      {subtitle && <p className="text-gray-400 text-sm mt-1 font-medium tracking-wide">{subtitle}</p>}
    </div>
    {rightAction && <div>{rightAction}</div>}
  </div>
);

// --- View: Habits (Rhythm) ---

const HabitView = ({ habits }: { habits: Habit[] }) => {
  const [scale, setScale] = useState<TimeScale>('Weekly');

  const renderScaleContent = () => {
    switch (scale) {
      case 'Daily':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 bg-gray-50 p-4 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Current Streak</span>
                <span className="text-xl font-bold">12 Days</span>
              </div>
              <Flame className="text-orange-400 fill-orange-400" size={20} />
            </div>
            {habits.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${h.data[0] ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  <div>
                    <h4 className="font-bold text-sm">{h.name}</h4>
                    <p className="text-[10px] text-gray-400">{h.meta}</p>
                  </div>
                </div>
                <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${h.data[0] ? 'bg-black text-white' : 'bg-gray-100 text-gray-300'}`}>
                   <Check size={20} />
                </button>
              </div>
            ))}
          </div>
        );

      case 'Weekly':
        return (
          <div className="space-y-8">
            <div className="flex justify-between px-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="text-[10px] font-bold text-gray-400 w-8 text-center">{d}</span>)}
            </div>
            {habits.map((h, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-bold text-sm uppercase tracking-wider">{h.name}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{h.data.filter(Boolean).length}/7 days</span>
                </div>
                <div className="flex justify-between gap-1.5 h-10">
                  {h.data.map((v, idx) => (
                    <div key={idx} className={`flex-1 rounded-lg transition-all duration-500 ${v ? h.color : 'bg-gray-100'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'Monthly':
        return (
          <div className="space-y-8">
            {habits.map((h, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-bold text-sm uppercase tracking-wider">{h.name}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{h.monthly} days active</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }).map((_, idx) => {
                    const isActive = Math.random() > 0.3;
                    return (
                      <div 
                        key={idx} 
                        className={`aspect-square rounded-sm ${isActive ? h.color : 'bg-gray-100'}`}
                        style={{ opacity: isActive ? (0.3 + (Math.random() * 0.7)) : 1 }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );

      case 'Yearly':
        return (
          <div className="space-y-10">
             {habits.map((h, i) => (
              <div key={i}>
                <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{h.name}</h4>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 12 }).map((_, monthIdx) => (
                    <div key={monthIdx} className="flex flex-col gap-1">
                      <div className="w-6 h-20 bg-gray-50 rounded-full relative overflow-hidden">
                        <div 
                          className={`absolute bottom-0 left-0 right-0 ${h.color} transition-all duration-1000`} 
                          style={{ height: `${40 + Math.random() * 60}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold text-center">M{monthIdx+1}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Annual Completion</span>
                  <span className="text-lg font-mono font-bold">{h.yearly}/365</span>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-40">
      <Header title="Rhythm" subtitle="Consistency > Intensity" />
      
      <div className="px-6 mb-8 mt-2 sticky top-24 bg-white/95 backdrop-blur-sm pb-4 z-10">
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-100">
          {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as TimeScale[]).map((s) => (
            <button 
              key={s} 
              onClick={() => setScale(s)} 
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${scale === s ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {renderScaleContent()}
      </div>
    </div>
  );
};

// --- View: Finance ---

const FinanceHeader = () => {
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

const FinanceView = ({ onGoalContribution }: { onGoalContribution: (goal: FinanceGoal) => void }) => {
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);

  const cycleAccount = () => {
    setActiveAccountIndex((prev) => (prev + 1) % INITIAL_ACCOUNTS.length);
  };

  const getCardStyle = (index: number) => {
    const diff = (index - activeAccountIndex + INITIAL_ACCOUNTS.length) % INITIAL_ACCOUNTS.length;
    if (diff === 0) return { transform: 'translateY(0) scale(1)', zIndex: 30, opacity: 1 };
    if (diff === 1) return { transform: 'translateY(16px) scale(0.95)', zIndex: 20, opacity: 0.6 };
    return { transform: 'translateY(32px) scale(0.90)', zIndex: 10, opacity: 0.3 };
  };

  const groupedTransactions = useMemo(() => {
    return INITIAL_TRANSACTIONS.reduce<Record<string, FinanceTransaction[]>>((acc, transaction) => {
      if (!acc[transaction.date]) acc[transaction.date] = [];
      acc[transaction.date].push(transaction);
      return acc;
    }, {});
  }, []);

  return (
    <div className="flex-1 overflow-y-auto pb-44 no-scrollbar">
      <FinanceHeader />
      
      <div className="px-6 max-w-lg mx-auto space-y-14">
        <section className="relative h-60 cursor-pointer mb-4" onClick={cycleAccount}>
          {INITIAL_ACCOUNTS.map((account, index) => (
            <div 
              key={account.name}
              style={getCardStyle(index)}
              className={`absolute inset-0 p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 ${account.color} ${account.text} flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] opacity-60 font-black uppercase tracking-[0.2em]">{account.name}</p>
                  <h2 className="text-3xl font-black mt-2 tracking-tighter">
                    ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h2>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <Wallet size={20} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <p className="font-mono tracking-[0.3em] text-[10px] opacity-50 underline decoration-2 underline-offset-4 decoration-white/20">**** {account.number}</p>
                <div className="h-8 w-12 bg-white/10 rounded-lg border border-white/20"></div>
              </div>
            </div>
          ))}
        </section>

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
                    <div className="flex justify-between items-center mb-6">
                      <div className="px-3 py-1.5 rounded-full bg-white text-[11px] font-black shadow-sm text-slate-900">
                        {progress}%
                      </div>
                      <button 
                        onClick={(event) => { event.stopPropagation(); onGoalContribution(goal); }}
                        className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg shadow-black/10"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                    
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{goal.name}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">${(goal.current / 1000).toFixed(1)}k</p>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 h-1.5 bg-black/5 w-full">
                    <div className="h-full bg-black/10 transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

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
                  {items.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="group flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${transaction.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'}`}>
                          {transaction.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 tracking-tight">{transaction.title}</h4>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{transaction.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${transaction.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
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

const HabitCaptureModal = ({ onClose, onSave }: { onClose: () => void, onSave: (h: Partial<Habit>) => void }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Daily');

  return (
    <div className="absolute inset-0 bg-white z-[150] flex flex-col">
      <div className="p-6 flex justify-between items-center">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Rhythm</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-8 pt-8">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">What do you want to build?</label>
        <input 
          autoFocus
          type="text" 
          placeholder="Exercise, Meditation, etc."
          className="w-full text-4xl font-bold outline-none border-b-2 border-gray-100 pb-4 placeholder:text-gray-100"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="mt-12 space-y-6">
           <div className="flex items-center gap-4 text-gray-400">
             <Clock size={20} />
             <div className="flex-1">
               <span className="text-[10px] font-bold uppercase tracking-widest block mb-2">Frequency</span>
               <div className="flex gap-2">
                 {['Daily', '3x Week', 'Weekly'].map(f => (
                   <button 
                    key={f}
                    onClick={() => setGoal(f)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${goal === f ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="p-8">
        <button 
          onClick={() => { onSave({ name, meta: goal }); onClose(); }}
          disabled={!name}
          className="w-full bg-black text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-20"
        >
          Create Habit <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

const FinanceCaptureModal = ({ onClose, goals, initialGoalId }: { onClose: () => void, goals: FinanceGoal[], initialGoalId: string | null }) => {
  const [amount, setAmount] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(initialGoalId);

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
              <input 
                type="number" 
                autoFocus 
                placeholder="0" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-48 bg-transparent outline-none border-none text-center placeholder:text-slate-100" 
              />
            </div>
          </div>

          <div className="mb-10">
            <p className="text-[10px] font-black text-slate-300 mb-4 uppercase tracking-[0.2em]">Growth Destination</p>
            <div className="grid grid-cols-2 gap-3">
              {goals.map((goal) => (
                <button 
                  key={goal.id} 
                  onClick={() => setSelectedGoal(goal.id)} 
                  className={`p-5 rounded-3xl border-2 text-[11px] font-black transition-all flex items-center justify-between ${selectedGoal === goal.id ? 'border-black bg-black text-white shadow-lg' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                >
                  {goal.name}
                  {selectedGoal === goal.id && <Check size={14} />}
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

const CaptureModal = ({ onClose, onSave }: { onClose: () => void, onSave: (title: string, body: string, category: string) => void }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Idea');

  const categories = ['Idea', 'Meeting', 'Personal', 'Urgent'];

  return (
    <div className="absolute inset-0 bg-white z-[120] flex flex-col">
      <div className="p-6 flex justify-between items-center border-b border-gray-50">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Note</span>
        <button 
          onClick={() => { onSave(title || 'Untitled Note', body, category); onClose(); }} 
          disabled={!body}
          className="text-xs font-bold text-black disabled:opacity-20 uppercase tracking-widest px-4 py-2"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8">
        <input 
          autoFocus 
          placeholder="Title" 
          className="w-full text-3xl font-bold border-none outline-none mb-4 placeholder:text-gray-200" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
        
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar py-1">
          <Tag size={14} className="text-gray-300 shrink-0" />
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap
                ${category === cat ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        <textarea 
          placeholder="Start writing..." 
          className="w-full h-full text-lg font-medium border-none outline-none resize-none bg-transparent leading-relaxed" 
          value={body} 
          onChange={(e) => setBody(e.target.value)} 
        />
      </div>

      <div className="p-6 bg-gray-50 flex items-center gap-4">
        <div className="p-2 bg-white rounded-lg border border-gray-100">
          <FileText size={18} className="text-gray-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saved to</p>
          <p className="text-xs font-bold text-black">My System / Notes</p>
        </div>
      </div>
    </div>
  );
};


// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [goals] = useState<FinanceGoal[]>(INITIAL_GOALS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [zapInput, setZapInput] = useState('');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [showHabitCapture, setShowHabitCapture] = useState(false);
  const [showFinanceCapture, setShowFinanceCapture] = useState(false);
  const [financeInitialGoalId, setFinanceInitialGoalId] = useState<string | null>(null);



  
  const activePage = activePageId ? pages.find(p => p.id === activePageId) : null;

  const handleQuickNote = (title: string, body: string, category: string) => {
    const newPage: Page = {
      id: Date.now().toString(),
      title,
      icon: 'ðŸ““',
      category: 'note',
      updatedAt: 'Just now',
      blocks: [
        { id: 'b-title', type: 'heading', content: title },
        { id: 'b-text', type: 'text', content: body }
      ]
    };
    setPages(prev => [newPage, ...prev]);
  };

  const handleHabitCapture = (h: Partial<Habit>) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: h.name || 'Untitled Habit',
      meta: h.meta || 'Daily',
      color: 'bg-black',
      data: [0,0,0,0,0,0,0],
      monthly: 0,
      yearly: 0
    };
    setHabits(prev => [newHabit, ...prev]);
  };

  const openFinanceAdd = (goalId?: string) => {
    setFinanceInitialGoalId(goalId || null);
    setShowFinanceCapture(true);
  };

  const handleMainPlusClick = () => {
    if (view === 'finance') openFinanceAdd();
    else if (view === 'habits') setShowHabitCapture(true);
    else setShowCapture(true);
  };

  const handleZapCapture = () => {
    const trimmed = zapInput.trim();
    if (!trimmed) return;
    const newPage: Page = {
      id: Date.now().toString(),
      title: trimmed,
      icon: 'âš¡',
      category: 'unprocessed',
      updatedAt: 'Just now',
      blocks: [
        { id: 'b-title', type: 'heading', content: trimmed },
        { id: 'b-text', type: 'text', content: '' }
      ]
    };
    setPages(prev => [newPage, ...prev]);
    setZapInput('');
  };

  const renderContent = () => {
    if (view === 'page_detail' && activePage) {
      return (
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="p-4 flex items-center gap-4 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
            <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20}/></button>
          </div>
          <div className="px-6">
            <h1 className="text-5xl mb-6">{activePage.icon}</h1>
            <h2 className="text-3xl font-bold mb-8 leading-tight">{activePage.title}</h2>
            <div className="space-y-6">
              {activePage.blocks.map(block => (
                <div key={block.id} className="text-lg text-gray-800 leading-relaxed">
                  {block.type === 'heading' ? <h3 className="text-xl font-bold mt-4 mb-2">{block.content}</h3> : <p>{block.content}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    const focusView = (
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        <Header title="Focus" subtitle="Tuesday, Oct 24" rightAction={<div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><Sun size={18} /></div>} />
        <div className="px-6 mt-2">
          <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Today</h3>
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  {pages.find(p => p.id === 'daily')!.blocks.filter(b => b.type === 'todo').map(b => (
                     <div key={b.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                        <div className="w-5 h-5 rounded border border-gray-300"></div>
                        <span className="text-[15px] font-medium">{b.content.text}</span>
                     </div>
                  ))}
              </div>
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">My System</h3>
          <div className="space-y-3">
            {pages.filter(p => p.id !== 'daily').map(page => (
              <button key={page.id} onClick={() => { setActivePageId(page.id); setView('page_detail'); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-left border border-transparent hover:border-gray-100 transition-all">
                <span className="text-2xl">{page.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-black text-[15px]">{page.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{page.blocks.length} blocks ƒ?› {page.updatedAt}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    switch (view) {
      case 'home': {
        const activityDots = [
          1, 1, 0, 1, 0, 1, 1,
          0, 1, 1, 0, 1, 0, 1,
          1, 0, 1, 1, 0, 1, 0,
          1, 1, 0, 1, 1, 0, 1
        ];

        return (
          <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
            <Header title="Home" subtitle="Tuesday, Oct 24" rightAction={<div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><Sun size={18} /></div>} />

            <div className="px-6 mt-2 space-y-8">
              <div className="mt-4">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Zap size={16} className="text-gray-500" />
                  <input
                    value={zapInput}
                    onChange={(e) => setZapInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleZapCapture();
                      }
                    }}
                    placeholder="Zap Capture"
                    className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleZapCapture}
                    className="rounded-full bg-black p-2 text-white hover:bg-gray-800 transition-colors"
                    aria-label="Add capture"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black p-5 text-white shadow-sm">
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/60">
                    <span>Streak</span>
                    <Flame size={16} className="text-white" />
                  </div>
                  <div className="mt-6 text-2xl font-bold">14 Day Streak</div>
                </div>
                <div className="rounded-2xl bg-gray-100 p-5 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-gray-400">System Activity</div>
                  <div className="mt-4 grid grid-cols-7 gap-1">
                    {activityDots.map((active, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full ${active ? 'bg-gray-500' : 'bg-gray-300/60'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-5 text-white shadow-sm">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
                  <Sparkles size={14} />
                  Resurfacing
                </div>
                <div className="mt-3 text-lg font-semibold">
                  Core Principle: Simplicity is the ultimate sophistication.
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Queue</h3>
                <div className="space-y-3">
                  {pages.filter(p => p.id !== 'daily').map(page => (
                    <button key={page.id} onClick={() => { setActivePageId(page.id); setView('page_detail'); }} className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-left border border-transparent hover:border-gray-100 transition-all">
                      <span className="text-2xl">{page.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {page.category === 'unprocessed' && (
                            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                          )}
                          <h4 className="font-semibold text-black text-[15px]">{page.title}</h4>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{page.blocks.length} blocks | {page.category || 'General'} | {page.updatedAt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'tasks':
        return focusView;
      case 'habits':
        return <HabitView habits={habits} />;
      case 'finance':
        return (
          <FinanceView
            onGoalContribution={(goal) => openFinanceAdd(goal.id)}
          />
        );
      default:
        return focusView;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 p-4">
      <div className="w-[390px] h-[844px] bg-white rounded-[60px] shadow-2xl overflow-hidden border-[12px] border-black relative flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-40 bg-black rounded-b-3xl z-[110]" />
        
        {renderContent()}

        {view !== 'page_detail' && (
          <>
            <button 
              onClick={handleMainPlusClick}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-xl z-[100] active:scale-95 transition-transform"
            >
              <Plus size={32} strokeWidth={2.5} />
            </button>

            <div className="absolute bottom-6 left-6 right-6 h-16 bg-white border border-gray-100 rounded-full shadow-lg flex items-center justify-around px-4 z-[90]">
              <button onClick={() => setView('home')} className={view === 'home' ? 'text-black' : 'text-gray-300'}><Home size={24} /></button>
              <button onClick={() => setView('tasks')} className={view === 'tasks' ? 'text-black' : 'text-gray-300'}><CheckSquare size={24} /></button>
              <div className="w-12" />
              <button onClick={() => setView('habits')} className={view === 'habits' ? 'text-black' : 'text-gray-300'}><Activity size={24} /></button>
              <button onClick={() => setView('finance')} className={view === 'finance' ? 'text-black' : 'text-gray-300'}><CreditCard size={24} /></button>
            </div>
          </>
        )}

        {showCapture && <CaptureModal onClose={() => setShowCapture(false)} onSave={handleQuickNote} />}
        {showHabitCapture && <HabitCaptureModal onClose={() => setShowHabitCapture(false)} onSave={handleHabitCapture} />}
        {showFinanceCapture && <FinanceCaptureModal onClose={() => setShowFinanceCapture(false)} goals={goals} initialGoalId={financeInitialGoalId} />}
        
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-200 rounded-full z-[110]" />
      </div>
    </div>
  );
}
