import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { differenceInCalendarDays, endOfDay, startOfDay, startOfWeek } from 'date-fns';
import { Car, ChevronDown, ChevronUp, Plus, TrendingUp, Tv, Utensils, Wallet, Zap } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { supabase } from '../../lib/supabase';
import { listFinanceEntries, type FinanceEntryRow } from '../../lib/financeEntries';
import { useAuth } from '../../hooks/useAuth';
import type { FinanceAccount, FinanceGoal, FinanceTransaction } from '../../types';
import { sanitizeText } from '../../utils/sanitize';
import { formatCurrency } from '../../utils/formatters';
import { validateAmount } from './utils/validateFinance';
import { AccountCard } from './components/AccountCard';
import { GoalTracker } from './components/GoalTracker';
import ThisWeekSummary from './components/ThisWeekSummary';
import UpcomingBillsCard from './components/UpcomingBillsCard';
import SubscriptionsSummary from './components/SubscriptionsSummary';
import TopCategoriesSummary from './components/TopCategoriesSummary';
import BillsManagerModal, { type BillFormInput, type BillItem } from './components/BillsManagerModal';
import SubscriptionsManagerModal, { type SubscriptionFormInput, type SubscriptionItem } from './components/SubscriptionsManagerModal';

interface FinanceViewProps {
  refreshToken?: number;
  currencyCode?: 'USD' | 'PHP';
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

type RecurrenceCadence = 'weekly' | 'monthly' | 'yearly';

interface FinanceBillRow {
  id: string;
  name: string | null;
  amount: number | string | null;
  cadence: string | null;
  next_due_date: string | null;
  account_id: string | null;
  reminder_days: number | string | null;
  active: boolean | null;
}

interface FinanceSubscriptionRow {
  id: string;
  name: string | null;
  amount: number | string | null;
  cadence: string | null;
  next_due_date: string | null;
  account_id: string | null;
  reminder_days: number | string | null;
  active: boolean | null;
}

const UNKNOWN_DATE_LABEL = 'Unknown date';

const formatEntryDate = (value?: string | null) => {
  if (!value) return UNKNOWN_DATE_LABEL;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return UNKNOWN_DATE_LABEL;

  // Compare calendar days in local time to avoid DST/rounding drift.
  const diffDays = differenceInCalendarDays(startOfDay(new Date()), startOfDay(parsed));

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

type ActivityTransaction = FinanceTransaction & {
  createdAt: string | null;
  createdAtTime: number;
  hasValidDate: boolean;
};

const formatShortDate = (value: Date) =>
  value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const normalizeCadence = (value?: string | null): RecurrenceCadence => {
  if (value === 'weekly' || value === 'yearly') return value;
  return 'monthly';
};

const parseDateOnly = (value?: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatEntryTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const FinanceHeader = () => {
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="px-6 pt-12 pb-6 sticky top-0 bg-white/90 backdrop-blur-md z-[60]">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--finance-ink)]">Portfolio</h1>
          <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-widest">{today}</p>
        </div>
        <BrandLogo className="h-9 w-9" />
      </div>
    </div>
  );
};

const FinanceView = ({ refreshToken = 0, currencyCode = 'USD' }: FinanceViewProps) => {
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [transactions, setTransactions] = useState<ActivityTransaction[]>([]);
  const [rawEntries, setRawEntries] = useState<FinanceEntryRow[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [showAllGoals, setShowAllGoals] = useState(false);

  const [accountsLoading, setAccountsLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [billsLoading, setBillsLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [billsError, setBillsError] = useState<string | null>(null);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', balance: '', color: accountColors[0], lastFour: '' });
  const [accountSaveError, setAccountSaveError] = useState<string | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: '', target: '', current: '', color: goalColors[0] });
  const [goalSaveError, setGoalSaveError] = useState<string | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; description: string } | null>(null);
  const [showBillsModal, setShowBillsModal] = useState(false);
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);

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

    const { entries, error } = await listFinanceEntries({ limit: 100 });
    if (error) {
      setEntriesError(error);
      setTransactions([]);
      setRawEntries([]);
      setEntriesLoading(false);
      return;
    }

    setRawEntries(entries);

    const mapped = entries.map((entry) => {
      const rawAmount = Number(entry.amount);
      const amountValue = Number.isFinite(rawAmount) ? rawAmount : 0;
      const type: FinanceTransaction['type'] = amountValue >= 0 ? 'income' : 'expense';
      const category = entry.category?.trim() || 'General';
      const title = entry.note?.trim() || category;
      const createdAt = entry.created_at ?? null;
      const parsedCreatedAt = createdAt ? new Date(createdAt) : null;
      const hasValidDate = Boolean(parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime()));
      const createdAtTime = parsedCreatedAt ? parsedCreatedAt.getTime() : 0;
      const safeCreatedAtTime = Number.isNaN(createdAtTime) ? 0 : createdAtTime;

      return {
        id: entry.id,
        title,
        category,
        amount: Math.abs(amountValue),
        type,
        date: formatEntryDate(entry.created_at),
        icon: getTransactionIcon(category, type),
        accountId: entry.account_id ?? null,
        createdAt,
        createdAtTime: safeCreatedAtTime,
        hasValidDate
      };
    }).sort((a, b) => b.createdAtTime - a.createdAtTime);

    setTransactions(mapped);
    setEntriesLoading(false);
  };

  const fetchBills = async () => {
    if (!user) return;
    setBillsLoading(true);
    setBillsError(null);

    const { data, error } = await supabase
      .from('finance_bills')
      .select('id, name, amount, cadence, next_due_date, account_id, reminder_days, active')
      .eq('user_id', user.id)
      .order('next_due_date', { ascending: true });

    if (error) {
      setBillsError('Failed to load bills.');
      setBills([]);
      setBillsLoading(false);
      return;
    }

    const rows = (data ?? []) as FinanceBillRow[];
    setBills(rows.map((row) => ({
      id: row.id,
      name: row.name ?? 'Bill',
      amount: Number(row.amount) || 0,
      cadence: normalizeCadence(row.cadence),
      nextDueDate: row.next_due_date ?? null,
      accountId: row.account_id ?? null,
      reminderDays: row.reminder_days !== null ? Number(row.reminder_days) : null,
      active: row.active ?? true
    })));
    setBillsLoading(false);
  };

  const fetchSubscriptions = async () => {
    if (!user) return;
    setSubscriptionsLoading(true);
    setSubscriptionsError(null);

    const { data, error } = await supabase
      .from('finance_subscriptions')
      .select('id, name, amount, cadence, next_due_date, account_id, reminder_days, active')
      .eq('user_id', user.id)
      .order('next_due_date', { ascending: true });

    if (error) {
      setSubscriptionsError('Failed to load subscriptions.');
      setSubscriptions([]);
      setSubscriptionsLoading(false);
      return;
    }

    const rows = (data ?? []) as FinanceSubscriptionRow[];
    setSubscriptions(rows.map((row) => ({
      id: row.id,
      name: row.name ?? 'Subscription',
      amount: Number(row.amount) || 0,
      cadence: normalizeCadence(row.cadence),
      nextDueDate: row.next_due_date ?? null,
      accountId: row.account_id ?? null,
      reminderDays: row.reminder_days !== null ? Number(row.reminder_days) : null,
      active: row.active ?? true
    })));
    setSubscriptionsLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setGoals([]);
      setTransactions([]);
      setRawEntries([]);
      setBills([]);
      setSubscriptions([]);
      setAccountsLoading(false);
      setGoalsLoading(false);
      setEntriesLoading(false);
      setBillsLoading(false);
      setSubscriptionsLoading(false);
      return;
    }

    fetchAccounts();
    fetchGoals();
    fetchEntries();
    fetchBills();
    fetchSubscriptions();
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

  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);

  const groupedRecentTransactions = useMemo(() => {
    return recentTransactions.reduce<Record<string, ActivityTransaction[]>>((acc, transaction) => {
      if (!acc[transaction.date]) acc[transaction.date] = [];
      acc[transaction.date].push(transaction);
      return acc;
    }, {});
  }, [recentTransactions]);

  const hasMoreActivity = transactions.length > 3;

  const orderedActivityGroups = useMemo(() => {
    const entries = Object.entries(groupedRecentTransactions);
    const known = entries.filter(([label]) => label !== UNKNOWN_DATE_LABEL);
    const unknown = entries.filter(([label]) => label === UNKNOWN_DATE_LABEL);
    return [...known, ...unknown];
  }, [groupedRecentTransactions]);

  const weeklySummary = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfDay(now);
    let spent = 0;
    let income = 0;

    rawEntries.forEach((entry) => {
      const createdAt = entry.created_at ? new Date(entry.created_at) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      if (createdAt < weekStart || createdAt > weekEnd) return;

      const amountValue = Number(entry.amount);
      if (!Number.isFinite(amountValue)) return;

      const entryType = entry.type?.toLowerCase() ?? '';
      if (entryType === 'transfer' || entryType === 'goal') return;

      const isExpense = entryType === 'expense' || (entryType !== 'income' && amountValue < 0);
      const isIncome = entryType === 'income' || (entryType !== 'expense' && amountValue > 0);

      if (isExpense) spent += Math.abs(amountValue);
      if (isIncome) income += Math.abs(amountValue);
    });

    const net = income - spent;
    let helperText: string | null = null;
    if (spent > 0 || income > 0) {
      helperText = net >= 0 ? 'On track this week.' : 'Spending is higher than income.';
    }

    return { spent, income, net, helperText };
  }, [rawEntries]);

  const topCategories = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfDay(now);
    const totals = new Map<string, number>();

    rawEntries.forEach((entry) => {
      const createdAt = entry.created_at ? new Date(entry.created_at) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      if (createdAt < weekStart || createdAt > weekEnd) return;

      const amountValue = Number(entry.amount);
      if (!Number.isFinite(amountValue)) return;

      const entryType = entry.type?.toLowerCase() ?? '';
      if (entryType === 'transfer' || entryType === 'goal') return;

      const isExpense = entryType === 'expense' || (entryType !== 'income' && amountValue < 0);
      if (!isExpense) return;

      const category = entry.category?.trim() || 'General';
      totals.set(category, (totals.get(category) ?? 0) + Math.abs(amountValue));
    });

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name, amount]) => ({ name, amount }));
  }, [rawEntries]);

  const subscriptionsSummary = useMemo(() => {
    const cadenceToMonthly: Record<RecurrenceCadence, number> = {
      weekly: 4,
      monthly: 1,
      yearly: 1 / 12
    };

    const activeSubscriptions = subscriptions.filter((subscription) => subscription.active);
    const total = activeSubscriptions.reduce((sum, subscription) => (
      sum + (subscription.amount * cadenceToMonthly[subscription.cadence])
    ), 0);

    return {
      total,
      names: activeSubscriptions.slice(0, 3).map((subscription) => subscription.name),
      count: activeSubscriptions.length
    };
  }, [subscriptions]);

  const upcomingBills = useMemo(() => {
    const activeBills = bills.filter((bill) => bill.active);
    const sorted = activeBills
      .map((bill) => ({ bill, date: parseDateOnly(bill.nextDueDate) }))
      .filter((item) => item.date)
      .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime())
      .slice(0, 3);

    return sorted.map(({ bill, date }) => ({
      name: bill.name,
      amount: bill.amount,
      dateLabel: formatShortDate(date as Date)
    }));
  }, [bills]);

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

  const openInfoModal = (title: string, description = 'Full view coming soon.') => {
    setInfoModal({ title, description });
  };

  const closeInfoModal = () => {
    setInfoModal(null);
  };

  const createBill = async (input: BillFormInput) => {
    if (!user) return 'Sign in to add bills.';

    const { error } = await supabase
      .from('finance_bills')
      .insert({
        user_id: user.id,
        name: input.name,
        amount: input.amount,
        cadence: input.cadence,
        next_due_date: input.nextDueDate,
        account_id: input.accountId,
        reminder_days: input.reminderDays,
        active: true
      });

    if (error) {
      return 'Failed to save bill.';
    }

    fetchBills();
    return null;
  };

  const updateBill = async (id: string, input: BillFormInput) => {
    if (!user) return 'Sign in to update bills.';

    const { error } = await supabase
      .from('finance_bills')
      .update({
        name: input.name,
        amount: input.amount,
        cadence: input.cadence,
        next_due_date: input.nextDueDate,
        account_id: input.accountId,
        reminder_days: input.reminderDays
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return 'Failed to update bill.';
    }

    fetchBills();
    return null;
  };

  const deleteBill = async (id: string) => {
    if (!user) return 'Sign in to delete bills.';

    const { error } = await supabase
      .from('finance_bills')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return 'Failed to delete bill.';
    }

    fetchBills();
    return null;
  };

  const createSubscription = async (input: SubscriptionFormInput) => {
    if (!user) return 'Sign in to add subscriptions.';

    const { error } = await supabase
      .from('finance_subscriptions')
      .insert({
        user_id: user.id,
        name: input.name,
        amount: input.amount,
        cadence: input.cadence,
        next_due_date: input.nextDueDate,
        account_id: input.accountId,
        reminder_days: input.reminderDays,
        active: true
      });

    if (error) {
      return 'Failed to save subscription.';
    }

    fetchSubscriptions();
    return null;
  };

  const updateSubscription = async (id: string, input: SubscriptionFormInput) => {
    if (!user) return 'Sign in to update subscriptions.';

    const { error } = await supabase
      .from('finance_subscriptions')
      .update({
        name: input.name,
        amount: input.amount,
        cadence: input.cadence,
        next_due_date: input.nextDueDate,
        account_id: input.accountId,
        reminder_days: input.reminderDays
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return 'Failed to update subscription.';
    }

    fetchSubscriptions();
    return null;
  };

  const deleteSubscription = async (id: string) => {
    if (!user) return 'Sign in to delete subscriptions.';

    const { error } = await supabase
      .from('finance_subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return 'Failed to delete subscription.';
    }

    fetchSubscriptions();
    return null;
  };

  const themeStyle: CSSProperties = {
    '--finance-sand': '#fbf8f3',
    '--finance-ink': '#0f172a',
    '--finance-glow': '#fbe5cf',
    '--finance-mint': '#b9f5d8',
    '--finance-sky': '#cfe9ff'
  };

  return (
    <div
      className="relative flex-1 overflow-y-auto pb-44 no-scrollbar bg-[var(--finance-sand)] text-[var(--finance-ink)] font-['Space_Grotesk']"
      style={themeStyle}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-[-60px] h-64 w-64 rounded-full bg-[var(--finance-glow)] opacity-45 blur-3xl" />
        <div className="absolute top-40 -left-28 h-72 w-72 rounded-full bg-[var(--finance-sky)] opacity-40 blur-3xl" />
        <div className="absolute bottom-24 right-[-40px] h-56 w-56 rounded-full bg-[var(--finance-mint)] opacity-35 blur-3xl" />
      </div>

      <div className="relative z-10">
        <FinanceHeader />
      </div>
      
      <div className="relative z-10 px-6 pt-4 max-w-lg mx-auto space-y-14">
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
                currencyCode={currencyCode}
              />
            ))
          )}
        </section>

        {user && accounts.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openAddAccount}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-black"
            >
              Add Account
            </button>
          </div>
        )}

        <div className="space-y-6">
          <section>
          <ThisWeekSummary
            spent={weeklySummary.spent}
            income={weeklySummary.income}
            net={weeklySummary.net}
            currencyCode={currencyCode}
            helperText={weeklySummary.helperText}
            loading={authLoading || entriesLoading}
            isSignedIn={Boolean(user)}
            error={entriesError}
            onClick={() => openInfoModal('This Week', 'Detailed finance history view coming soon.')}
            />
          </section>

          <section>
          <UpcomingBillsCard
            bills={upcomingBills}
            currencyCode={currencyCode}
            loading={authLoading || billsLoading}
            isSignedIn={Boolean(user)}
            error={billsError}
            onClick={() => setShowBillsModal(true)}
          />
          </section>

          <section>
          <SubscriptionsSummary
            total={subscriptionsSummary.total}
            names={subscriptionsSummary.names}
            count={subscriptionsSummary.count}
            currencyCode={currencyCode}
            loading={authLoading || subscriptionsLoading}
            isSignedIn={Boolean(user)}
            error={subscriptionsError}
            onClick={() => setShowSubscriptionsModal(true)}
          />
          </section>

          <section>
          <TopCategoriesSummary
            categories={topCategories}
            currencyCode={currencyCode}
            loading={authLoading || entriesLoading}
            isSignedIn={Boolean(user)}
            error={entriesError}
            onClick={() => openInfoModal('Top Categories', 'Category breakdown coming soon.')}
          />
          </section>
        </div>

        <section>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-black tracking-tight text-slate-900">Growth Targets</h3>
              <button
                onClick={() => setShowAllGoals((prev) => !prev)}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"
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
          </div>
        </section>

        <section>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-black tracking-tight text-slate-900">Activity</h3>
              <button
                onClick={() => openInfoModal('Activity History', 'Full activity view coming soon.')}
                className="text-[11px] font-black text-slate-500 uppercase tracking-widest"
              >
                {hasMoreActivity ? 'See more' : 'History'}
              </button>
            </div>

            {authLoading || entriesLoading ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Loading entries...</div>
            ) : !user ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Sign in to view your activity.</div>
            ) : entriesError ? (
              <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-500">{entriesError}</div>
            ) : recentTransactions.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">No activity yet.</div>
            ) : (
              <div className="space-y-8">
                {orderedActivityGroups.map(([date, items]) => (
                  <div key={date}>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-5">
                      {date}
                    </p>
                    <div className="space-y-4">
                      {items.map((transaction) => (
                        <div 
                          key={transaction.id} 
                          className="group flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100/80 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${transaction.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'}`}>
                              {transaction.icon}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 tracking-tight">{transaction.title}</h4>
                              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-tighter">{transaction.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-black text-sm ${transaction.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currencyCode)}
                            </p>
                            {date !== UNKNOWN_DATE_LABEL && transaction.hasValidDate && (
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter mt-0.5">
                                {formatEntryTime(transaction.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

      {infoModal && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-10 sm:items-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeInfoModal} />
          <div className="relative w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black">{infoModal.title}</h2>
              <button
                type="button"
                onClick={closeInfoModal}
                className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center"
              >
                X
              </button>
            </div>
            <p className="text-sm text-slate-500">{infoModal.description}</p>
            <button
              type="button"
              onClick={closeInfoModal}
              className="mt-6 w-full rounded-2xl bg-black py-3 text-xs font-bold uppercase tracking-widest text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <BillsManagerModal
        isOpen={showBillsModal}
        onClose={() => setShowBillsModal(false)}
        bills={bills}
        accounts={accounts}
        currencyCode={currencyCode}
        loading={billsLoading}
        error={billsError ?? undefined}
        onCreate={createBill}
        onUpdate={updateBill}
        onDelete={deleteBill}
      />

      <SubscriptionsManagerModal
        isOpen={showSubscriptionsModal}
        onClose={() => setShowSubscriptionsModal(false)}
        subscriptions={subscriptions}
        accounts={accounts}
        currencyCode={currencyCode}
        loading={subscriptionsLoading}
        error={subscriptionsError ?? undefined}
        onCreate={createSubscription}
        onUpdate={updateSubscription}
        onDelete={deleteSubscription}
      />
    </div>
  );
};

export default FinanceView;
