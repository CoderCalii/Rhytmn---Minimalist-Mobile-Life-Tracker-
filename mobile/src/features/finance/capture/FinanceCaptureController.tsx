import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FinanceAccount, FinanceGoal } from '../../../types';
import { sanitizeText } from '../../../utils/sanitize';
import { hasSufficientBalance, validateAmount } from '../utils/validateFinance';
import { supabase } from '../../../lib/supabase';
import { createFinanceEntry } from '../../../lib/financeEntries';
import { useAuth } from '../../../hooks/useAuth';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { defaultCategorySets } from './capture.constants';
import type { FinanceAccountRow, FinanceGoalRow, FinanceCaptureModalProps, GoalFlow, TransactionType } from './capture.types';
import { transactionTypes } from './components/transactionTypes';
import { FinanceCaptureView } from './FinanceCaptureView';

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

export const FinanceCaptureController = ({
  onClose,
  onSaved,
  accounts: accountsProp,
  goals: goalsProp,
  initialGoalId = null,
  initialType = null,
  currencySymbol,
  currencyCode
}: FinanceCaptureModalProps) => {
  const { user } = useAuth();
  const resolvedCurrencyCode = currencyCode ?? (currencySymbol === 'ƒ,ñ' ? 'PHP' : 'USD');
  const resolvedCurrencySymbol = currencySymbol ?? (resolvedCurrencyCode === 'PHP' ? 'ƒ,ñ' : '$');
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [type, setType] = useState<TransactionType>(initialType ?? 'expense');
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

  const currentTypeData = transactionTypes.find((t) => t.id === type) ?? transactionTypes[0];
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
  
  const goalAccountIsOverdraft = selectedAccountId && goalFlow === 'contribution' && type === 'goal'
    ? !hasSufficientBalance(accounts.find(a => a.id === selectedAccountId)?.balance ?? 0, transferAmount)
    : false;

  const formatMoney = (value: number) => {
    const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${resolvedCurrencySymbol}${formatted}`;
  };

  const showToast = (nextToast: { type: 'success' | 'error'; message: string }) => {
    setToast(nextToast);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (accountsProp && accountsProp.length) {
      const timer = setTimeout(() => {
        setAccounts(accountsProp);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [accountsProp]);

  useEffect(() => {
    if (goalsProp && goalsProp.length) {
      const timer = setTimeout(() => {
        setGoals(goalsProp);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [goalsProp]);

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setAccounts([]);
        setGoals([]);
        setAccountsLoading(false);
        setGoalsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;

    if (!accountsProp || accountsProp.length === 0) {
      setTimeout(() => {
        setAccountsLoading(true);
      }, 0);
      supabase
        .from('finance_accounts')
        .select('id, name, balance, color, last_four')
        .order('created_at', { ascending: false })
        .then(({ data, error: fetchError }) => {
          if (!isMounted) return;
          if (!fetchError) {
            const rows = (data ?? []) as FinanceAccountRow[];
            setAccounts(
              rows.map((row) => ({
                id: row.id,
                name: row.name ?? 'Account',
                balance: Number(row.balance) || 0,
                color: row.color ?? 'bg-black',
                lastFour: row.last_four ?? '0000'
              }))
            );
          }
          setAccountsLoading(false);
        });
    }

    if (!goalsProp || goalsProp.length === 0) {
      setTimeout(() => {
        setGoalsLoading(true);
      }, 0);
      supabase
        .from('finance_goals')
        .select('id, name, target, current, color')
        .order('created_at', { ascending: false })
        .then(({ data, error: fetchError }) => {
          if (!isMounted) return;
          if (!fetchError) {
            const rows = (data ?? []) as FinanceGoalRow[];
            setGoals(
              rows.map((row) => ({
                id: row.id,
                name: row.name ?? 'Goal',
                target: Number(row.target) || 0,
                current: Number(row.current) || 0,
                color: row.color ?? 'bg-purple-50'
              }))
            );
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
      setTimeout(() => {
        setSelectedAccountId(accounts[0].id);
      }, 0);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (selectedDestinationAccountId || accounts.length === 0) {
      return;
    }
    if (accounts.length === 1) {
      setTimeout(() => {
        setSelectedDestinationAccountId(null);
      }, 0);
      return;
    }
    const fallback = accounts.find((account) => account.id !== selectedAccountId)?.id ?? accounts[0].id;
    setTimeout(() => {
      setSelectedDestinationAccountId(fallback);
    }, 0);
  }, [accounts, selectedDestinationAccountId, selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId || !selectedDestinationAccountId) return;
    if (selectedAccountId !== selectedDestinationAccountId) return;
    const alternative = accounts.find((account) => account.id !== selectedAccountId)?.id ?? null;
    setTimeout(() => {
      setSelectedDestinationAccountId(alternative);
    }, 0);
  }, [accounts, selectedAccountId, selectedDestinationAccountId]);

  useEffect(() => {
    if (!selectedGoal && goals.length > 0) {
      setTimeout(() => {
        setSelectedGoal(initialGoalId ?? goals[0].id);
      }, 0);
    }
  }, [goals, selectedGoal, initialGoalId]);

  useEffect(() => {
    if (type === 'transfer' || type === 'goal') {
      setTimeout(() => {
        setIsEditingCategories(false);
        setNewCategory('');
      }, 0);
    }
  }, [type]);

  useEffect(() => {
    if (initialType) {
      setTimeout(() => {
        setType(initialType);
      }, 0);
    }
  }, [initialType]);

  const handleTypeChange = useCallback((newType: TransactionType) => {
    setType(newType);
    setCategory('');
  }, []);

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
      closeTimeoutRef.current = setTimeout(() => {
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
      closeTimeoutRef.current = setTimeout(() => {
        onSaved?.();
        onClose();
      }, 600);
    }
  };

  return (
    <FinanceCaptureView
      date={now}
      type={type}
      amount={amount}
      category={category}
      selectedAccountId={selectedAccountId}
      selectedDestinationAccountId={selectedDestinationAccountId}
      selectedGoal={selectedGoal}
      goalFlow={goalFlow}
      accounts={accounts}
      goals={goals}
      accountsLoading={accountsLoading}
      goalsLoading={goalsLoading}
      categories={categoriesForType}
      isEditingCategories={isEditingCategories}
      newCategory={newCategory}
      showNotes={showNotes}
      note={note}
      isSaving={isSaving}
      error={error}
      toast={toast}
      isConfirmDisabled={isConfirmDisabled}
      currentTypeData={currentTypeData}
      transferAmount={transferAmount}
      currencySymbol={resolvedCurrencySymbol}
      onClose={onClose}
      onTypeChange={handleTypeChange}
      onAmountChange={setAmount}
      onCategorySelect={setCategory}
      onAccountSelect={setSelectedAccountId}
      onDestinationAccountSelect={setSelectedDestinationAccountId}
      onGoalSelect={setSelectedGoal}
      onGoalFlowChange={setGoalFlow}
      onToggleEditCategories={() => setIsEditingCategories((prev) => !prev)}
      onAddCategory={addCategoryTag}
      onRemoveCategory={removeCategoryTag}
      onNewCategoryChange={setNewCategory}
      onToggleNotes={() => setShowNotes(!showNotes)}
      onNoteChange={setNote}
      onConfirm={handleConfirm}
      formatMoney={formatMoney}
      goalAccountIsOverdraft={goalAccountIsOverdraft}
    />
  );
};

