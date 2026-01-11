import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { listFinanceEntries, type FinanceEntryRow } from '../../../lib/financeEntries';
import type { FinanceAccount, FinanceGoal, FinanceTransaction } from '../../../types';
import { accountColors, goalColors } from '../constants';
import { normalizeCadence } from '../utils/financeCadence';
import { formatEntryDate } from '../utils/financeDates';
import { getTransactionIcon } from '../utils/financeIcons';
import type {
  ActivityTransaction,
  BillFormInput,
  BillItem,
  FinanceAccountRow,
  FinanceBillRow,
  FinanceGoalRow,
  FinanceSubscriptionRow,
  SubscriptionFormInput,
  SubscriptionItem
} from '../types';

type UseFinanceDataParams = {
  user: { id: string } | null;
  refreshToken?: number;
};

const useFinanceData = ({ user, refreshToken = 0 }: UseFinanceDataParams) => {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [transactions, setTransactions] = useState<ActivityTransaction[]>([]);
  const [rawEntries, setRawEntries] = useState<FinanceEntryRow[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);

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

  const fetchAccounts = useCallback(async () => {
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
    setAccounts(
      rows.map((row) => ({
        id: row.id,
        name: row.name ?? 'Account',
        balance: Number(row.balance) || 0,
        color: row.color ?? accountColors[0],
        lastFour: row.last_four ?? '0000'
      }))
    );
    setAccountsLoading(false);
  }, [user]);

  const fetchGoals = useCallback(async () => {
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
    setGoals(
      rows.map((row) => ({
        id: row.id,
        name: row.name ?? 'Goal',
        target: Number(row.target) || 0,
        current: Number(row.current) || 0,
        color: row.color ?? goalColors[0]
      }))
    );
    setGoalsLoading(false);
  }, [user]);

  const fetchEntries = useCallback(async () => {
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

    const mapped = entries
      .map((entry) => {
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
      })
      .sort((a, b) => b.createdAtTime - a.createdAtTime);

    setTransactions(mapped);
    setEntriesLoading(false);
  }, [user]);

  const fetchBills = useCallback(async () => {
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
    setBills(
      rows.map((row) => ({
        id: row.id,
        name: row.name ?? 'Bill',
        amount: Number(row.amount) || 0,
        cadence: normalizeCadence(row.cadence),
        nextDueDate: row.next_due_date ?? null,
        accountId: row.account_id ?? null,
        reminderDays: row.reminder_days !== null ? Number(row.reminder_days) : null,
        active: row.active ?? true
      }))
    );
    setBillsLoading(false);
  }, [user]);

  const fetchSubscriptions = useCallback(async () => {
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
    setSubscriptions(
      rows.map((row) => ({
        id: row.id,
        name: row.name ?? 'Subscription',
        amount: Number(row.amount) || 0,
        cadence: normalizeCadence(row.cadence),
        nextDueDate: row.next_due_date ?? null,
        accountId: row.account_id ?? null,
        reminderDays: row.reminder_days !== null ? Number(row.reminder_days) : null,
        active: row.active ?? true
      }))
    );
    setSubscriptionsLoading(false);
  }, [user]);

  const createAccount = useCallback(
    async (payload: { name: string; balance: number; color: string; lastFour: string }) => {
      if (!user) return 'Sign in to save accounts.';
      const { error } = await supabase.from('finance_accounts').insert({
        user_id: user.id,
        name: payload.name,
        balance: payload.balance,
        color: payload.color,
        last_four: payload.lastFour
      });

      if (error) {
        return 'Failed to create account.';
      }

      fetchAccounts();
      return null;
    },
    [fetchAccounts, user]
  );

  const updateAccount = useCallback(
    async (id: string, payload: { name: string; color: string }) => {
      if (!user) return 'Sign in to save accounts.';
      const { error } = await supabase.from('finance_accounts').update(payload).eq('id', id);

      if (error) {
        return 'Failed to update account.';
      }

      fetchAccounts();
      return null;
    },
    [fetchAccounts, user]
  );

  const createGoal = useCallback(
    async (payload: { name: string; target: number; current: number; color: string }) => {
      if (!user) return 'Sign in to save goals.';
      const { error } = await supabase.from('finance_goals').insert({
        user_id: user.id,
        name: payload.name,
        target: payload.target,
        current: payload.current,
        color: payload.color
      });

      if (error) {
        return 'Failed to create goal.';
      }

      fetchGoals();
      return null;
    },
    [fetchGoals, user]
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      if (!user) return 'Sign in to delete goals.';
      const { error } = await supabase.from('finance_goals').delete().eq('id', goalId);

      if (error) {
        return 'Failed to delete goal.';
      }

      fetchGoals();
      return null;
    },
    [fetchGoals, user]
  );

  const createBill = useCallback(
    async (input: BillFormInput) => {
      if (!user) return 'Sign in to add bills.';

      const { error } = await supabase.from('finance_bills').insert({
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
    },
    [fetchBills, user]
  );

  const updateBill = useCallback(
    async (id: string, input: BillFormInput) => {
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
    },
    [fetchBills, user]
  );

  const deleteBill = useCallback(
    async (id: string) => {
      if (!user) return 'Sign in to delete bills.';

      const { error } = await supabase.from('finance_bills').delete().eq('id', id).eq('user_id', user.id);

      if (error) {
        return 'Failed to delete bill.';
      }

      fetchBills();
      return null;
    },
    [fetchBills, user]
  );

  const createSubscription = useCallback(
    async (input: SubscriptionFormInput) => {
      if (!user) return 'Sign in to add subscriptions.';

      const { error } = await supabase.from('finance_subscriptions').insert({
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
    },
    [fetchSubscriptions, user]
  );

  const updateSubscription = useCallback(
    async (id: string, input: SubscriptionFormInput) => {
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
    },
    [fetchSubscriptions, user]
  );

  const deleteSubscription = useCallback(
    async (id: string) => {
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
    },
    [fetchSubscriptions, user]
  );

  const deleteFinanceEntry = useCallback(
    async (id: string) => {
      if (!user) return 'Sign in to delete transactions.';

      const { error } = await supabase.from('finance_entries').delete().eq('id', id).eq('user_id', user.id);

      if (error) {
        return 'Failed to delete transaction.';
      }

      return null;
    },
    [user]
  );

  const updateEntryCategory = useCallback(
    async (id: string, category: string) => {
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
    },
    [user]
  );

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
  }, [fetchAccounts, fetchBills, fetchEntries, fetchGoals, fetchSubscriptions, refreshToken, user]);

  return {
    accounts,
    goals,
    transactions,
    rawEntries,
    bills,
    subscriptions,
    setTransactions,
    setRawEntries,
    accountsLoading,
    goalsLoading,
    entriesLoading,
    billsLoading,
    subscriptionsLoading,
    accountsError,
    goalsError,
    entriesError,
    billsError,
    subscriptionsError,
    fetchAccounts,
    fetchGoals,
    fetchEntries,
    fetchBills,
    fetchSubscriptions,
    createAccount,
    updateAccount,
    createGoal,
    deleteGoal,
    createBill,
    updateBill,
    deleteBill,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    deleteFinanceEntry,
    updateEntryCategory
  };
};

export default useFinanceData;
