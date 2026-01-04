import { useEffect, useMemo, useState } from 'react';
import { Car, ChevronDown, ChevronUp, Plus, TrendingUp, Tv, Utensils, Wallet, Zap } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { FinanceAccount, FinanceGoal, FinanceTransaction } from '../../types';
import { sanitizeText } from '../../utils/sanitize';
import { validateAmount } from './utils/validateFinance';
import { AccountCard } from './components/AccountCard';
import { GoalTracker } from './components/GoalTracker';

interface FinanceViewProps {
  refreshToken?: number;
}

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

interface FinanceEntryRow {
  id: string;
  amount: number | string;
  category?: string | null;
  note?: string | null;
  account_id?: string | null;
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

const getAccountTextClass = (color: string) => {
  if (color.includes('black') || color.includes('blue') || color.includes('emerald') || color.includes('slate')) {
    return 'text-white';
  }
  return 'text-black';
};

const accountColors = ['bg-black', 'bg-blue-600', 'bg-emerald-500', 'bg-slate-900', 'bg-rose-500'];
const goalColors = ['bg-orange-50', 'bg-purple-50', 'bg-blue-50', 'bg-rose-50', 'bg-emerald-50'];

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

const FinanceView = ({ refreshToken = 0 }: FinanceViewProps) => {
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [showAllGoals, setShowAllGoals] = useState(false);

  const [accountsLoading, setAccountsLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', balance: '', color: accountColors[0], lastFour: '' });
  const [accountSaveError, setAccountSaveError] = useState<string | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: '', target: '', current: '', color: goalColors[0] });
  const [goalSaveError, setGoalSaveError] = useState<string | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);

  const fetchAccounts = async () => {
    if (!user) return;
    setAccountsLoading(true);
    setAccountsError(null);

    const { data, error } = await supabase
      .from('finance_accounts')
      .select('id, name, balance, color, last_four')
      .order('created_at', { ascending: false });

    if (error) {
      setAccountsError('Failed to load accounts.');
      setAccounts([]);
      setAccountsLoading(false);
      return;
    }

    const rows = (data ?? []) as FinanceAccountRow[];
    setAccounts(rows.map((row) => ({
      id: row.id,
      name: row.name ?? 'Account',
      balance: Number(row.balance) || 0,
      color: row.color ?? accountColors[0],
      lastFour: row.last_four ?? '0000'
    })));
    setAccountsLoading(false);
  };

  const fetchGoals = async () => {
    if (!user) return;
    setGoalsLoading(true);
    setGoalsError(null);

    const { data, error } = await supabase
      .from('finance_goals')
      .select('id, name, target, current, color')
      .order('created_at', { ascending: false });

    if (error) {
      setGoalsError('Failed to load goals.');
      setGoals([]);
      setGoalsLoading(false);
      return;
    }

    const rows = (data ?? []) as FinanceGoalRow[];
    setGoals(rows.map((row) => ({
      id: row.id,
      name: row.name ?? 'Goal',
      target: Number(row.target) || 0,
      current: Number(row.current) || 0,
      color: row.color ?? goalColors[0]
    })));
    setGoalsLoading(false);
  };

  const fetchEntries = async () => {
    if (!user) return;
    setEntriesLoading(true);
    setEntriesError(null);

    const { data, error } = await supabase
      .from('finance_entries')
      .select('id, amount, category, note, account_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setEntriesError('Failed to load entries.');
      setTransactions([]);
      setEntriesLoading(false);
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
        icon: getTransactionIcon(category, type),
        accountId: entry.account_id ?? null
      };
    });

    setTransactions(mapped);
    setEntriesLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setGoals([]);
      setTransactions([]);
      setAccountsLoading(false);
      setGoalsLoading(false);
      setEntriesLoading(false);
      return;
    }

    fetchAccounts();
    fetchGoals();
    fetchEntries();
  }, [user, refreshToken]);

  useEffect(() => {
    if (activeAccountIndex >= accounts.length) {
      setActiveAccountIndex(0);
    }
  }, [accounts.length, activeAccountIndex]);

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

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountForm({ name: '', balance: '', color: accountColors[0], lastFour: '' });
    setAccountSaveError(null);
    setShowAccountModal(true);
  };

  const openEditAccount = (account: FinanceAccount) => {
    setEditingAccount(account);
    setAccountForm({
      name: account.name,
      balance: account.balance.toString(),
      color: account.color,
      lastFour: account.lastFour
    });
    setAccountSaveError(null);
    setShowAccountModal(true);
  };

  const saveAccount = async () => {
    if (!user) {
      setAccountSaveError('Sign in to save accounts.');
      return;
    }
    const safeName = sanitizeText(accountForm.name).trim();
    if (!safeName) {
      setAccountSaveError('Enter an account name.');
      return;
    }

    setAccountSaving(true);
    setAccountSaveError(null);

    if (editingAccount) {
      const { error } = await supabase
        .from('finance_accounts')
        .update({ name: safeName, color: accountForm.color })
        .eq('id', editingAccount.id);

      setAccountSaving(false);

      if (error) {
        setAccountSaveError('Failed to update account.');
        return;
      }

      setShowAccountModal(false);
      fetchAccounts();
      return;
    }

    const balanceValue = Number(accountForm.balance);
    try {
      validateAmount(balanceValue);
    } catch {
      setAccountSaving(false);
      setAccountSaveError('Enter a valid starting balance.');
      return;
    }

    const safeLastFour = accountForm.lastFour.replace(/\D/g, '').slice(-4);
    if (safeLastFour.length !== 4) {
      setAccountSaving(false);
      setAccountSaveError('Enter the last 4 digits.');
      return;
    }

    const { error } = await supabase
      .from('finance_accounts')
      .insert({
        user_id: user.id,
        name: safeName,
        balance: balanceValue,
        color: accountForm.color,
        last_four: safeLastFour
      });

    setAccountSaving(false);

    if (error) {
      setAccountSaveError('Failed to create account.');
      return;
    }

    setShowAccountModal(false);
    fetchAccounts();
  };

  const saveGoal = async () => {
    if (!user) {
      setGoalSaveError('Sign in to save goals.');
      return;
    }

    const safeName = sanitizeText(goalForm.name).trim();
    if (!safeName) {
      setGoalSaveError('Enter a goal name.');
      return;
    }

    const targetValue = Number(goalForm.target);
    const currentValue = goalForm.current === '' ? 0 : Number(goalForm.current);

    try {
      validateAmount(targetValue);
      validateAmount(currentValue);
    } catch {
      setGoalSaveError('Enter valid amounts.');
      return;
    }

    setGoalSaving(true);
    setGoalSaveError(null);

    const { error } = await supabase
      .from('finance_goals')
      .insert({
        user_id: user.id,
        name: safeName,
        target: targetValue,
        current: currentValue,
        color: goalForm.color
      });

    setGoalSaving(false);

    if (error) {
      setGoalSaveError('Failed to create goal.');
      return;
    }

    setShowGoalModal(false);
    setGoalForm({ name: '', target: '', current: '', color: goalColors[0] });
    fetchGoals();
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('finance_goals')
      .delete()
      .eq('id', goalId);

    if (!error) {
      fetchGoals();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-44 no-scrollbar">
      <FinanceHeader />
      
      <div className="px-6 max-w-lg mx-auto space-y-14">
        <section className="relative h-60 cursor-pointer mb-4" onClick={cycleAccount}>
          {authLoading || accountsLoading ? (
            <div className="absolute inset-0 rounded-[2.5rem] bg-gray-50 animate-pulse" />
          ) : !user ? (
            <div className="absolute inset-0 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-sm text-gray-400">
              Sign in to view accounts.
            </div>
          ) : accountsError ? (
            <div className="absolute inset-0 rounded-[2.5rem] bg-rose-50 flex items-center justify-center text-sm text-rose-500">
              {accountsError}
            </div>
          ) : accounts.length === 0 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openAddAccount();
              }}
              className="absolute inset-0 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-gray-400 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center">
                <Plus size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Add Account</span>
            </button>
          ) : (
            accounts.map((account, index) => (
              <AccountCard
                key={account.id}
                account={account}
                style={getCardStyle(index)}
                textClassName={getAccountTextClass(account.color)}
                isActive={index === activeAccountIndex}
                onEdit={openEditAccount}
              />
            ))
          )}
        </section>

        {user && accounts.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openAddAccount}
              className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-black"
            >
              Add Account
            </button>
          </div>
        )}

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

          {authLoading || goalsLoading ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Loading goals...</div>
          ) : !user ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Sign in to view goals.</div>
          ) : goalsError ? (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-500">{goalsError}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 transition-all duration-300">
              {displayedGoals.map((goal) => (
                <GoalTracker
                  key={goal.id}
                  goal={goal}
                  onDelete={deleteGoal}
                  showDelete={showAllGoals}
                />
              ))}
              {showAllGoals && (
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="col-span-2 flex flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all active:scale-95"
                >
                  <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Add New Goal</span>
                </button>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-xl font-black tracking-tight text-slate-900">Activity</h3>
            <button className="text-[11px] font-black text-slate-300 uppercase tracking-widest">History</button>
          </div>

          {authLoading || entriesLoading ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Loading entries...</div>
          ) : !user ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Sign in to view your activity.</div>
          ) : entriesError ? (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-500">{entriesError}</div>
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

      {showAccountModal && (
        <div className="fixed inset-0 z-[160] flex items-end justify-center px-4 pb-10 sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAccountModal(false)} />
          <div className="relative w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">{editingAccount ? 'Rename Account' : 'New Account'}</h2>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center"
              >
                X
              </button>
            </div>
            <div className="space-y-4">
              <input
                placeholder="Account name"
                value={accountForm.name}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, name: sanitizeText(event.target.value) }))}
                className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
              />
              {!editingAccount && (
                <input
                  placeholder="Starting balance"
                  type="number"
                  value={accountForm.balance}
                  onChange={(event) => setAccountForm((prev) => ({ ...prev, balance: event.target.value }))}
                  className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
                />
              )}
              {!editingAccount ? (
                <input
                  placeholder="Last 4 digits"
                  value={accountForm.lastFour}
                  onChange={(event) => setAccountForm((prev) => ({ ...prev, lastFour: event.target.value }))}
                  className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
                />
              ) : (
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Last four: {accountForm.lastFour}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {accountColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccountForm((prev) => ({ ...prev, color }))}
                    className={`h-8 w-8 rounded-full ${color} ${accountForm.color === color ? 'ring-2 ring-black' : ''}`}
                  />
                ))}
              </div>
              {accountSaveError && <p className="text-xs font-semibold text-rose-500">{accountSaveError}</p>}
            </div>
            <button
              type="button"
              onClick={saveAccount}
              disabled={accountSaving}
              className="mt-6 w-full rounded-2xl bg-black py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
            >
              {accountSaving ? 'Saving...' : (editingAccount ? 'Save Account' : 'Create Account')}
            </button>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 z-[160] flex items-end justify-center px-4 pb-10 sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowGoalModal(false)} />
          <div className="relative w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black">New Goal</h2>
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center"
              >
                X
              </button>
            </div>
            <div className="space-y-4">
              <input
                placeholder="Goal name"
                value={goalForm.name}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, name: sanitizeText(event.target.value) }))}
                className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
              />
              <input
                placeholder="Target amount"
                type="number"
                value={goalForm.target}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, target: event.target.value }))}
                className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
              />
              <input
                placeholder="Current amount (optional)"
                type="number"
                value={goalForm.current}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, current: event.target.value }))}
                className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
              />
              <div className="flex flex-wrap gap-2">
                {goalColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setGoalForm((prev) => ({ ...prev, color }))}
                    className={`h-8 w-8 rounded-full ${color} ${goalForm.color === color ? 'ring-2 ring-black' : ''}`}
                  />
                ))}
              </div>
              {goalSaveError && <p className="text-xs font-semibold text-rose-500">{goalSaveError}</p>}
            </div>
            <button
              type="button"
              onClick={saveGoal}
              disabled={goalSaving}
              className="mt-6 w-full rounded-2xl bg-black py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
            >
              {goalSaving ? 'Saving...' : 'Create Goal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
