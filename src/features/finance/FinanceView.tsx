import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears
} from 'date-fns';
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
import AnimatedNumber from './components/AnimatedNumber';
import BottomSheet from './components/BottomSheet';
import BillsManagerModal, { type BillFormInput, type BillItem } from './components/BillsManagerModal';
import SubscriptionsManagerModal, { type SubscriptionFormInput, type SubscriptionItem } from './components/SubscriptionsManagerModal';

interface FinanceViewProps {
  refreshToken?: number;
  currencyCode?: 'USD' | 'PHP';
  fabIntent?: { type: 'subscription' } | null;
  onFabIntentHandled?: () => void;
  onFabContextChange?: (context: 'portfolio' | 'activity' | 'subscriptions') => void;
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

type TimeRange = 'week' | 'month' | 'year';
type DashboardCardId =
  | 'this-week'
  | 'upcoming-bills'
  | 'subscriptions'
  | 'top-categories'
  | 'growth-targets'
  | 'activity';

type DeltaIndicator = {
  direction: 'up' | 'down' | 'flat';
  label: string;
};

type DashboardConfig = {
  order: DashboardCardId[];
  hidden: DashboardCardId[];
  pinned: DashboardCardId[];
  ranges: Record<DashboardCardId, TimeRange>;
};
type DatedBill = { bill: BillItem; date: Date };

const DASHBOARD_CARD_ORDER: DashboardCardId[] = [
  'this-week',
  'upcoming-bills',
  'subscriptions',
  'top-categories',
  'growth-targets',
  'activity'
];
const CARD_TITLES: Record<DashboardCardId, string> = {
  'this-week': 'This Week',
  'upcoming-bills': 'Upcoming Bills',
  subscriptions: 'Subscriptions',
  'top-categories': 'Top Categories',
  'growth-targets': 'Growth Targets',
  activity: 'Activity'
};

const TIME_RANGE_SEQUENCE: TimeRange[] = ['week', 'month', 'year'];
const RANGE_LABELS: Record<TimeRange, string> = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year'
};
const RANGE_BADGES: Record<TimeRange, string> = {
  week: 'This week',
  month: 'This month',
  year: 'This year'
};

const buildDefaultDashboardConfig = (): DashboardConfig => ({
  order: DASHBOARD_CARD_ORDER,
  hidden: [],
  pinned: [],
  ranges: {
    'this-week': 'week',
    'upcoming-bills': 'month',
    subscriptions: 'month',
    'top-categories': 'week',
    'growth-targets': 'month',
    activity: 'week'
  }
});

const triggerHaptic = () => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(8);
};

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

const getRangeLabel = (range: TimeRange) => RANGE_LABELS[range] ?? 'This Week';
const getRangeBadge = (range: TimeRange) => RANGE_BADGES[range] ?? 'This week';

const shiftRange = (range: TimeRange, direction: 'next' | 'prev') => {
  const index = TIME_RANGE_SEQUENCE.indexOf(range);
  if (index === -1) return 'week';
  const offset = direction === 'next' ? 1 : -1;
  const nextIndex = (index + offset + TIME_RANGE_SEQUENCE.length) % TIME_RANGE_SEQUENCE.length;
  return TIME_RANGE_SEQUENCE[nextIndex];
};

const getRangeWindow = (range: TimeRange, referenceDate = new Date()) => {
  if (range === 'month') {
    return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
  }
  if (range === 'year') {
    return { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
  }
  return { start: startOfWeek(referenceDate, { weekStartsOn: 1 }), end: endOfDay(referenceDate) };
};

const getPreviousAnchor = (range: TimeRange, referenceDate = new Date()) => {
  if (range === 'month') return subMonths(referenceDate, 1);
  if (range === 'year') return subYears(referenceDate, 1);
  return subWeeks(referenceDate, 1);
};

const buildDeltaIndicator = (current: number, previous: number): DeltaIndicator | null => {
  if (current === 0 && previous === 0) return null;
  if (previous <= 0) {
    return { direction: 'up', label: 'New' };
  }
  const rawDelta = ((current - previous) / previous) * 100;
  const rounded = Math.round(rawDelta);
  if (rounded === 0) {
    return { direction: 'flat', label: 'Flat' };
  }
  return {
    direction: rounded > 0 ? 'up' : 'down',
    label: `${rounded > 0 ? '↑' : '↓'} ${Math.abs(rounded)}%`
  };
};

const normalizeDashboardConfig = (value: Partial<DashboardConfig> | null | undefined): DashboardConfig => {
  const defaults = buildDefaultDashboardConfig();
  if (!value) return defaults;
  const order = Array.isArray(value.order)
    ? value.order.filter((item): item is DashboardCardId => DASHBOARD_CARD_ORDER.includes(item))
    : [];
  const missing = DASHBOARD_CARD_ORDER.filter((item) => !order.includes(item));
  const hidden = Array.isArray(value.hidden)
    ? value.hidden.filter((item): item is DashboardCardId => DASHBOARD_CARD_ORDER.includes(item))
    : [];
  const pinned = Array.isArray(value.pinned)
    ? value.pinned.filter((item): item is DashboardCardId => DASHBOARD_CARD_ORDER.includes(item))
    : [];
  const ranges = { ...defaults.ranges, ...(value.ranges ?? {}) } as Record<DashboardCardId, TimeRange>;
  return {
    order: [...order, ...missing],
    hidden,
    pinned,
    ranges
  };
};

const readDashboardConfig = (key: string) => {
  if (typeof window === 'undefined') return buildDefaultDashboardConfig();
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return buildDefaultDashboardConfig();
    const parsed = JSON.parse(stored) as Partial<DashboardConfig>;
    return normalizeDashboardConfig(parsed);
  } catch {
    return buildDefaultDashboardConfig();
  }
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

type DashboardCardShellProps = {
  id: DashboardCardId;
  children: ReactNode;
  onLongPress?: (id: DashboardCardId) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDragStart?: (id: DashboardCardId) => void;
  onDrop?: (id: DashboardCardId) => void;
  onDragEnd?: () => void;
};

const DashboardCardShell = ({
  id,
  children,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onDragStart,
  onDrop,
  onDragEnd
}: DashboardCardShellProps) => {
  const startPointRef = useRef<{ x: number; y: number; swiped: boolean } | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const clearLongPress = () => {
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    suppressClickRef.current = false;
    startPointRef.current = { x: event.clientX, y: event.clientY, swiped: false };
    if (onLongPress) {
      clearLongPress();
      longPressTimeoutRef.current = window.setTimeout(() => {
        suppressClickRef.current = true;
        triggerHaptic();
        onLongPress(id);
      }, 420);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!startPointRef.current) return;
    const dx = event.clientX - startPointRef.current.x;
    const dy = event.clientY - startPointRef.current.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      clearLongPress();
    }
    if (startPointRef.current.swiped) return;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      startPointRef.current.swiped = true;
      suppressClickRef.current = true;
      triggerHaptic();
      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
  };

  const handlePointerUp = () => {
    clearLongPress();
    startPointRef.current = null;
  };

  const handlePointerCancel = () => {
    clearLongPress();
    startPointRef.current = null;
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  return (
    <section
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', id);
        onDragStart?.(id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop?.(id);
      }}
      onDragEnd={onDragEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      className="touch-pan-y"
    >
      {children}
    </section>
  );
};

type SwipeableActivityRowProps = {
  transaction: ActivityTransaction;
  currencyCode: 'USD' | 'PHP';
  onDelete: (transaction: ActivityTransaction) => void;
  onCategorize: (transaction: ActivityTransaction) => void;
  timeLabel?: string | null;
  isNew?: boolean;
};

const SwipeableActivityRow = ({
  transaction,
  currencyCode,
  onDelete,
  onCategorize,
  timeLabel,
  isNew = false
}: SwipeableActivityRowProps) => {
  const [offset, setOffset] = useState(0);
  const [action, setAction] = useState<'delete' | 'categorize' | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const triggeredRef = useRef(false);

  const reset = () => {
    setOffset(0);
    setAction(null);
    startRef.current = null;
    triggeredRef.current = false;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    startRef.current = { x: event.clientX, y: event.clientY };
    triggeredRef.current = false;
    setAction(null);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    const dx = event.clientX - startRef.current.x;
    const dy = event.clientY - startRef.current.y;
    if (Math.abs(dx) < Math.abs(dy)) return;
    const clamped = Math.max(Math.min(dx, 90), -90);
    setOffset(clamped);
    if (!triggeredRef.current && Math.abs(dx) > 60) {
      triggeredRef.current = true;
      triggerHaptic();
      setAction(dx > 0 ? 'categorize' : 'delete');
    }
  };

  const handlePointerUp = () => {
    if (action === 'delete') onDelete(transaction);
    if (action === 'categorize') onCategorize(transaction);
    reset();
  };

  const handlePointerCancel = () => {
    reset();
  };

  const backgroundTone =
    action === 'delete'
      ? 'bg-rose-500/90 justify-end'
      : action === 'categorize'
        ? 'bg-emerald-500/90 justify-start'
        : 'bg-transparent';

  return (
    <div className="relative">
      <div
        className={`absolute inset-0 flex items-center rounded-2xl px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white ${backgroundTone}`}
      >
        {action === 'delete' ? 'Delete' : action === 'categorize' ? 'Categorize' : ''}
      </div>
      <div
        className={`group flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100/80 transition-all touch-pan-y ${
          isNew ? 'animate-in slide-in-from-top-2 duration-200' : ''
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className="flex items-center gap-5">
          <div
            className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${
              transaction.type === 'income'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'
            }`}
          >
            {transaction.icon}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 tracking-tight">{transaction.title}</h4>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-tighter">
              {transaction.category}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-black text-sm ${transaction.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount, currencyCode)}
          </p>
          {timeLabel && (
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter mt-0.5">
              {timeLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const FinanceView = ({
  refreshToken = 0,
  currencyCode = 'USD',
  fabIntent = null,
  onFabIntentHandled,
  onFabContextChange
}: FinanceViewProps) => {
  const { user, loading: authLoading } = useAuth();
  const dashboardKey = useMemo(() => `finance.dashboard.v1.${user?.id ?? 'guest'}`, [user?.id]);
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
  const [activeSheet, setActiveSheet] = useState<
    'this-week' | 'top-categories' | 'growth-targets' | 'activity' | 'insights' | null
  >(null);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => readDashboardConfig(dashboardKey));
  const [draggingCardId, setDraggingCardId] = useState<DashboardCardId | null>(null);
  const [actionMenuCardId, setActionMenuCardId] = useState<DashboardCardId | null>(null);
  const [categorizeTarget, setCategorizeTarget] = useState<ActivityTransaction | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    timeoutId: number;
  } | null>(null);
  const [undoToast, setUndoToast] = useState<{ id: string; label: string } | null>(null);
  const [animatedTransactionIds, setAnimatedTransactionIds] = useState<string[]>([]);
  const previousTransactionIdsRef = useRef<string[]>([]);
  const animationTimeoutRef = useRef<number | null>(null);

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
    setDashboardConfig(readDashboardConfig(dashboardKey));
  }, [dashboardKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const normalized = normalizeDashboardConfig(dashboardConfig);
    window.localStorage.setItem(dashboardKey, JSON.stringify(normalized));
  }, [dashboardConfig, dashboardKey]);

  useEffect(() => {
    if (activeAccountIndex >= accounts.length) {
      setActiveAccountIndex(0);
    }
  }, [accounts.length, activeAccountIndex]);

  useEffect(() => {
    const previous = previousTransactionIdsRef.current;
    const next = transactions.map((transaction) => transaction.id);
    const newIds = next.filter((id) => !previous.includes(id));
    if (newIds.length > 0) {
      setAnimatedTransactionIds((current) => Array.from(new Set([...current, ...newIds])));
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = window.setTimeout(() => {
        setAnimatedTransactionIds((current) => current.filter((id) => !newIds.includes(id)));
      }, 420);
    }
    previousTransactionIdsRef.current = next;
  }, [transactions]);

  useEffect(() => {
    if (!fabIntent) return;
    if (fabIntent.type === 'subscription') {
      setShowSubscriptionsModal(true);
      onFabIntentHandled?.();
    }
  }, [fabIntent, onFabIntentHandled]);

  useEffect(() => {
    if (!onFabContextChange) return;
    if (showSubscriptionsModal) {
      onFabContextChange('subscriptions');
    } else if (activeSheet === 'activity') {
      onFabContextChange('activity');
    } else {
      onFabContextChange('portfolio');
    }
  }, [activeSheet, onFabContextChange, showSubscriptionsModal]);

  useEffect(() => {
    if (!categorizeTarget) {
      setCustomCategory('');
    }
  }, [categorizeTarget]);

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

  const cardRanges = dashboardConfig.ranges;

  const summarizeEntriesForRange = useCallback(
    (range: TimeRange, anchorDate = new Date()) => {
      const { start, end } = getRangeWindow(range, anchorDate);
      let spent = 0;
      let income = 0;

      rawEntries.forEach((entry) => {
        const createdAt = entry.created_at ? new Date(entry.created_at) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) return;
        if (createdAt < start || createdAt > end) return;

        const amountValue = Number(entry.amount);
        if (!Number.isFinite(amountValue)) return;

        const entryType = entry.type?.toLowerCase() ?? '';
        if (entryType === 'transfer' || entryType === 'goal') return;

        const isExpense = entryType === 'expense' || (entryType !== 'income' && amountValue < 0);
        const isIncome = entryType === 'income' || (entryType !== 'expense' && amountValue > 0);

        if (isExpense) spent += Math.abs(amountValue);
        if (isIncome) income += Math.abs(amountValue);
      });

      return { spent, income, net: income - spent };
    },
    [rawEntries]
  );

  const buildCategoryTotals = useCallback(
    (range: TimeRange, anchorDate = new Date()) => {
      const { start, end } = getRangeWindow(range, anchorDate);
      const totals = new Map<string, number>();

      rawEntries.forEach((entry) => {
        const createdAt = entry.created_at ? new Date(entry.created_at) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) return;
        if (createdAt < start || createdAt > end) return;

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
        .map(([name, amount]) => ({ name, amount }));
    },
    [rawEntries]
  );

  const buildBudgetTarget = useCallback(
    (range: TimeRange, currentSpent: number) => {
      const lookbackPeriods = 4;
      let total = 0;
      let count = 0;

      for (let i = 1; i <= lookbackPeriods; i += 1) {
        const anchor =
          range === 'month'
            ? subMonths(new Date(), i)
            : range === 'year'
              ? subYears(new Date(), i)
              : subWeeks(new Date(), i);
        const summary = summarizeEntriesForRange(range, anchor);
        if (summary.spent > 0) {
          total += summary.spent;
          count += 1;
        }
      }

      const average = count ? total / count : 0;
      if (average > 0) return average;
      if (currentSpent > 0) return currentSpent;
      return 0;
    },
    [summarizeEntriesForRange]
  );

  const buildSpendChart = useCallback(
    (range: TimeRange, budgetTotal: number) => {
      const { start, end } = getRangeWindow(range);
      const bucketCount = range === 'week' ? 7 : range === 'month' ? 4 : 12;
      const buckets = Array.from({ length: bucketCount }, () => 0);
      const totalDays = differenceInCalendarDays(end, start) + 1;

      rawEntries.forEach((entry) => {
        const createdAt = entry.created_at ? new Date(entry.created_at) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) return;
        if (createdAt < start || createdAt > end) return;

        const amountValue = Number(entry.amount);
        if (!Number.isFinite(amountValue)) return;

        const entryType = entry.type?.toLowerCase() ?? '';
        if (entryType === 'transfer' || entryType === 'goal') return;

        const isExpense = entryType === 'expense' || (entryType !== 'income' && amountValue < 0);
        if (!isExpense) return;

        let index = 0;
        if (range === 'week') {
          index = differenceInCalendarDays(startOfDay(createdAt), start);
        } else if (range === 'month') {
          const dayIndex = differenceInCalendarDays(startOfDay(createdAt), start);
          index = Math.min(Math.floor((dayIndex / totalDays) * bucketCount), bucketCount - 1);
        } else {
          index = createdAt.getMonth();
        }

        if (index >= 0 && index < buckets.length) {
          buckets[index] += Math.abs(amountValue);
        }
      });

      const labels =
        range === 'week'
          ? Array.from({ length: 7 }, (_, idx) =>
              addDays(start, idx).toLocaleDateString('en-US', { weekday: 'short' })
            )
          : range === 'month'
            ? ['W1', 'W2', 'W3', 'W4']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const budgetPerBucket = budgetTotal > 0 ? budgetTotal / bucketCount : 0;
      const points = buckets.map((value, index) => ({
        label: labels[index] ?? '',
        spend: value,
        budget: budgetPerBucket
      }));

      const maxValue = Math.max(
        1,
        ...points.map((point) => Math.max(point.spend, point.budget))
      );

      return { points, maxValue };
    },
    [rawEntries]
  );

  const thisWeekRange = cardRanges['this-week'] ?? 'week';
  const thisWeekSummary = useMemo(
    () => summarizeEntriesForRange(thisWeekRange),
    [summarizeEntriesForRange, thisWeekRange]
  );
  const previousThisWeekSummary = useMemo(
    () => summarizeEntriesForRange(thisWeekRange, getPreviousAnchor(thisWeekRange)),
    [summarizeEntriesForRange, thisWeekRange]
  );
  const weeklyBudget = useMemo(
    () => buildBudgetTarget(thisWeekRange, thisWeekSummary.spent),
    [buildBudgetTarget, thisWeekRange, thisWeekSummary.spent]
  );
  const weeklyProgress = weeklyBudget > 0 ? thisWeekSummary.spent / weeklyBudget : 0;
  const thisWeekChart = useMemo(
    () => buildSpendChart(thisWeekRange, weeklyBudget),
    [buildSpendChart, thisWeekRange, weeklyBudget]
  );
  const weeklyHelperText = useMemo(() => {
    if (thisWeekSummary.spent === 0 && thisWeekSummary.income === 0) return null;
    return thisWeekSummary.net >= 0 ? 'On track this period.' : 'Spending is higher than income.';
  }, [thisWeekSummary]);
  const weeklyCategories = useMemo(
    () => buildCategoryTotals(thisWeekRange),
    [buildCategoryTotals, thisWeekRange]
  );
  const weeklyInsight = useMemo(() => {
    if (!user) return null;
    if (thisWeekSummary.spent === 0 && thisWeekSummary.income === 0) {
      return `No activity yet ${getRangeBadge(thisWeekRange)}.`;
    }
    if (thisWeekSummary.income > previousThisWeekSummary.income * 1.2) {
      return 'Higher than last period due to income lift.';
    }
    if (thisWeekSummary.spent > previousThisWeekSummary.spent * 1.2 && weeklyCategories[0]) {
      return `Spending rose, led by ${weeklyCategories[0].name}.`;
    }
    if (thisWeekSummary.net < 0) {
      return 'Spending outpaced income this period.';
    }
    return 'Net positive this period.';
  }, [thisWeekRange, thisWeekSummary, previousThisWeekSummary, weeklyCategories, user]);

  const incomeDelta = useMemo(
    () => buildDeltaIndicator(thisWeekSummary.income, previousThisWeekSummary.income),
    [thisWeekSummary.income, previousThisWeekSummary.income]
  );
  const netDelta = useMemo(
    () => buildDeltaIndicator(thisWeekSummary.net, previousThisWeekSummary.net),
    [thisWeekSummary.net, previousThisWeekSummary.net]
  );

  const topCategoriesRange = cardRanges['top-categories'] ?? 'week';
  const topCategoriesAll = useMemo(
    () => buildCategoryTotals(topCategoriesRange),
    [buildCategoryTotals, topCategoriesRange]
  );
  const topCategoriesTotal = useMemo(
    () => topCategoriesAll.reduce((sum, category) => sum + category.amount, 0),
    [topCategoriesAll]
  );
  const previousTopCategoriesAll = useMemo(
    () => buildCategoryTotals(topCategoriesRange, getPreviousAnchor(topCategoriesRange)),
    [buildCategoryTotals, topCategoriesRange]
  );
  const topCategories = useMemo(() => topCategoriesAll.slice(0, 2), [topCategoriesAll]);
  const topCategoriesInsight = useMemo(() => {
    if (topCategoriesTotal <= 0 || topCategoriesAll.length === 0) return null;
    const top = topCategoriesAll[0];
    const second = topCategoriesAll[1];
    if (second) {
      return `Driven by ${top.name} and ${second.name}.`;
    }
    return `Mostly ${top.name} (${Math.round((top.amount / topCategoriesTotal) * 100)}%).`;
  }, [topCategoriesAll, topCategoriesTotal]);

  const subscriptionsRange = cardRanges.subscriptions ?? 'month';
  const categorySuggestions = useMemo(() => {
    const seen = new Set<string>();
    rawEntries.forEach((entry) => {
      const category = entry.category?.trim();
      if (category) seen.add(category);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b)).slice(0, 8);
  }, [rawEntries]);

  const subscriptionsSummary = useMemo(() => {
    const cadenceToMonthly: Record<RecurrenceCadence, number> = {
      weekly: 4,
      monthly: 1,
      yearly: 1 / 12
    };

    const activeSubscriptions = subscriptions.filter((subscription) => subscription.active);
    const monthlyTotal = activeSubscriptions.reduce((sum, subscription) => (
      sum + (subscription.amount * cadenceToMonthly[subscription.cadence])
    ), 0);
    const multiplier = subscriptionsRange === 'week' ? 1 / 4 : subscriptionsRange === 'year' ? 12 : 1;

    return {
      total: monthlyTotal * multiplier,
      monthlyTotal,
      names: activeSubscriptions.slice(0, 3).map((subscription) => subscription.name),
      count: activeSubscriptions.length,
      nextDueDate: activeSubscriptions
        .map((subscription) => parseDateOnly(subscription.nextDueDate))
        .filter((date): date is Date => Boolean(date))
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null
    };
  }, [subscriptions, subscriptionsRange]);

  const subscriptionsInsight = useMemo(() => {
    if (subscriptionsSummary.count === 0) return 'No active subscriptions.';
    if (subscriptionsSummary.nextDueDate) {
      const daysAway = differenceInCalendarDays(subscriptionsSummary.nextDueDate, startOfDay(new Date()));
      if (daysAway <= 0) return 'Renewal due today.';
      return `Next renewal in ${daysAway} days.`;
    }
    return `${subscriptionsSummary.count} subscriptions running.`;
  }, [subscriptionsSummary]);

  const monthlySummary = useMemo(() => summarizeEntriesForRange('month'), [summarizeEntriesForRange]);

  const subscriptionShare = useMemo(() => {
    if (monthlySummary.income <= 0 || subscriptionsSummary.monthlyTotal <= 0) return null;
    return Math.round((subscriptionsSummary.monthlyTotal / monthlySummary.income) * 100);
  }, [monthlySummary.income, subscriptionsSummary.monthlyTotal]);

  const anomalyCategories = useMemo(() => {
    if (topCategoriesAll.length === 0) return [];
    const previousMap = new Map(previousTopCategoriesAll.map((item) => [item.name, item.amount]));
    return topCategoriesAll
      .map((item) => {
        const previous = previousMap.get(item.name) ?? 0;
        const delta = previous > 0 ? (item.amount - previous) / previous : null;
        return { ...item, delta };
      })
      .filter((item) => item.delta !== null && (item.delta as number) > 0.5)
      .slice(0, 3);
  }, [previousTopCategoriesAll, topCategoriesAll]);

  const categoryTrends = useMemo(() => {
    const previousMap = new Map(previousTopCategoriesAll.map((item) => [item.name, item.amount]));
    return topCategoriesAll.slice(0, 4).map((item) => {
      const previous = previousMap.get(item.name) ?? 0;
      const delta = previous > 0 ? (item.amount - previous) / previous : null;
      return { ...item, previous, delta };
    });
  }, [previousTopCategoriesAll, topCategoriesAll]);

  const upcomingBillsRange = cardRanges['upcoming-bills'] ?? 'month';
  const upcomingBills = useMemo(() => {
    const activeBills = bills.filter((bill) => bill.active);
    const { start, end } = getRangeWindow(upcomingBillsRange);
    const sorted = activeBills
      .map((bill) => ({ bill, date: parseDateOnly(bill.nextDueDate) }))
      .filter((item): item is DatedBill => Boolean(item.date) && item.date >= start && item.date <= end)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3);

    return sorted.map(({ bill, date }) => ({
      name: bill.name,
      amount: bill.amount,
      dateLabel: formatShortDate(date),
      date
    }));
  }, [bills, upcomingBillsRange]);

  const upcomingBillsInsight = useMemo(() => {
    if (upcomingBills.length === 0) return 'No upcoming bills.';
    const nextDate = upcomingBills[0].date;
    const daysAway = differenceInCalendarDays(nextDate, startOfDay(new Date()));
    if (daysAway <= 0) return 'Next bill due today.';
    return `Next bill in ${daysAway} days.`;
  }, [upcomingBills]);

  const activityRange = cardRanges.activity ?? 'week';
  const filteredTransactions = useMemo(() => {
    const { start, end } = getRangeWindow(activityRange);
    return transactions.filter((transaction) => {
      if (!transaction.hasValidDate || !transaction.createdAt) return true;
      const createdAt = new Date(transaction.createdAt);
      if (Number.isNaN(createdAt.getTime())) return true;
      return createdAt >= start && createdAt <= end;
    });
  }, [activityRange, transactions]);

  const recentTransactions = useMemo(() => filteredTransactions.slice(0, 3), [filteredTransactions]);

  const groupedRecentTransactions = useMemo(() => {
    return recentTransactions.reduce<Record<string, ActivityTransaction[]>>((acc, transaction) => {
      if (!acc[transaction.date]) acc[transaction.date] = [];
      acc[transaction.date].push(transaction);
      return acc;
    }, {});
  }, [recentTransactions]);

  const hasMoreActivity = filteredTransactions.length > 3;

  const orderedActivityGroups = useMemo(() => {
    const entries = Object.entries(groupedRecentTransactions);
    const known = entries.filter(([label]) => label !== UNKNOWN_DATE_LABEL);
    const unknown = entries.filter(([label]) => label === UNKNOWN_DATE_LABEL);
    return [...known, ...unknown];
  }, [groupedRecentTransactions]);

  const activityInsight = useMemo(() => {
    const latest = filteredTransactions[0];
    if (!latest) return 'No activity yet.';
    if (latest.createdAt) {
      const time = formatEntryTime(latest.createdAt);
      if (time) return `Last entry at ${time}.`;
    }
    return 'Latest activity just now.';
  }, [filteredTransactions]);


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

  const handleCardPinToggle = (cardId: DashboardCardId) => {
    setDashboardConfig((prev) => {
      const pinned = new Set(prev.pinned);
      if (pinned.has(cardId)) {
        pinned.delete(cardId);
      } else {
        pinned.add(cardId);
      }
      return { ...prev, pinned: Array.from(pinned) };
    });
  };

  const handleCardHide = (cardId: DashboardCardId) => {
    setDashboardConfig((prev) => ({
      ...prev,
      hidden: Array.from(new Set([...prev.hidden, cardId]))
    }));
  };

  const handleCardShow = (cardId: DashboardCardId) => {
    setDashboardConfig((prev) => ({
      ...prev,
      hidden: prev.hidden.filter((item) => item !== cardId)
    }));
  };

  const handleCardDrop = (targetId: DashboardCardId) => {
    if (!draggingCardId || draggingCardId === targetId) {
      setDraggingCardId(null);
      return;
    }
    setDashboardConfig((prev) => {
      const nextOrder = prev.order.filter((item) => item !== draggingCardId);
      const targetIndex = nextOrder.indexOf(targetId);
      if (targetIndex === -1) return prev;
      nextOrder.splice(targetIndex, 0, draggingCardId);
      return { ...prev, order: nextOrder };
    });
    setDraggingCardId(null);
  };

  const handleCardSwipe = (cardId: DashboardCardId, direction: 'next' | 'prev') => {
    setDashboardConfig((prev) => {
      const current = prev.ranges[cardId] ?? 'week';
      const next = shiftRange(current, direction);
      return { ...prev, ranges: { ...prev.ranges, [cardId]: next } };
    });
  };

  const handleCardEdit = (cardId: DashboardCardId) => {
    if (cardId === 'this-week') {
      setActiveSheet('this-week');
      return;
    }
    if (cardId === 'top-categories') {
      setActiveSheet('top-categories');
      return;
    }
    if (cardId === 'growth-targets') {
      setActiveSheet('growth-targets');
      return;
    }
    if (cardId === 'activity') {
      setActiveSheet('activity');
      return;
    }
    if (cardId === 'upcoming-bills') {
      setShowBillsModal(true);
      return;
    }
    if (cardId === 'subscriptions') {
      setShowSubscriptionsModal(true);
    }
  };

  const handleCategorySelection = async (category: string) => {
    if (!categorizeTarget) return;
    const trimmed = sanitizeText(category).trim();
    if (!trimmed) return;
    const error = await updateEntryCategory(categorizeTarget.id, trimmed);
    if (error) {
      openInfoModal('Update failed', error);
      return;
    }
    setCategorizeTarget(null);
    fetchEntries();
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

  const deleteFinanceEntry = async (id: string) => {
    if (!user) return 'Sign in to delete transactions.';

    const { error } = await supabase
      .from('finance_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return 'Failed to delete transaction.';
    }

    return null;
  };

  const updateEntryCategory = async (id: string, category: string) => {
    if (!user) return 'Sign in to update transactions.';

    const { error } = await supabase
      .from('finance_entries')
      .update({ category })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return 'Failed to update category.';
    }

    return null;
  };

  const queueDeleteTransaction = (transaction: ActivityTransaction) => {
    if (!user) {
      openInfoModal('Sign in required', 'Sign in to delete transactions.');
      return;
    }

    if (pendingDelete) {
      window.clearTimeout(pendingDelete.timeoutId);
      deleteFinanceEntry(pendingDelete.id);
    }

    setTransactions((prev) => prev.filter((item) => item.id !== transaction.id));
    setRawEntries((prev) => prev.filter((item) => item.id !== transaction.id));
    setUndoToast({ id: transaction.id, label: 'Transaction removed.' });

    const timeoutId = window.setTimeout(async () => {
      setUndoToast(null);
      setPendingDelete(null);
      await deleteFinanceEntry(transaction.id);
      fetchEntries();
    }, 3000);

    setPendingDelete({ id: transaction.id, timeoutId });
  };

  const handleUndoDelete = () => {
    if (!pendingDelete) return;
    window.clearTimeout(pendingDelete.timeoutId);
    setPendingDelete(null);
    setUndoToast(null);
    fetchEntries();
  };

  const orderedDashboardCards = useMemo(() => {
    const hidden = new Set(dashboardConfig.hidden);
    const pinnedSet = new Set(dashboardConfig.pinned);
    const baseOrder = dashboardConfig.order.filter((cardId) => !hidden.has(cardId));
    const pinned = dashboardConfig.pinned.filter((cardId) => !hidden.has(cardId));
    const rest = baseOrder.filter((cardId) => !pinnedSet.has(cardId));
    return [...pinned, ...rest];
  }, [dashboardConfig.hidden, dashboardConfig.order, dashboardConfig.pinned]);

  const hiddenCards = useMemo(() => {
    return dashboardConfig.hidden.filter((cardId) => DASHBOARD_CARD_ORDER.includes(cardId));
  }, [dashboardConfig.hidden]);

  const isActionCardPinned = actionMenuCardId
    ? dashboardConfig.pinned.includes(actionMenuCardId)
    : false;

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
          {orderedDashboardCards.map((cardId) => {
            if (cardId === 'this-week') {
              return (
                <DashboardCardShell
                  key={cardId}
                  id={cardId}
                  onLongPress={setActionMenuCardId}
                  onSwipeLeft={() => handleCardSwipe(cardId, 'next')}
                  onSwipeRight={() => handleCardSwipe(cardId, 'prev')}
                  onDragStart={setDraggingCardId}
                  onDragEnd={() => setDraggingCardId(null)}
                  onDrop={handleCardDrop}
                >
                  <ThisWeekSummary
                    spent={thisWeekSummary.spent}
                    income={thisWeekSummary.income}
                    net={thisWeekSummary.net}
                    currencyCode={currencyCode}
                    helperText={weeklyHelperText}
                    loading={authLoading || entriesLoading}
                    isSignedIn={Boolean(user)}
                    error={entriesError}
                    onClick={() => setActiveSheet('this-week')}
                    rangeLabel={getRangeLabel(thisWeekRange)}
                    progress={weeklyProgress}
                    budgetAmount={weeklyBudget}
                    incomeDelta={incomeDelta}
                    netDelta={netDelta}
                    insight={weeklyInsight}
                  />
                </DashboardCardShell>
              );
            }

            if (cardId === 'upcoming-bills') {
              return (
                <DashboardCardShell
                  key={cardId}
                  id={cardId}
                  onLongPress={setActionMenuCardId}
                  onSwipeLeft={() => handleCardSwipe(cardId, 'next')}
                  onSwipeRight={() => handleCardSwipe(cardId, 'prev')}
                  onDragStart={setDraggingCardId}
                  onDragEnd={() => setDraggingCardId(null)}
                  onDrop={handleCardDrop}
                >
                  <UpcomingBillsCard
                    bills={upcomingBills}
                    currencyCode={currencyCode}
                    loading={authLoading || billsLoading}
                    isSignedIn={Boolean(user)}
                    error={billsError}
                    onClick={() => setShowBillsModal(true)}
                    rangeLabel={getRangeBadge(upcomingBillsRange)}
                    insight={upcomingBillsInsight}
                  />
                </DashboardCardShell>
              );
            }

            if (cardId === 'subscriptions') {
              return (
                <DashboardCardShell
                  key={cardId}
                  id={cardId}
                  onLongPress={setActionMenuCardId}
                  onSwipeLeft={() => handleCardSwipe(cardId, 'next')}
                  onSwipeRight={() => handleCardSwipe(cardId, 'prev')}
                  onDragStart={setDraggingCardId}
                  onDragEnd={() => setDraggingCardId(null)}
                  onDrop={handleCardDrop}
                >
                  <SubscriptionsSummary
                    total={subscriptionsSummary.total}
                    names={subscriptionsSummary.names}
                    count={subscriptionsSummary.count}
                    currencyCode={currencyCode}
                    loading={authLoading || subscriptionsLoading}
                    isSignedIn={Boolean(user)}
                    error={subscriptionsError}
                    onClick={() => setShowSubscriptionsModal(true)}
                    rangeLabel={getRangeBadge(subscriptionsRange)}
                    insight={subscriptionsInsight}
                  />
                </DashboardCardShell>
              );
            }

            if (cardId === 'top-categories') {
              return (
                <DashboardCardShell
                  key={cardId}
                  id={cardId}
                  onLongPress={setActionMenuCardId}
                  onSwipeLeft={() => handleCardSwipe(cardId, 'next')}
                  onSwipeRight={() => handleCardSwipe(cardId, 'prev')}
                  onDragStart={setDraggingCardId}
                  onDragEnd={() => setDraggingCardId(null)}
                  onDrop={handleCardDrop}
                >
                  <TopCategoriesSummary
                    categories={topCategories}
                    currencyCode={currencyCode}
                    loading={authLoading || entriesLoading}
                    isSignedIn={Boolean(user)}
                    error={entriesError}
                    onClick={() => setActiveSheet('top-categories')}
                    rangeLabel={getRangeBadge(topCategoriesRange)}
                    insight={topCategoriesInsight}
                  />
                </DashboardCardShell>
              );
            }

            if (cardId === 'growth-targets') {
              const growthRangeLabel = getRangeBadge(cardRanges['growth-targets'] ?? 'month');
              return (
                <DashboardCardShell
                  key={cardId}
                  id={cardId}
                  onLongPress={setActionMenuCardId}
                  onSwipeLeft={() => handleCardSwipe(cardId, 'next')}
                  onSwipeRight={() => handleCardSwipe(cardId, 'prev')}
                  onDragStart={setDraggingCardId}
                  onDragEnd={() => setDraggingCardId(null)}
                  onDrop={handleCardDrop}
                >
                  <div
                    className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] backdrop-blur transition hover:border-slate-300 hover:shadow-md active:scale-[0.99] active:shadow-lg cursor-pointer"
                    onClick={() => setActiveSheet('growth-targets')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveSheet('growth-targets');
                      }
                    }}
                  >
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900">Growth Targets</h3>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">
                          {growthRangeLabel}
                        </p>
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowAllGoals((prev) => !prev);
                        }}
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
                            onClick={(event) => {
                              event.stopPropagation();
                              setShowGoalModal(true);
                            }}
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
                </DashboardCardShell>
              );
            }

            if (cardId === 'activity') {
              const activityRangeLabel = getRangeBadge(activityRange);
              return (
                <DashboardCardShell
                  key={cardId}
                  id={cardId}
                  onLongPress={setActionMenuCardId}
                  onSwipeLeft={() => handleCardSwipe(cardId, 'next')}
                  onSwipeRight={() => handleCardSwipe(cardId, 'prev')}
                  onDragStart={setDraggingCardId}
                  onDragEnd={() => setDraggingCardId(null)}
                  onDrop={handleCardDrop}
                >
                  <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] backdrop-blur transition hover:border-slate-300 hover:shadow-md active:scale-[0.99] active:shadow-lg">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900">Activity</h3>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">
                          {activityRangeLabel}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveSheet('activity')}
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
                                <SwipeableActivityRow
                                  key={transaction.id}
                                  transaction={transaction}
                                  currencyCode={currencyCode}
                                  onDelete={queueDeleteTransaction}
                                  onCategorize={(target) => setCategorizeTarget(target)}
                                  timeLabel={
                                    date !== UNKNOWN_DATE_LABEL && transaction.hasValidDate
                                      ? formatEntryTime(transaction.createdAt)
                                      : null
                                  }
                                  isNew={animatedTransactionIds.includes(transaction.id)}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                        {activityInsight && (
                          <p className="pt-2 text-xs text-slate-500">{activityInsight}</p>
                        )}
                      </div>
                    )}
                  </div>
                </DashboardCardShell>
              );
            }

            return null;
          })}
        </div>

        {hiddenCards.length > 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-4 text-xs text-slate-500">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Hidden sections
            </p>
            <div className="flex flex-wrap gap-2">
              {hiddenCards.map((cardId) => (
                <button
                  key={cardId}
                  type="button"
                  onClick={() => handleCardShow(cardId)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-slate-300 hover:text-slate-700"
                >
                  Show {CARD_TITLES[cardId]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {undoToast && (
        <div className="fixed bottom-28 left-1/2 z-[170] flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-4 py-2 shadow-lg">
          <span className="text-xs font-semibold text-slate-700">{undoToast.label}</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
          >
            Undo
          </button>
        </div>
      )}

      {actionMenuCardId && (
        <BottomSheet
          isOpen={Boolean(actionMenuCardId)}
          title={`Manage ${CARD_TITLES[actionMenuCardId]}`}
          onClose={() => setActionMenuCardId(null)}
        >
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                handleCardEdit(actionMenuCardId);
                setActionMenuCardId(null);
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                handleCardPinToggle(actionMenuCardId);
                setActionMenuCardId(null);
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              {isActionCardPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              type="button"
              onClick={() => {
                handleCardHide(actionMenuCardId);
                setActionMenuCardId(null);
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Hide from dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSheet('insights');
                setActionMenuCardId(null);
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Insights
            </button>
          </div>
        </BottomSheet>
      )}

      <BottomSheet
        isOpen={activeSheet === 'this-week'}
        title={`${getRangeLabel(thisWeekRange)} details`}
        onClose={() => setActiveSheet(null)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Spent</p>
              <AnimatedNumber
                value={thisWeekSummary.spent}
                format={(value) => formatCurrency(value, currencyCode)}
                className="text-xl font-black text-slate-900"
              />
              {weeklyBudget > 0 && (
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Budget {formatCurrency(weeklyBudget, currencyCode)}
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Income</p>
              <AnimatedNumber
                value={thisWeekSummary.income}
                format={(value) => formatCurrency(value, currencyCode)}
                className="text-xl font-black text-emerald-600"
              />
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net</p>
            <AnimatedNumber
              value={thisWeekSummary.net}
              format={(value) => formatCurrency(value, currencyCode)}
              className={`text-xl font-black ${thisWeekSummary.net >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}
            />
            {weeklyInsight && <p className="mt-2 text-xs text-slate-500">{weeklyInsight}</p>}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Spend vs budget
            </p>
            <div className="flex items-end gap-2 h-24">
              {thisWeekChart.points.map((point, index) => (
                <div key={`${point.label}-${index}`} className="flex-1 flex flex-col items-center justify-end">
                  <div className="w-full rounded-full bg-slate-200/70 relative h-full overflow-hidden">
                    {point.budget > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-full bg-emerald-200/70"
                        style={{ height: `${(point.budget / thisWeekChart.maxValue) * 100}%` }}
                      />
                    )}
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-full bg-emerald-400 transition-all duration-200"
                      style={{ height: `${(point.spend / thisWeekChart.maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="mt-2 text-[9px] font-semibold text-slate-400">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'top-categories'}
        title={`Top categories - ${getRangeLabel(topCategoriesRange)}`}
        onClose={() => setActiveSheet(null)}
      >
        <div className="space-y-3">
          {topCategoriesAll.length === 0 ? (
            <p className="text-sm text-slate-400">No spend captured yet.</p>
          ) : (
            topCategoriesAll.map((category) => {
              const share = topCategoriesTotal > 0 ? Math.round((category.amount / topCategoriesTotal) * 100) : 0;
              return (
                <div key={category.name} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{category.name}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(category.amount, currencyCode)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {share}% of spend
                  </p>
                </div>
              );
            })
          )}
          {topCategoriesInsight && <p className="text-xs text-slate-500">{topCategoriesInsight}</p>}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'growth-targets'}
        title="Growth targets timeline"
        onClose={() => setActiveSheet(null)}
      >
        <div className="space-y-4">
          {goals.length === 0 ? (
            <p className="text-sm text-slate-400">No goals created yet.</p>
          ) : (
            goals.map((goal) => {
              const progress = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
              const ringSize = 64;
              const stroke = 6;
              const radius = (ringSize - stroke) / 2;
              const circumference = 2 * Math.PI * radius;
              const dashOffset = activeSheet === 'growth-targets'
                ? circumference * (1 - progress)
                : circumference;
              const pastProgress = Math.max(progress - 0.12, 0);
              const projectedProgress = Math.min(progress + (1 - progress) * 0.35, 1);

              return (
                <div key={goal.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative" style={{ width: ringSize, height: ringSize }}>
                      <svg width={ringSize} height={ringSize} className="rotate-[-90deg]">
                        <circle
                          stroke="#e2e8f0"
                          fill="transparent"
                          strokeWidth={stroke}
                          r={radius}
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                        />
                        <circle
                          stroke="#111827"
                          fill="transparent"
                          strokeWidth={stroke}
                          strokeLinecap="round"
                          strokeDasharray={`${circumference} ${circumference}`}
                          strokeDashoffset={dashOffset}
                          r={radius}
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                          className="transition-[stroke-dashoffset] duration-200"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900">
                        {Math.round(progress * 100)}%
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{goal.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(goal.current, currencyCode)} of {formatCurrency(goal.target, currencyCode)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="relative h-2 w-full rounded-full bg-slate-200/70">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-slate-900"
                        style={{ width: `${progress * 100}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-slate-400/70"
                        style={{ width: `${projectedProgress * 100}%` }}
                      />
                      <div
                        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-900"
                        style={{ left: `${pastProgress * 100}%` }}
                      />
                      <div
                        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-emerald-500"
                        style={{ left: `${progress * 100}%` }}
                      />
                      <div
                        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-400"
                        style={{ left: `${projectedProgress * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      <span>Past</span>
                      <span>Now</span>
                      <span>Projected</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'activity'}
        title={`Activity - ${getRangeLabel(activityRange)}`}
        onClose={() => setActiveSheet(null)}
      >
        <div className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Swipe to categorize or delete
          </p>
          {filteredTransactions.length === 0 ? (
            <p className="text-sm text-slate-400">No activity for this period.</p>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <SwipeableActivityRow
                  key={transaction.id}
                  transaction={transaction}
                  currencyCode={currencyCode}
                  onDelete={queueDeleteTransaction}
                  onCategorize={(target) => setCategorizeTarget(target)}
                  timeLabel={
                    transaction.date !== UNKNOWN_DATE_LABEL && transaction.hasValidDate
                      ? formatEntryTime(transaction.createdAt)
                      : null
                  }
                />
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'insights'}
        title="Insights"
        onClose={() => setActiveSheet(null)}
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              Spending anomalies
            </p>
            {anomalyCategories.length === 0 ? (
              <p className="text-xs text-slate-500">No unusual spikes detected.</p>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                {anomalyCategories.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <span className="font-semibold text-rose-500">
                      +{Math.round(((item.delta as number) * 100))}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              Subscription creep
            </p>
            {subscriptionShare ? (
              <p className="text-xs text-slate-600">
                Subscriptions are {subscriptionShare}% of monthly income.
              </p>
            ) : (
              <p className="text-xs text-slate-500">No income data to compare yet.</p>
            )}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              Category trends
            </p>
            {categoryTrends.length === 0 ? (
              <p className="text-xs text-slate-500">No category trends yet.</p>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                {categoryTrends.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span>{item.name}</span>
                    {item.delta === null ? (
                      <span className="text-slate-400">New</span>
                    ) : (
                      <span className={item.delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                        {item.delta >= 0 ? '↑' : '↓'} {Math.round(Math.abs(item.delta) * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={Boolean(categorizeTarget)}
        title="Categorize transaction"
        onClose={() => setCategorizeTarget(null)}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            {categorizeTarget ? categorizeTarget.title : 'Select a category.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {categorySuggestions.length === 0 && (
              <span className="text-xs text-slate-400">No recent categories.</span>
            )}
            {categorySuggestions.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategorySelection(category)}
                className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={customCategory}
              onChange={(event) => setCustomCategory(sanitizeText(event.target.value))}
              placeholder="Custom category"
              className="flex-1 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            />
            <button
              type="button"
              onClick={() => handleCategorySelection(customCategory)}
              className="rounded-2xl bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white"
            >
              Save
            </button>
          </div>
        </div>
      </BottomSheet>

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
