import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  Check,
  Target,
  X
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import type { FinanceAccount, FinanceGoal } from '../../types';
import { sanitizeText } from '../../utils/sanitize';
import { hasSufficientBalance, validateAmount } from './utils/validateFinance';
import { supabase } from '../../lib/supabase';
import { createFinanceEntry } from '../../lib/financeEntries';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DummyNavigationProvider } from './components/capturemodal_components/DummyNavigationProvider';
import { TransactionTypeSelector, transactionTypes, type TransactionType } from './components/capturemodal_components/TransactionTypeSelector';
import { AmountInput } from './components/capturemodal_components/AmountInput';
import { ModalHeader } from './components/capturemodal_components/ModalHeader';
import { CategorySelector } from './components/capturemodal_components/CategorySelector';
import { AccountSelector } from './components/capturemodal_components/AccountSelector';
import { GoalSelector } from './components/capturemodal_components/GoalSelector';
import { NotesSection } from './components/capturemodal_components/NotesSection';
import { ConfirmButton } from './components/capturemodal_components/ConfirmButton';

interface FinanceCaptureModalProps {
  onClose: () => void;
  onSaved?: () => void;
  accounts?: FinanceAccount[];
  goals?: FinanceGoal[];
  initialGoalId?: string | null;
  initialType?: 'income' | 'expense' | 'goal' | 'transfer' | null;
  currencySymbol?: '$' | 'ƒ,ñ';
  currencyCode?: 'USD' | 'PHP';
}

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
    console.log('[FinanceCaptureModal] Component mounted');
    console.log('[FinanceCaptureModal] Initial props:', {
      initialType,
      initialGoalId,
      accountsCount: accountsProp?.length ?? 0,
      goalsCount: goalsProp?.length ?? 0
    });
    return () => {
      console.log('[FinanceCaptureModal] Component unmounting');
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    console.log('[FinanceCaptureModal] Type state changed:', type);
  }, [type]);

  useEffect(() => {
    console.log('[FinanceCaptureModal] Accounts changed:', accounts.length);
  }, [accounts.length]);

  useEffect(() => {
    console.log('[FinanceCaptureModal] Goals changed:', goals.length);
  }, [goals.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
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
      setAccountsLoading(false);
      setGoalsLoading(false);
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
      setGoalsLoading(true);
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

  useEffect(() => {
    if (initialType) {
      setType(initialType);
    }
  }, [initialType]);

  const handleTypeChange = useCallback((newType: TransactionType) => {
    console.log('[FinanceCaptureModal] handleTypeChange called:', newType);
    console.log('[FinanceCaptureModal] Current type:', type);
    console.log('[FinanceCaptureModal] Current state:', {
      amount,
      category,
      selectedAccountId,
      selectedDestinationAccountId,
      selectedGoal,
      goalFlow
    });
    
    // Update state directly - the DummyNavigationProvider should handle context
    try {
      setType(newType);
      setCategory('');
      console.log('[FinanceCaptureModal] State updated successfully');
    } catch (error) {
      console.error('[FinanceCaptureModal] Error in handleTypeChange:', error);
      console.error('[FinanceCaptureModal] Error stack:', error instanceof Error ? error.stack : 'No stack');
    }
  }, [type, amount, category, selectedAccountId, selectedDestinationAccountId, selectedGoal, goalFlow]);

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

  // Error boundary for navigation context errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (args[0]?.toString?.().includes('navigation context') || 
          args[0]?.toString?.().includes('NavigationContainer')) {
        console.error('[FinanceCaptureModal] Navigation context error detected:', ...args);
        console.error('[FinanceCaptureModal] Current state at error:', {
          type,
          amount,
          category,
          selectedAccountId,
          selectedDestinationAccountId,
          selectedGoal
        });
      }
      originalError(...args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, [type, amount, category, selectedAccountId, selectedDestinationAccountId, selectedGoal]);

  return (
    <Modal 
      transparent 
      visible={true} 
      animationType="slide" 
      onRequestClose={onClose}
      statusBarTranslucent
      onShow={() => console.log('[FinanceCaptureModal] Modal onShow called')}
    >
      <DummyNavigationProvider>
        <View className="flex-1 items-center justify-end px-4 pb-10">
        <BlurView intensity={45} tint="dark" className="absolute inset-0" pointerEvents="none" />
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />

          <View className="w-full max-w-sm rounded-[3.5rem] bg-white overflow-hidden shadow-2xl">
            <ScrollView contentContainerStyle={{ padding: 28 }} showsVerticalScrollIndicator={false}>
              <ModalHeader date={now} onClose={onClose} />
              <TransactionTypeSelector type={type} onTypeChange={handleTypeChange} />
              <AmountInput 
                amount={amount} 
                onAmountChange={setAmount}
                currencySymbol={resolvedCurrencySymbol}
                accentColor={currentTypeData.accent}
              />

            <View className="mb-8">
              {type === 'transfer' ? (
                <View className="mb-6">
                  <Text className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em]">From account</Text>
                  <AccountSelector
                    accounts={accounts}
                    selectedAccountId={selectedAccountId}
                    onAccountSelect={setSelectedAccountId}
                    loading={accountsLoading}
                    formatMoney={formatMoney}
                    disabledAccountId={selectedDestinationAccountId}
                    showBalance
                    isOverdraft={selectedAccountId ? (accounts.find(a => a.id === selectedAccountId)?.balance ?? 0) < transferAmount : false}
                  />
                </View>
              ) : type !== 'goal' ? (
                <CategorySelector
                  categories={categoriesForType}
                  selectedCategory={category}
                  onCategorySelect={setCategory}
                  isEditing={isEditingCategories}
                  onToggleEdit={() => setIsEditingCategories((prev) => !prev)}
                  onAddCategory={addCategoryTag}
                  onRemoveCategory={removeCategoryTag}
                  newCategory={newCategory}
                  onNewCategoryChange={setNewCategory}
                  type={type}
                />
              ) : null}

              {type === 'transfer' ? (
                <View className="mb-6">
                  <Text className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em]">To account</Text>
                  {accounts.length < 2 ? (
                    <Text className="text-[10px] font-bold text-slate-400">Add another account to transfer.</Text>
                  ) : (
                    <AccountSelector
                      accounts={accounts}
                      selectedAccountId={selectedDestinationAccountId}
                      onAccountSelect={setSelectedDestinationAccountId}
                      loading={accountsLoading}
                      formatMoney={formatMoney}
                      disabledAccountId={selectedAccountId}
                      showProjectedBalance
                      projectedBalance={selectedDestinationAccountId ? accounts.find(a => a.id === selectedDestinationAccountId)?.balance ? (accounts.find(a => a.id === selectedDestinationAccountId)!.balance + transferAmount) : undefined : undefined}
                    />
                  )}
                </View>
              ) : type !== 'goal' ? (
                <View className="mb-6">
                  <Text className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em]">Account</Text>
                  <AccountSelector
                    accounts={accounts}
                    selectedAccountId={selectedAccountId}
                    onAccountSelect={setSelectedAccountId}
                    loading={accountsLoading}
                    formatMoney={formatMoney}
                  />
                </View>
              ) : null}

              {type === 'goal' && (
                <GoalSelector
                  goals={goals}
                  selectedGoalId={selectedGoal}
                  onGoalSelect={setSelectedGoal}
                  goalFlow={goalFlow}
                  onGoalFlowChange={setGoalFlow}
                  loading={goalsLoading}
                />
              )}

              {type === 'goal' && (
                <View className="mb-6">
                  <Text className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em]">
                    {goalFlow === 'contribution' ? 'Fund from' : 'Withdraw to'}
                  </Text>
                  <AccountSelector
                    accounts={accounts}
                    selectedAccountId={selectedAccountId}
                    onAccountSelect={setSelectedAccountId}
                    loading={accountsLoading}
                    formatMoney={formatMoney}
                    showBalance
                    showProjectedBalance
                    projectedBalance={selectedAccountId
                      ? goalFlow === 'contribution'
                        ? (accounts.find(a => a.id === selectedAccountId)?.balance ?? 0) - transferAmount
                        : (accounts.find(a => a.id === selectedAccountId)?.balance ?? 0) + transferAmount
                      : undefined}
                    isOverdraft={selectedAccountId && goalFlow === 'contribution'
                      ? !hasSufficientBalance(accounts.find(a => a.id === selectedAccountId)?.balance ?? 0, transferAmount)
                      : false}
                  />
                </View>
              )}

              <NotesSection
                showNotes={showNotes}
                note={note}
                onToggleNotes={() => setShowNotes(!showNotes)}
                onNoteChange={setNote}
              />
            </View>

            <ConfirmButton
              type={type}
              isSaving={isSaving}
              isDisabled={isConfirmDisabled}
              onPress={handleConfirm}
              error={error}
              toast={toast}
            />
            </ScrollView>
          </View>
        </View>
      </DummyNavigationProvider>
    </Modal>
  );
};

export default FinanceCaptureModal;
