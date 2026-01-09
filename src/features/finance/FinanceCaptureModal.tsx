import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Calendar, Check, MessageSquare, Tag, Target, Wallet, X } from 'lucide-react';
import type { FinanceAccount, FinanceGoal } from '../../types';
import { sanitizeText } from '../../utils/sanitize';
import { hasSufficientBalance, validateAmount } from './utils/validateFinance';
import { supabase } from '../../lib/supabase';
import { createFinanceEntry } from '../../lib/financeEntries';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface FinanceCaptureModalProps {
  onClose: () => void;
  onSaved?: () => void;
  accounts?: FinanceAccount[];
  goals?: FinanceGoal[];
  initialGoalId?: string | null;
  currencySymbol?: '$' | '₱';
  currencyCode?: 'USD' | 'PHP';
}

type TransactionType = 'income' | 'expense' | 'goal' | 'transfer';
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

const defaultCategorySets: Record<TransactionType, string[]> = {
  income: ['Salary', 'Gift', 'Investment', 'Refund'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills'],
  transfer: [],
  goal: []
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const normalizeCategorySets = (value: unknown) => {
  const normalized = { ...defaultCategorySets };
  if (!value || typeof value !== 'object') return normalized;
  const record = value as Record<string, unknown>;
  (Object.keys(defaultCategorySets) as TransactionType[]).forEach((key) => {
    const entry = record[key];
    if (isStringArray(entry)) {
      normalized[key] = entry;
    }
  });
  return normalized;
};

const FinanceCaptureModal = ({
  onClose,
  onSaved,
  accounts: accountsProp,
  goals: goalsProp,
  initialGoalId = null,
  currencySymbol,
  currencyCode
}: FinanceCaptureModalProps) => {
  const { user } = useAuth();
  const resolvedCurrencyCode = currencyCode ?? (currencySymbol === '₱' ? 'PHP' : 'USD');
  const resolvedCurrencySymbol = currencySymbol ?? (resolvedCurrencyCode === 'PHP' ? '₱' : '$');
  const toastTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [type, setType] = useState<TransactionType>('expense');
  const [goalFlow, setGoalFlow] = useState<GoalFlow>('contribution');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(initialGoalId);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedDestinationAccountId, setSelectedDestinationAccountId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [categorySets, setCategorySets] = useLocalStorage('finance.categorySets.v1', defaultCategorySets);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [accounts, setAccounts] = useState<FinanceAccount[]>(accountsProp ?? []);
  const [goals, setGoals] = useState<FinanceGoal[]>(goalsProp ?? []);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(false);

  const transactionTypes: Array<{
    id: TransactionType;
    label: string;
    icon: ReactNode;
    color: string;
  }> = [
    { id: 'income', label: 'Income', icon: <ArrowDownLeft size={14} />, color: 'text-emerald-500' },
    { id: 'expense', label: 'Expense', icon: <ArrowUpRight size={14} />, color: 'text-rose-500' },
    { id: 'transfer', label: 'Transfer', icon: <ArrowLeftRight size={14} />, color: 'text-blue-600' },
    { id: 'goal', label: 'Goal', icon: <Target size={14} />, color: 'text-purple-600' },
  ];

  const currentTypeData = transactionTypes.find(t => t.id === type) ?? transactionTypes[0];
  const safeCategorySets = useMemo(() => normalizeCategorySets(categorySets), [categorySets]);
  const categoriesForType = safeCategorySets[type] ?? [];
  const transferAmount = amount === null ? 0 : Math.abs(amount);
  const goalSelectedAccount = selectedAccountId
    ? accounts.find((account) => account.id === selectedAccountId) ?? null
    : null;
  const goalHasInsufficientFunds =
    type === 'goal' &&
    goalFlow === 'contribution' &&
    !!goalSelectedAccount &&
    !hasSufficientBalance(goalSelectedAccount.balance, transferAmount);
  const isConfirmDisabled =
    isSaving || !user || (type === 'goal' && (!selectedAccountId || goalHasInsufficientFunds));

  const formatMoney = (value: number) => {
    const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${resolvedCurrencySymbol}${formatted}`;
  };

  const showToast = (nextToast: { type: 'success' | 'error'; message: string }) => {
    setToast(nextToast);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

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
    if (selectedDestinationAccountId || accounts.length === 0) {
      return;
    }
    if (accounts.length === 1) {
      setSelectedDestinationAccountId(null);
      return;
    }
    const fallback = accounts.find((account) => account.id !== selectedAccountId)?.id ?? accounts[0].id;
    setSelectedDestinationAccountId(fallback);
  }, [accounts, selectedDestinationAccountId, selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId || !selectedDestinationAccountId) return;
    if (selectedAccountId !== selectedDestinationAccountId) return;
    const alternative = accounts.find((account) => account.id !== selectedAccountId)?.id ?? null;
    setSelectedDestinationAccountId(alternative);
  }, [accounts, selectedAccountId, selectedDestinationAccountId]);

  useEffect(() => {
    if (!selectedGoal && goals.length > 0) {
      setSelectedGoal(initialGoalId ?? goals[0].id);
    }
  }, [goals, selectedGoal, initialGoalId]);

  useEffect(() => {
    if (type === 'transfer' || type === 'goal') {
      setIsEditingCategories(false);
      setNewCategory('');
    }
  }, [type]);

  const addCategoryTag = () => {
    if (type === 'transfer' || type === 'goal') return;
    const trimmed = sanitizeText(newCategory).trim();
    if (!trimmed) return;

    setCategorySets((prev) => {
      const normalized = normalizeCategorySets(prev);
      const existing = normalized[type] ?? [];
      const matched = existing.find((item) => item.toLowerCase() === trimmed.toLowerCase());
      if (matched) {
        setCategory(matched);
        return normalized;
      }
      return { ...normalized, [type]: [...existing, trimmed] };
    });

    setCategory(trimmed);
    setNewCategory('');
  };

  const removeCategoryTag = (tag: string) => {
    if (type === 'transfer' || type === 'goal') return;
    setCategorySets((prev) => {
      const normalized = normalizeCategorySets(prev);
      const existing = normalized[type] ?? [];
      const next = existing.filter((item) => item.toLowerCase() !== tag.toLowerCase());
      return { ...normalized, [type]: next };
    });
    if (category.toLowerCase() === tag.toLowerCase()) {
      setCategory('');
    }
  };

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

    if (type === 'transfer') {
      if (!selectedAccountId || !selectedDestinationAccountId) {
        setError('Choose both accounts.');
        return;
      }
      if (selectedAccountId === selectedDestinationAccountId) {
        setError('Choose two different accounts.');
        return;
      }

      const sourceAccount = accounts.find((item) => item.id === selectedAccountId);
      const destinationAccount = accounts.find((item) => item.id === selectedDestinationAccountId);
      if (!sourceAccount || !destinationAccount) {
        setError('Account not found.');
        return;
      }

      entryAmount = baseAmount;
      entryCategory = 'Transfer';

      setIsSaving(true);
      setError(null);

      const { error: transferError } = await supabase.rpc('handle_transfer', {
        p_from_account_id: sourceAccount.id,
        p_to_account_id: destinationAccount.id,
        p_amount: baseAmount,
        p_currency_code: resolvedCurrencyCode,
        p_note: safeNote || null
      });

      if (transferError) {
        setIsSaving(false);
        showToast({ type: 'error', message: 'Transfer failed. Please try again.' });
        return;
      }

      setIsSaving(false);
      showToast({ type: 'success', message: `Transferred ${formatMoney(baseAmount)} successfully!` });
      closeTimeoutRef.current = window.setTimeout(() => {
        onSaved?.();
        onClose();
      }, 600);
      return;
    }

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
      if (!selectedAccountId) {
        setError('Choose an account.');
        return;
      }
      const fundingAccount = goalSelectedAccount;
      if (!fundingAccount) {
        setError('Account not found.');
        return;
      }

      const signedGoalAmount = goalFlow === 'withdrawal' ? -baseAmount : baseAmount;
      const nextCurrent = goal.current + signedGoalAmount;

      if (nextCurrent < 0) {
        setError('Cannot withdraw more than the goal balance.');
        return;
      }
      if (goalFlow === 'contribution' && !hasSufficientBalance(fundingAccount.balance, baseAmount)) {
        setError('Insufficient funds in the selected account.');
        return;
      }

      setIsSaving(true);
      setError(null);

      const { error: goalError } = await supabase.rpc('handle_goal_transaction', {
        p_goal_id: goal.id,
        p_account_id: fundingAccount.id,
        p_amount: baseAmount,
        p_flow: goalFlow,
        p_currency_code: resolvedCurrencyCode,
        p_note: safeNote || null
      });

      if (goalError) {
        setIsSaving(false);
        showToast({ type: 'error', message: 'Goal update failed. Please try again.' });
        return;
      }

      setIsSaving(false);
      showToast({
        type: 'success',
        message: goalFlow === 'contribution'
          ? `${formatMoney(baseAmount)} added to ${goal.name}!`
          : `${formatMoney(baseAmount)} withdrawn from ${goal.name}!`
      });
      closeTimeoutRef.current = window.setTimeout(() => {
        onSaved?.();
        onClose();
      }, 600);
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
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })},{' '}
                {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
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
              <span className={`text-3xl mr-1 self-start mt-4 opacity-20 ${currentTypeData.color}`}>{resolvedCurrencySymbol}</span>
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
            {type === 'transfer' ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Wallet size={10} /> FROM ACCOUNT
                </p>
                {accountsLoading ? (
                  <div className="text-[10px] font-bold text-slate-400">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                  <div className="text-[10px] font-bold text-slate-400">No accounts found.</div>
                ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts.map((account) => {
                    const isSelected = selectedAccountId === account.id;
                    const isDisabled = account.id === selectedDestinationAccountId;
                    const isOverdraft = isSelected && transferAmount > account.balance;
                    return (
                      <button
                        key={account.id}
                        onClick={() => setSelectedAccountId(account.id)}
                        disabled={isDisabled}
                        className={`px-4 py-2 rounded-2xl text-left text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-black text-white shadow-md'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <span className="block">{account.name} - {account.lastFour}</span>
                        {isSelected && (
                          <span className={`mt-1 block text-[9px] font-semibold ${isOverdraft ? 'text-rose-500' : 'text-slate-300'}`}>
                            Current: {formatMoney(account.balance)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                )}
              </div>
            ) : type !== 'goal' ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Tag size={10} /> Category
                  </p>
                  {(type === 'income' || type === 'expense') && (
                    <button
                      type="button"
                      onClick={() => setIsEditingCategories((prev) => !prev)}
                      className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-slate-500"
                    >
                      {isEditingCategories ? 'Done' : 'Edit'}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoriesForType.map((cat) => (
                    isEditingCategories ? (
                      <div
                        key={cat}
                        className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${
                          category.toLowerCase() === cat.toLowerCase()
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCategory(cat)}
                          className="text-[10px] font-bold"
                        >
                          {cat}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCategoryTag(cat)}
                          className={`flex h-5 w-5 items-center justify-center rounded-full ${
                            category.toLowerCase() === cat.toLowerCase()
                              ? 'bg-white/20 text-white'
                              : 'bg-white text-slate-400'
                          }`}
                          aria-label={`Remove ${cat}`}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-bold transition-all ${
                          category === cat 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  ))}
                  {!isEditingCategories && categoriesForType.length === 0 && (
                    <span className="text-[10px] font-bold text-slate-400">No categories yet.</span>
                  )}
                </div>
                {isEditingCategories && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      placeholder="Add category"
                      value={newCategory}
                      onChange={(event) => setNewCategory(sanitizeText(event.target.value))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addCategoryTag();
                        }
                      }}
                      className="flex-1 rounded-2xl bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-700 outline-none placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={addCategoryTag}
                      className="rounded-2xl bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {type === 'transfer' ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Wallet size={10} /> TO ACCOUNT
                </p>
                {accountsLoading ? (
                  <div className="text-[10px] font-bold text-slate-400">Loading accounts...</div>
                ) : accounts.length < 2 ? (
                  <div className="text-[10px] font-bold text-slate-400">Add another account to transfer.</div>
                ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts.map((account) => {
                    const isSelected = selectedDestinationAccountId === account.id;
                    const isDisabled = account.id === selectedAccountId;
                    const nextBalance = account.balance + transferAmount;
                    return (
                      <button
                        key={account.id}
                        onClick={() => setSelectedDestinationAccountId(account.id)}
                        disabled={isDisabled}
                        className={`px-4 py-2 rounded-2xl text-left text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-black text-white shadow-md'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <span className="block">{account.name} - {account.lastFour}</span>
                        {isSelected && (
                          <span className="mt-1 block text-[9px] font-semibold text-blue-200">
                            After: {formatMoney(nextBalance)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                )}
              </div>
            ) : type !== 'goal' ? (
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
            ) : null}

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

            {type === 'goal' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Wallet size={10} /> {goalFlow === 'contribution' ? 'FUND FROM' : 'WITHDRAW TO'}
                </p>
                {accountsLoading ? (
                  <div className="text-[10px] font-bold text-slate-400">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                  <div className="text-[10px] font-bold text-slate-400">No accounts found.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((account) => {
                      const isSelected = selectedAccountId === account.id;
                      const isInsufficient =
                        isSelected &&
                        goalFlow === 'contribution' &&
                        !hasSufficientBalance(account.balance, transferAmount);
                      const projectedBalance = goalFlow === 'contribution'
                        ? account.balance - transferAmount
                        : account.balance + transferAmount;

                      return (
                        <button
                          key={account.id}
                          onClick={() => setSelectedAccountId(account.id)}
                          className={`px-4 py-2 rounded-2xl text-left text-[10px] font-bold transition-all ${
                            isSelected
                              ? 'bg-black text-white shadow-md'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <span className="block">{account.name} - {account.lastFour}</span>
                          {isSelected && (
                            <>
                              <span className={`mt-1 block text-[9px] font-semibold ${isInsufficient ? 'text-rose-500' : 'text-slate-300'}`}>
                                Current: {formatMoney(account.balance)}
                              </span>
                              <span className="mt-1 block text-[9px] font-semibold text-blue-200">
                                Projected Balance: {formatMoney(projectedBalance)}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
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
            disabled={isConfirmDisabled}
            className={`w-full py-5 rounded-[2rem] font-black text-base active:scale-95 transition-all shadow-xl disabled:opacity-60 disabled:cursor-not-allowed ${
              type === 'income' ? 'bg-emerald-500 text-white shadow-emerald-200/50' :
              type === 'expense' ? 'bg-black text-white shadow-slate-200/50' :
              type === 'transfer' ? 'bg-blue-600 text-white shadow-blue-200/50' :
              'bg-purple-600 text-white shadow-purple-200/50'
            }`}
          >
            {isSaving ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                Saving...
              </span>
            ) : 'Confirm Entry'}
          </button>
          {error && <p className="mt-3 text-xs font-semibold text-rose-500 text-center">{error}</p>}
          {toast && (
            <div
              className={`mt-3 rounded-2xl px-4 py-2 text-center text-xs font-semibold ${
                toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {toast.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceCaptureModal;
