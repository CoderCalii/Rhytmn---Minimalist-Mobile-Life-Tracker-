import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDownLeft, ArrowUpRight, Calendar, Check, MessageSquare, Tag, Target, Wallet, X } from 'lucide-react';
import type { FinanceAccount, FinanceGoal } from '../../types';
import { sanitizeText } from '../../utils/sanitize';
import { validateAmount } from './utils/validateFinance';
import { supabase } from '../../lib/supabase';
import { createFinanceEntry } from '../../lib/financeEntries';
import { useAuth } from '../../hooks/useAuth';

interface FinanceCaptureModalProps {
  onClose: () => void;
  onSaved?: () => void;
  accounts?: FinanceAccount[];
  goals?: FinanceGoal[];
  initialGoalId?: string | null;
}

type TransactionType = 'income' | 'expense' | 'goal';
type GoalFlow = 'contribution' | 'withdrawal';

interface FinanceAccountRow {
  id: string;
  name: string | null;
  balance: number | string | null;
  color: string | null;
  last_four: string | null;
}

interface FinanceGoalRow {
  id: string;
  name: string | null;
  target: number | string | null;
  current: number | string | null;
  color: string | null;
}

const FinanceCaptureModal = ({
  onClose,
  onSaved,
  accounts: accountsProp,
  goals: goalsProp,
  initialGoalId = null
}: FinanceCaptureModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [goalFlow, setGoalFlow] = useState<GoalFlow>('contribution');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(initialGoalId);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<FinanceAccount[]>(accountsProp ?? []);
  const [goals, setGoals] = useState<FinanceGoal[]>(goalsProp ?? []);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(false);

  const transactionTypes: Array<{
    id: TransactionType;
    label: string;
    icon: ReactNode;
    color: string;
    categories: string[];
  }> = [
    { id: 'income', label: 'Income', icon: <ArrowDownLeft size={14} />, color: 'text-emerald-500', categories: ['Salary', 'Gift', 'Investment', 'Refund'] },
    { id: 'expense', label: 'Expense', icon: <ArrowUpRight size={14} />, color: 'text-rose-500', categories: ['Food', 'Transport', 'Shopping', 'Bills'] },
    { id: 'goal', label: 'Goal', icon: <Target size={14} />, color: 'text-purple-600', categories: [] },
  ];

  const currentTypeData = transactionTypes.find(t => t.id === type) ?? transactionTypes[0];

  useEffect(() => {
    if (accountsProp && accountsProp.length) {
      setAccounts(accountsProp);
    }
  }, [accountsProp]);

  useEffect(() => {
    if (goalsProp && goalsProp.length) {
      setGoals(goalsProp);
    }
  }, [goalsProp]);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setGoals([]);
      return;
    }

    let isMounted = true;

    if (!accountsProp || accountsProp.length === 0) {
      setAccountsLoading(true);
      supabase
        .from('finance_accounts')
        .select('id, name, balance, color, last_four')
        .order('created_at', { ascending: false })
        .then(({ data, error: fetchError }) => {
          if (!isMounted) return;
          if (!fetchError) {
            const rows = (data ?? []) as FinanceAccountRow[];
            setAccounts(rows.map((row) => ({
              id: row.id,
              name: row.name ?? 'Account',
              balance: Number(row.balance) || 0,
              color: row.color ?? 'bg-black',
              lastFour: row.last_four ?? '0000'
            })));
          }
          setAccountsLoading(false);
        });
    }

    if (!goalsProp || goalsProp.length === 0) {
      setGoalsLoading(true);
      supabase
        .from('finance_goals')
        .select('id, name, target, current, color')
        .order('created_at', { ascending: false })
        .then(({ data, error: fetchError }) => {
          if (!isMounted) return;
          if (!fetchError) {
            const rows = (data ?? []) as FinanceGoalRow[];
            setGoals(rows.map((row) => ({
              id: row.id,
              name: row.name ?? 'Goal',
              target: Number(row.target) || 0,
              current: Number(row.current) || 0,
              color: row.color ?? 'bg-purple-50'
            })));
          }
          setGoalsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [user, accountsProp, goalsProp]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (!selectedGoal && goals.length > 0) {
      setSelectedGoal(initialGoalId ?? goals[0].id);
    }
  }, [goals, selectedGoal, initialGoalId]);

  const handleConfirm = async () => {
    if (!user) {
      setError('Sign in to save entries.');
      return;
    }
    if (amount === null) {
      setError('Enter an amount.');
      return;
    }
    try {
      validateAmount(amount);
    } catch {
      setError('Enter a valid amount.');
      return;
    }

    const baseAmount = Math.abs(amount);
    let entryAmount = baseAmount;
    let entryCategory = '';
    let entryAccountId: string | null = null;

    const safeNote = sanitizeText(note).trim();

    if (type === 'income' || type === 'expense') {
      if (!selectedAccountId) {
        setError('Choose an account.');
        return;
      }
      const account = accounts.find((item) => item.id === selectedAccountId);
      if (!account) {
        setError('Account not found.');
        return;
      }

      entryAmount = type === 'income' ? baseAmount : -baseAmount;
      entryCategory = sanitizeText(category).trim() || 'General';
      entryAccountId = selectedAccountId;

      setIsSaving(true);
      setError(null);

      const { error: insertError } = await createFinanceEntry({
        amount: entryAmount,
        category: entryCategory,
        note: safeNote || null,
        account_id: entryAccountId
      });

      if (insertError) {
        setIsSaving(false);
        setError(insertError);
        return;
      }

      const nextBalance = account.balance + entryAmount;
      await supabase
        .from('finance_accounts')
        .update({ balance: nextBalance })
        .eq('id', account.id);

      setIsSaving(false);
      onSaved?.();
      onClose();
      return;
    }

    if (type === 'goal') {
      if (!selectedGoal) {
        setError('Choose a goal.');
        return;
      }
      const goal = goals.find((item) => item.id === selectedGoal);
      if (!goal) {
        setError('Goal not found.');
        return;
      }

      const signedGoalAmount = goalFlow === 'withdrawal' ? -baseAmount : baseAmount;
      const nextCurrent = goal.current + signedGoalAmount;

      if (nextCurrent < 0) {
        setError('Cannot withdraw more than the goal balance.');
        return;
      }

      entryAmount = signedGoalAmount;
      entryCategory = sanitizeText(goal.name).trim() || 'Goal';

      setIsSaving(true);
      setError(null);

      const { error: insertError } = await createFinanceEntry({
        amount: entryAmount,
        category: entryCategory,
        note: safeNote || null,
        account_id: null
      });

      if (insertError) {
        setIsSaving(false);
        setError(insertError);
        return;
      }

      await supabase
        .from('finance_goals')
        .update({ current: nextCurrent })
        .eq('id', goal.id);

      setIsSaving(false);
      onSaved?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-10 sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Today, 12:45 PM</span>
            </div>
            <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="mb-8 p-1 bg-slate-100 rounded-[2rem] flex items-center">
            {transactionTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setType(t.id);
                  setCategory('');
                }}
                className={`flex-1 py-3.5 rounded-[1.7rem] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                  type === t.id ? 'bg-white shadow-sm text-black scale-[1.02]' : 'text-slate-400'
                }`}
              >
                <span className={type === t.id ? t.color : ''}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center text-7xl font-black tracking-tighter">
              <span className={`text-3xl mr-1 self-start mt-4 opacity-20 ${currentTypeData.color}`}>$</span>
              <input 
                type="number" 
                autoFocus 
                placeholder="0" 
                value={amount ?? ''} 
                onChange={(e) => {
                  const next = e.target.value;
                  setAmount(next === '' ? null : Number(next));
                }} 
                className="w-48 bg-transparent outline-none border-none text-center placeholder:text-slate-100" 
              />
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {type !== 'goal' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Tag size={10} /> Category
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentTypeData.categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(sanitizeText(cat))}
                      className={`px-4 py-2 rounded-2xl text-[10px] font-bold transition-all ${
                        category === cat 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {type !== 'goal' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Wallet size={10} /> Account
                </p>
                {accountsLoading ? (
                  <div className="text-[10px] font-bold text-slate-400">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                  <div className="text-[10px] font-bold text-slate-400">No accounts found.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => setSelectedAccountId(account.id)}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-bold transition-all ${
                          selectedAccountId === account.id
                            ? 'bg-black text-white shadow-md'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {account.name} - {account.lastFour}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {type === 'goal' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target size={10} className="text-purple-600" /> Destination
                  </p>
                  <div className="flex items-center gap-1 rounded-full bg-purple-50 p-1">
                    <button
                      onClick={() => setGoalFlow('contribution')}
                      className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        goalFlow === 'contribution' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-300'
                      }`}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setGoalFlow('withdrawal')}
                      className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        goalFlow === 'withdrawal' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-300'
                      }`}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {goalsLoading ? (
                    <div className="col-span-2 py-4 px-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-400 text-center italic">
                      Loading goals...
                    </div>
                  ) : goals.length > 0 ? goals.map((goal) => (
                    <button 
                      key={goal.id} 
                      onClick={() => setSelectedGoal(goal.id)} 
                      className={`p-4 rounded-2xl border-2 text-[10px] font-black transition-all flex items-center justify-between ${
                        selectedGoal === goal.id ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-50 bg-slate-50 text-slate-400'
                      }`}
                    >
                      <span className="truncate">{goal.name}</span>
                      {selectedGoal === goal.id && <Check size={12} />}
                    </button>
                  )) : (
                    <div className="col-span-2 py-4 px-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-400 text-center italic">
                      No active goals found
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <button 
                onClick={() => setShowNotes(!showNotes)}
                className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-slate-500"
              >
                <MessageSquare size={10} /> {showNotes ? 'Remove Note' : 'Add Note'}
              </button>
              {showNotes && (
                <textarea 
                  placeholder="What was this for?"
                  className="w-full mt-3 p-4 bg-slate-50 rounded-3xl text-sm outline-none border-none placeholder:text-slate-300 min-h-[80px] animate-in zoom-in-95 duration-200"
                  value={note}
                  onChange={(event) => setNote(sanitizeText(event.target.value))}
                />
              )}
            </div>
          </div>

          <button 
            onClick={handleConfirm}
            disabled={isSaving || !user}
            className={`w-full py-5 rounded-[2rem] font-black text-base active:scale-95 transition-all shadow-xl disabled:opacity-60 disabled:cursor-not-allowed ${
              type === 'income' ? 'bg-emerald-500 text-white shadow-emerald-200/50' :
              type === 'expense' ? 'bg-black text-white shadow-slate-200/50' :
              'bg-purple-600 text-white shadow-purple-200/50'
            }`}
          >
            {isSaving ? 'Saving...' : 'Confirm Entry'}
          </button>
          {error && <p className="mt-3 text-xs font-semibold text-rose-500 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default FinanceCaptureModal;
