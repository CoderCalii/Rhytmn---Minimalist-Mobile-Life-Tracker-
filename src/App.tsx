import React, { useState } from 'react';
import { 
  Home, 
  CheckSquare, 
  Activity, 
  CreditCard, 
  Plus, 
  MoreHorizontal, 
  ChevronLeft, 
  CheckCircle2,
  Zap,
  Coffee,
  Sun,
  Sparkles,
  X,
  ArrowRight,
  Target,
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Calendar,
  Flame,
  Clock,
  FileText,
  Tag
} from 'lucide-react';

// --- Types ---

type ViewState = 'home' | 'tasks' | 'habits' | 'finance' | 'page_detail';
type TimeScale = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
type TransactionType = 'expense' | 'income' | 'transfer' | 'goals';

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
  title: string;
  target: number;
  current: number;
  deadline: string;
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

interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'spending' | 'savings' | 'income';
  color: string;
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
    icon: 'ðŸ§ ',
    updatedAt: '2h ago',
    blocks: [
      { id: 'b4', type: 'heading', content: 'Core Principles' },
      { id: 'b5', type: 'text', content: 'Simplicity is the ultimate sophistication.' },
    ]
  },
];

const INITIAL_GOALS: FinanceGoal[] = [
  { id: 'g1', title: '100k Savings Goal', target: 100000, current: 84200, deadline: 'Dec 2026' },
  { id: 'g2', title: 'New Car Fund', target: 25000, current: 12000, deadline: 'June 2026' }
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

const FinanceView = ({ onAddClick, goals }: { onAddClick: (goalId?: string) => void, goals: FinanceGoal[] }) => {
  const [activeAccountIdx, setActiveAccountIdx] = useState(0);

  const accounts: Account[] = [
    { id: '1', name: 'Spending', balance: 2450.50, type: 'spending', color: 'bg-black' },
    { id: '2', name: 'Savings', balance: 84200.00, type: 'savings', color: 'bg-blue-600' },
    { id: '3', name: 'Income Hub', balance: 12000.00, type: 'income', color: 'bg-emerald-600' }
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-40">
      <Header title="Balance" subtitle="Contextual Wealth" />
      
      <div className="px-6 mt-4">
        <div className="relative h-56 w-full">
          {accounts.map((acc, idx) => {
            const isActive = idx === activeAccountIdx;
            return (
              <div 
                key={acc.id}
                onClick={() => setActiveAccountIdx(idx)}
                className={`absolute inset-0 p-8 rounded-[32px] text-white transition-all duration-500 cursor-pointer shadow-xl overflow-hidden
                  ${acc.color} 
                  ${isActive ? 'z-20 scale-100 opacity-100 translate-y-0' : 'z-10 scale-90 opacity-40 translate-y-4'}
                `}
                style={{ transform: isActive ? 'none' : `translateX(${(idx - activeAccountIdx) * 30}px) scale(0.92)` }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{acc.name}</span>
                  {acc.type === 'savings' ? <PiggyBank size={20} /> : <Wallet size={20} />}
                </div>
                <h2 className="text-4xl font-bold tracking-tighter mt-8">
                  ${acc.balance.toLocaleString()}
                </h2>
                <div className="mt-auto pt-8 flex justify-between items-center">
                    <div className="flex gap-2">
                      <div className="w-8 h-5 bg-white/20 rounded-sm"></div>
                      <span className="text-[10px] font-mono opacity-50">**** 8821</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onAddClick(); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                      <Plus size={16} />
                    </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {accounts.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === activeAccountIdx ? 'w-4 bg-black' : 'w-1 bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="px-6 mt-12">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Financial Goals</h3>
          <button className="text-[10px] font-bold text-black border-b border-black">NEW GOAL</button>
        </div>

        <div className="space-y-4">
          {goals.map(goal => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <div key={goal.id} className="p-5 bg-gray-50 rounded-[24px] border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-sm">{goal.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Deadline: {goal.deadline}</p>
                  </div>
                  <Target size={16} className="text-gray-300" />
                </div>
                
                <div className="flex justify-between text-xs mb-2 font-mono">
                  <span className="font-bold">${goal.current.toLocaleString()}</span>
                  <span className="text-gray-400">${goal.target.toLocaleString()}</span>
                </div>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-black rounded-full transition-all duration-1000" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                
                <button 
                  onClick={() => onAddClick(goal.id)}
                  className="mt-4 w-full py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-wider active:bg-black active:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={12} /> Add Money to Goal
                </button>
              </div>
            );
          })}
        </div>
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
  const [amount, setAmount] = useState('0');
  const [type, setType] = useState<TransactionType>(initialGoalId ? 'goals' : 'expense');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(initialGoalId);

  const tabs: TransactionType[] = ['expense', 'income', 'transfer', 'goals'];

  return (
    <div className="absolute inset-0 bg-white z-[150] flex flex-col">
      <div className="p-6 flex justify-between items-center">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {type === 'goals' ? 'Goal Contribution' : 'Log Transaction'}
        </span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 mb-8">
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
            {tabs.map(t => (
              <button 
                key={t}
                onClick={() => {
                  setType(t);
                  if (t === 'goals' && !selectedGoalId) setSelectedGoalId(goals[0]?.id);
                }}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all 
                  ${type === t ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-8 text-center py-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-bold text-gray-300">$</span>
            <input 
              autoFocus 
              type="number" 
              className="text-7xl font-bold outline-none w-full max-w-[280px] text-center bg-transparent"
              value={amount === '0' ? '' : amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {type === 'goals' && (
          <div className="px-8 mt-8 space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Select Target Goal</label>
            <div className="grid grid-cols-1 gap-3">
              {goals.map(goal => (
                <button 
                  key={goal.id}
                  onClick={() => setSelectedGoalId(goal.id)}
                  className={`w-full p-5 rounded-[24px] border text-left transition-all flex items-center justify-between
                    ${selectedGoalId === goal.id ? 'bg-black border-black text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-900'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <Target size={20} className={selectedGoalId === goal.id ? 'text-white' : 'text-gray-400'} />
                    <span className="text-sm font-bold block">{goal.title}</span>
                  </div>
                  {selectedGoalId === goal.id && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white">
        <button 
          onClick={onClose}
          className="w-full bg-black text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
        >
          Confirm <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

const CaptureModal = ({
  onClose,
  onSave,
  categories,
  onAddCategory,
}: {
  onClose: () => void,
  onSave: (title: string, body: string, category: string) => void,
  categories: string[],
  onAddCategory: (category: string) => void,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Idea');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const commitNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingNew(false);
  };

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
        
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
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
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-gray-50 text-gray-400 hover:text-black"
          >
            <Plus size={12} />
            Add Tag
          </button>
        </div>

        {isAddingNew && (
          <div className="mb-6 flex items-center gap-2">
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitNewCategory();
                }
                if (e.key === 'Escape') {
                  setIsAddingNew(false);
                  setNewCategoryName('');
                }
              }}
              placeholder="NEW TAG"
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-black"
            />
            <button
              onClick={commitNewCategory}
              className="rounded-full bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white"
            >
              Confirm
            </button>
          </div>
        )}

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
  const [goals, setGoals] = useState<FinanceGoal[]>(INITIAL_GOALS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [categories, setCategories] = useState<string[]>(['Idea', 'Meeting', 'Personal', 'Urgent']);
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
      category,
      updatedAt: 'Just now',
      blocks: [
        { id: 'b-title', type: 'heading', content: title },
        { id: 'b-text', type: 'text', content: body }
      ]
    };
    setPages(prev => [newPage, ...prev]);
  };
  const handleAddCategory = (newCategory: string) => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    setCategories(prev => {
      if (prev.some(cat => cat.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return [...prev, trimmed];
    });
  };

  const handleZapCapture = () => {
    const trimmed = zapInput.trim();
    if (!trimmed) return;
    const newPage: Page = {
      id: Date.now().toString(),
      title: trimmed,
      icon: '⚡',
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
    switch (view) {
      case 'habits': return <HabitView habits={habits} />;
      case 'finance': return <FinanceView onAddClick={openFinanceAdd} goals={goals} />;
      default: {
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

        {showCapture && (
          <CaptureModal
            onClose={() => setShowCapture(false)}
            onSave={handleQuickNote}
            categories={categories}
            onAddCategory={handleAddCategory}
          />
        )}

        {showHabitCapture && <HabitCaptureModal onClose={() => setShowHabitCapture(false)} onSave={handleHabitCapture} />}
        {showFinanceCapture && <FinanceCaptureModal onClose={() => setShowFinanceCapture(false)} goals={goals} initialGoalId={financeInitialGoalId} />}
        
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-200 rounded-full z-[110]" />
      </div>
    </div>
  );
}








