import { useEffect, useMemo, useRef, useState } from 'react';
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
import { NavigationContainer } from '@react-navigation/native';
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

  const transactionTypes: Array<{
    id: TransactionType;
    label: string;
    icon: ReactNode;
    accent: string;
  }> = [
    { id: 'income', label: 'Income', icon: <ArrowDownLeft size={14} color="#10b981" />, accent: '#10b981' },
    { id: 'expense', label: 'Expense', icon: <ArrowUpRight size={14} color="#f43f5e" />, accent: '#f43f5e' },
    { id: 'transfer', label: 'Transfer', icon: <ArrowLeftRight size={14} color="#2563eb" />, accent: '#2563eb' },
    { id: 'goal', label: 'Goal', icon: <Target size={14} color="#7c3aed" />, accent: '#7c3aed' }
  ];

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
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <NavigationContainer independent>
        <View className="flex-1 items-center justify-end px-4 pb-10">
          <BlurView intensity={45} tint="dark" className="absolute inset-0" pointerEvents="none" />
          <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />

          <View className="w-full max-w-sm rounded-[3.5rem] bg-white overflow-hidden shadow-2xl">
            <ScrollView contentContainerStyle={{ padding: 28 }} showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center px-3 py-1 bg-slate-50 rounded-full">
                  <View className="mr-2">
                    <Calendar size={12} color="#94a3b8" />
                  </View>
                  <Text className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })},{' '}
                    {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <Pressable onPress={onClose} className="p-2.5 bg-slate-50 rounded-full">
                  <X size={18} color="#94a3b8" />
                </Pressable>
              </View>

              <View className="mb-8 p-1 bg-slate-100 rounded-[2rem] flex-row items-center">
                {transactionTypes.map((t) => {
                  const active = type === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => {
                        setType(t.id);
                        setCategory('');
                      }}
                      className={`flex-1 py-3.5 rounded-[1.7rem] flex-row items-center justify-center ${active ? 'bg-white shadow-sm' : ''}`}
                    >
                      <View className="flex-row items-center">
                        <View className="mr-2">
                          {t.icon}
                        </View>
                        <Text className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-black' : 'text-slate-400'}`}>
                          {t.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View className="items-center mb-8">
                <View className="flex-row items-center justify-center">
                  <Text className="text-3xl mr-1 self-start mt-4 opacity-40" style={{ color: currentTypeData.accent }}>
                    {resolvedCurrencySymbol}
                  </Text>
                  <TextInput
                    placeholder="0"
                    value={amount === null ? '' : String(amount)}
                    onChangeText={(next) => setAmount(next === '' ? null : Number(next))}
                    keyboardType="numeric"
                    className="w-48 text-center text-5xl font-black text-slate-900"
                    placeholderTextColor="#e2e8f0"
                  />
                </View>
              </View>

            <View className="mb-8">
              {type === 'transfer' ? (
                <View className="mb-6">
                  <Text className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em]">From account</Text>
                  {accountsLoading ? (
                    <Text className="text-[10px] font-bold text-slate-400">Loading accounts...</Text>
                  ) : accounts.length === 0 ? (
                    <Text className="text-[10px] font-bold text-slate-400">No accounts found.</Text>
                  ) : (
                    <View className="flex-row flex-wrap">
                      {accounts.map((account) => {
                        const isSelected = selectedAccountId === account.id;
                        const isDisabled = account.id === selectedDestinationAccountId;
                        const isOverdraft = isSelected && transferAmount > account.balance;
                        return (
                          <Pressable
                            key={account.id}
                            onPress={() => setSelectedAccountId(account.id)}
                            disabled={isDisabled}
                            className={`px-4 py-2 rounded-2xl mb-2 mr-2 ${
                              isSelected ? 'bg-black' : 'bg-slate-50'
                            } ${isDisabled ? 'opacity-40' : ''}`}
                          >
                            <Text className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {account.name} - {account.lastFour}
                            </Text>
                            {isSelected && (
                              <Text className={`mt-1 text-[9px] font-semibold ${isOverdraft ? 'text-rose-500' : 'text-slate-300'}`}>
                                Current: {formatMoney(account.balance)}
                              </Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              ) : type !== 'goal' ? (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Category</Text>
                    {(type === 'income' || type === 'expense') && (
                      <Pressable onPress={() => setIsEditingCategories((prev) => !prev)}>
                        <Text className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                          {isEditingCategories ? 'Done' : 'Edit'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <View className="flex-row flex-wrap">
                    {categoriesForType.map((cat) => (
                      isEditingCategories ? (
                        <View
                          key={cat}
                          className={`flex-row items-center rounded-2xl px-3 py-2 mr-2 mb-2 ${
                            category.toLowerCase() === cat.toLowerCase() ? 'bg-slate-900' : 'bg-slate-50'
                          }`}
                        >
                          <Pressable onPress={() => setCategory(cat)}>
                            <Text className={`text-[10px] font-bold ${category.toLowerCase() === cat.toLowerCase() ? 'text-white' : 'text-slate-400'}`}>
                              {cat}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => removeCategoryTag(cat)}
                            className={`ml-2 h-5 w-5 items-center justify-center rounded-full ${
                              category.toLowerCase() === cat.toLowerCase() ? 'bg-white/20' : 'bg-white'
                            }`}
                            accessibilityLabel={`Remove ${cat}`}
                          >
                            <X size={10} color={category.toLowerCase() === cat.toLowerCase() ? '#ffffff' : '#94a3b8'} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          key={cat}
                          onPress={() => setCategory(cat)}
                          className={`px-4 py-2 rounded-2xl mr-2 mb-2 ${
                            category === cat ? 'bg-slate-900' : 'bg-slate-50'
                          }`}
                        >
                          <Text className={`text-[10px] font-bold ${category === cat ? 'text-white' : 'text-slate-400'}`}>
                            {cat}
                          </Text>
                        </Pressable>
                      )
                    ))}
                    {!isEditingCategories && categoriesForType.length === 0 && (
                      <Text className="text-[10px] font-bold text-slate-400">No categories yet.</Text>
                    )}
                  </View>
                  {isEditingCategories && (
                    <View className="mt-3 flex-row items-center">
                      <TextInput
                        placeholder="Add category"
                        value={newCategory}
                        onChangeText={(value) => setNewCategory(sanitizeText(value))}
                        onSubmitEditing={addCategoryTag}
                        className="flex-1 rounded-2xl bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-700"
                        placeholderTextColor="#cbd5f5"
                      />
                      <Pressable
                        onPress={addCategoryTag}
                        className="ml-2 rounded-2xl bg-black px-4 py-2"
                      >
                        <Text className="text-[10px] font-bold uppercase tracking-widest text-white">Add</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ) : null}

              {type === 'transfer' ? (
                <View className="mb-6">
                  <Text className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em]">To account</Text>
                  {accountsLoading ? (
                    <Text className="text-[10px] font-bold text-slate-400">Loading accounts...</Text>
                  ) : accounts.length < 2 ? (
                    <Text className="text-[10px] font-bold text-slate-400">Add another account to transfer.</Text>
                  ) : (
                    <View className="flex-row flex-wrap">
                      {accounts.map((account) => {
                        const isSelected = selectedDestinationAccountId === account.id;
                        const isDisabled = account.id === selectedAccountId;
                        const nextBalance = account.balance + transferAmount;
                        return (
                          <Pressable
                            key={account.id}
                            onPress={() => setSelectedDestinationAccountId(account.id)}
                            disabled={isDisabled}
                            className={`px-4 py-2 rounded-2xl mb-2 mr-2 ${
                              isSelected ? 'bg-black' : 'bg-slate-50'
                            } ${isDisabled ? 'opacity-40' : ''}`}
                          >
                            <Text className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {account.name} - {account.lastFour}
                            </Text>
                            {isSelected && (
                              <Text className="mt-1 text-[9px] font-semibold text-blue-200">
                                After: {formatMoney(nextBalance)}
                              </Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              ) : type !== 'goal' ? (
                <View className="mb-6">
                  <Text className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em]">Account</Text>
                  {accountsLoading ? (
                    <Text className="text-[10px] font-bold text-slate-400">Loading accounts...</Text>
                  ) : accounts.length === 0 ? (
                    <Text className="text-[10px] font-bold text-slate-400">No accounts found.</Text>
                  ) : (
                    <View className="flex-row flex-wrap">
                      {accounts.map((account) => (
                        <Pressable
                          key={account.id}
                          onPress={() => setSelectedAccountId(account.id)}
                          className={`px-4 py-2 rounded-2xl mb-2 mr-2 ${
                            selectedAccountId === account.id ? 'bg-black' : 'bg-slate-50'
                          }`}
                        >
                          <Text className={`text-[10px] font-bold ${selectedAccountId === account.id ? 'text-white' : 'text-slate-400'}`}>
                            {account.name} - {account.lastFour}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}

              {type === 'goal' && (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      Destination
                    </Text>
                    <View className="flex-row items-center rounded-full bg-purple-50 p-1">
                      <Pressable
                        onPress={() => setGoalFlow('contribution')}
                        className={`px-3 py-1 rounded-full ${goalFlow === 'contribution' ? 'bg-white' : ''}`}
                      >
                        <Text className={`text-[9px] font-bold uppercase tracking-widest ${goalFlow === 'contribution' ? 'text-purple-700' : 'text-purple-300'}`}>
                          Add
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setGoalFlow('withdrawal')}
                        className={`px-3 py-1 rounded-full ${goalFlow === 'withdrawal' ? 'bg-white' : ''}`}
                      >
                        <Text className={`text-[9px] font-bold uppercase tracking-widest ${goalFlow === 'withdrawal' ? 'text-purple-700' : 'text-purple-300'}`}>
                          Withdraw
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View className="mt-4 flex-row flex-wrap">
                    {goalsLoading ? (
                      <View className="w-full py-4 px-4 bg-slate-50 rounded-2xl">
                        <Text className="text-[10px] font-bold text-slate-400 text-center italic">Loading goals...</Text>
                      </View>
                    ) : goals.length > 0 ? (
                      goals.map((goal) => (
                        <Pressable
                          key={goal.id}
                          onPress={() => setSelectedGoal(goal.id)}
                          className={`p-4 rounded-2xl border-2 mb-2 mr-2 flex-row items-center justify-between ${
                            selectedGoal === goal.id ? 'border-purple-600 bg-purple-50' : 'border-slate-50 bg-slate-50'
                          }`}
                        >
                          <Text className={`text-[10px] font-black ${selectedGoal === goal.id ? 'text-purple-700' : 'text-slate-400'}`}>
                            {goal.name}
                          </Text>
                          {selectedGoal === goal.id && <Check size={12} color="#7c3aed" />}
                        </Pressable>
                      ))
                    ) : (
                      <View className="w-full py-4 px-4 bg-slate-50 rounded-2xl">
                        <Text className="text-[10px] font-bold text-slate-400 text-center italic">No active goals found</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {type === 'goal' && (
                <View className="mb-6">
                  <Text className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em]">
                    {goalFlow === 'contribution' ? 'Fund from' : 'Withdraw to'}
                  </Text>
                  {accountsLoading ? (
                    <Text className="text-[10px] font-bold text-slate-400">Loading accounts...</Text>
                  ) : accounts.length === 0 ? (
                    <Text className="text-[10px] font-bold text-slate-400">No accounts found.</Text>
                  ) : (
                    <View className="flex-row flex-wrap">
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
                          <Pressable
                            key={account.id}
                            onPress={() => setSelectedAccountId(account.id)}
                            className={`px-4 py-2 rounded-2xl mb-2 mr-2 ${isSelected ? 'bg-black' : 'bg-slate-50'}`}
                          >
                            <Text className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                              {account.name} - {account.lastFour}
                            </Text>
                            {isSelected && (
                              <>
                                <Text className={`mt-1 text-[9px] font-semibold ${isInsufficient ? 'text-rose-500' : 'text-slate-300'}`}>
                                  Current: {formatMoney(account.balance)}
                                </Text>
                                <Text className="mt-1 text-[9px] font-semibold text-blue-200">
                                  Projected Balance: {formatMoney(projectedBalance)}
                                </Text>
                              </>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              <View className="mb-6">
                <Pressable onPress={() => setShowNotes(!showNotes)}>
                  <Text className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    {showNotes ? 'Remove Note' : 'Add Note'}
                  </Text>
                </Pressable>
                {showNotes && (
                  <TextInput
                    placeholder="What was this for?"
                    className="w-full mt-3 p-4 bg-slate-50 rounded-3xl text-sm text-slate-700"
                    placeholderTextColor="#cbd5f5"
                    value={note}
                    onChangeText={(value) => setNote(sanitizeText(value))}
                    multiline
                    textAlignVertical="top"
                  />
                )}
              </View>
            </View>

            <Pressable
              onPress={handleConfirm}
              disabled={isConfirmDisabled}
              className={`w-full py-5 rounded-[2rem] shadow-xl ${
                type === 'income'
                  ? 'bg-emerald-500'
                  : type === 'expense'
                    ? 'bg-black'
                    : type === 'transfer'
                      ? 'bg-blue-600'
                      : 'bg-purple-600'
              } ${isConfirmDisabled ? 'opacity-60' : ''}`}
            >
              {isSaving ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text className="ml-2 font-black text-base text-white">Saving...</Text>
                </View>
              ) : (
                <Text className="text-center font-black text-base text-white">Confirm Entry</Text>
              )}
            </Pressable>
            {error && <Text className="mt-3 text-xs font-semibold text-rose-500 text-center">{error}</Text>}
              {toast && (
                <View
                  className={`mt-3 rounded-2xl px-4 py-2 ${
                    toast.type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}
                >
                  <Text className={`text-center text-xs font-semibold ${toast.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {toast.message}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </NavigationContainer>
    </Modal>
  );
};

export default FinanceCaptureModal;
