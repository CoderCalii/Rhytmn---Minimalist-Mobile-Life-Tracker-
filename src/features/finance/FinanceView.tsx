import { useEffect, useMemo, useState } from 'react';
import { Car, ChevronDown, ChevronUp, Plus, TrendingUp, Tv, Utensils, Wallet, Zap } from 'lucide-react';
import { INITIAL_ACCOUNTS, INITIAL_GOALS } from '../../mockData';
import type { FinanceAccount, FinanceGoal, FinanceTransaction } from '../../types';
import BrandLogo from '../../components/BrandLogo';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface FinanceViewProps {
  accounts: FinanceAccount[];
  goals: FinanceGoal[];
  onAddGoal: () => void;
  refreshToken?: number;
}

interface FinanceEntryRow {
  id: string;
  amount: number | string;
  category?: string | null;
  note?: string | null;
  created_at?: string | null;
}

const formatEntryDate = (value?: string | null) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEntry = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfEntry.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getTransactionIcon = (category: string, type: FinanceTransaction['type']) => {
  if (type === 'income') return <TrendingUp size={16} />;
  const normalized = category.toLowerCase();
  if (normalized.includes('food') || normalized.includes('drink')) return <Utensils size={16} />;
  if (normalized.includes('transport') || normalized.includes('uber')) return <Car size={16} />;
  if (normalized.includes('entertainment') || normalized.includes('movie') || normalized.includes('tv')) return <Tv size={16} />;
  if (normalized.includes('tech') || normalized.includes('software')) return <Zap size={16} />;
  return <Wallet size={16} />;
};

const FinanceHeader = () => {
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="px-6 pt-12 pb-6 sticky top-0 bg-white/80 backdrop-blur-md z-[60]">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black">Portfolio</h1>
          <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{today}</p>
        </div>
        <BrandLogo className="h-9 w-9" />
      </div>
    </div>
  );
};

const FinanceView = ({
  accounts = INITIAL_ACCOUNTS,
  goals = INITIAL_GOALS,
  onAddGoal,
  refreshToken = 0
}: FinanceViewProps) => {
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [showAllGoals, setShowAllGoals] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    supabase
      .from('finance_entries')
      .select('id, amount, category, note, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (!isMounted) return;
        if (fetchError) {
          setError('Failed to load entries.');
          setTransactions([]);
          setLoading(false);
          return;
        }

        const entries = (data ?? []) as FinanceEntryRow[];
        const mapped = entries.map((entry) => {
          const rawAmount = Number(entry.amount);
          const amountValue = Number.isFinite(rawAmount) ? rawAmount : 0;
          const type: FinanceTransaction['type'] = amountValue >= 0 ? 'income' : 'expense';
          const category = entry.category?.trim() || 'General';
          const title = entry.note?.trim() || category;

          return {
            id: entry.id,
            title,
            category,
            amount: Math.abs(amountValue),
            type,
            date: formatEntryDate(entry.created_at),
            icon: getTransactionIcon(category, type)
          };
        });

        setTransactions(mapped);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, refreshToken]);

  const displayedGoals = useMemo(() => {
    return showAllGoals ? goals : goals.slice(0, 2);
  }, [goals, showAllGoals]);

  const cycleAccount = () => {
    if (accounts.length === 0) return;
    setActiveAccountIndex((prev) => (prev + 1) % accounts.length);
  };

  const getCardStyle = (index: number) => {
    const diff = (index - activeAccountIndex + accounts.length) % accounts.length;
    if (diff === 0) return { transform: 'translateY(0) scale(1)', zIndex: 30, opacity: 1 };
    if (diff === 1) return { transform: 'translateY(16px) scale(0.95)', zIndex: 20, opacity: 0.6 };
    return { transform: 'translateY(32px) scale(0.90)', zIndex: 10, opacity: 0.3 };
  };

  const groupedTransactions = useMemo(() => {
    return transactions.reduce<Record<string, FinanceTransaction[]>>((acc, transaction) => {
      if (!acc[transaction.date]) acc[transaction.date] = [];
      acc[transaction.date].push(transaction);
      return acc;
    }, {});
  }, [transactions]);

  return (
    <div className="flex-1 overflow-y-auto pb-44 no-scrollbar">
      <FinanceHeader />
      
      <div className="px-6 max-w-lg mx-auto space-y-14">
        <section className="relative h-60 cursor-pointer mb-4" onClick={cycleAccount}>
          {accounts.map((account, index) => (
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
            <button
              onClick={() => setShowAllGoals((prev) => !prev)}
              className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1"
            >
              {showAllGoals ? 'Hide Goals' : 'View All Goals'}
              <span className="text-slate-400">({goals.length})</span>
              {showAllGoals ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 transition-all duration-300">
            {displayedGoals.map((goal) => {
              const progress = Math.round((goal.current / goal.target) * 100);
              return (
                <div 
                  key={goal.id} 
                  className={`${goal.color} p-5 rounded-[2.5rem] border border-white/50 shadow-sm relative overflow-hidden group active:scale-95 transition-all`}
                >
                  <div className="relative z-10">
                    <div className="mb-6">
                      <div className="inline-flex px-3 py-1.5 rounded-full bg-white text-[11px] font-black shadow-sm text-slate-900">
                        {progress}%
                      </div>
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
            {showAllGoals && (
              <button
                onClick={onAddGoal}
                className="col-span-2 flex flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Add New Goal</span>
              </button>
            )}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-xl font-black tracking-tight text-slate-900">Activity</h3>
            <button className="text-[11px] font-black text-slate-300 uppercase tracking-widest">History</button>
          </div>

          {authLoading || loading ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Loading entries...</div>
          ) : !user ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Sign in to view your activity.</div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-500">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">No activity yet.</div>
          ) : (
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
          )}
        </section>
      </div>
    </div>
  );
};

export default FinanceView;
