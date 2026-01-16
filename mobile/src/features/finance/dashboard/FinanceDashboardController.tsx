import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../hooks/useAuth';
import type { FinanceAccount } from '../../../types';
import { sanitizeText } from '../../../utils/sanitize';
import { validateAmount } from '../utils/validateFinance';
import { goalColors } from '../constants';
import { DEFAULT_ACCOUNT_COLOR_ID, normalizeAccountColor, type AccountColorId } from '../utils/financeUi';
import useDashboardConfig from '../hooks/useDashboardConfig';
import useFinanceData from '../hooks/useFinanceData';
import useFinanceInsights from '../hooks/useFinanceInsights';
import useTransactionAnimations from '../hooks/useTransactionAnimations';
import { formatEntryTime, formatShortDate } from '../utils/financeDates';
import { getRangeBadge, getRangeLabel } from '../utils/financeRanges';
import { getScrollPaddingBottom, getNavBottomOffset } from '../../../components/layout/layoutConstants';
import type { ActivityTransaction, DashboardCardId } from '../types';
import { FinanceDashboardView } from './FinanceDashboardView';
import type { FinanceDashboardViewProps } from './dashboard.types';

interface FinanceDashboardControllerProps {
  refreshToken?: number;
  currencyCode?: 'USD' | 'PHP';
  fabIntent?: { type: 'subscription' } | null;
  onFabIntentHandled?: () => void;
  onFabContextChange?: (context: 'portfolio' | 'activity' | 'subscriptions') => void;
}

export const FinanceDashboardController = ({
  refreshToken = 0,
  currencyCode = 'USD',
  fabIntent = null,
  onFabIntentHandled,
  onFabContextChange
}: FinanceDashboardControllerProps) => {
  const { user, loading: authLoading } = useAuth();
  const dashboardKey = useMemo(() => `finance.dashboard.v1.${user?.id ?? 'guest'}`, [user?.id]);
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = getScrollPaddingBottom(insets) + 48;
  const undoBottom = getNavBottomOffset(insets) + 44;

  const {
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
    fetchEntries,
    createAccount,
    updateAccount,
    deleteAccount,
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
  } = useFinanceData({ user, refreshToken });

  const {
    dashboardConfig,
    orderedDashboardCards,
    hiddenCards,
    handleCardPinToggle,
    handleCardHide,
    handleCardShow,
    handleCardDrop: handleDashboardCardDrop,
    handleCardSwipe
  } = useDashboardConfig(dashboardKey);

  const {
    thisWeekRange,
    thisWeekSummary,
    weeklyBudget,
    weeklyProgress,
    thisWeekChart,
    weeklyHelperText,
    weeklyInsight,
    topCategoriesRange,
    topCategoriesAll,
    topCategoriesTotal,
    topCategories,
    topCategoriesInsight,
    subscriptionsRange,
    categorySuggestions,
    subscriptionsSummary,
    subscriptionsInsight,
    subscriptionShare,
    anomalyCategories,
    categoryTrends,
    upcomingBillsRange,
    upcomingBills,
    upcomingBillsMonthTotal,
    upcomingBillsInsight,
    activityRange,
    filteredTransactions,
    recentTransactions,
    hasMoreActivity,
    orderedActivityGroups,
    activityInsight
  } = useFinanceInsights({
    rawEntries,
    transactions,
    bills,
    subscriptions,
    cardRanges: dashboardConfig.ranges,
    user
  });

  const { animatedTransactionIds } = useTransactionAnimations(transactions);

  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [showAllGoals, setShowAllGoals] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', balance: '', color: DEFAULT_ACCOUNT_COLOR_ID, lastFour: '' });
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
  const [draggingCardId, setDraggingCardId] = useState<DashboardCardId | null>(null);
  const [actionMenuCardId, setActionMenuCardId] = useState<DashboardCardId | null>(null);
  const [categorizeTarget, setCategorizeTarget] = useState<ActivityTransaction | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    timeoutId: ReturnType<typeof setTimeout>;
  } | null>(null);
  const [undoToast, setUndoToast] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    if (activeAccountIndex >= accounts.length) {
      // Use setTimeout to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setActiveAccountIndex(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [accounts.length, activeAccountIndex]);

  useEffect(() => {
    if (!fabIntent) return;
    if (fabIntent.type === 'subscription') {
      // Use setTimeout to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setShowSubscriptionsModal(true);
        onFabIntentHandled?.();
      }, 0);
      return () => clearTimeout(timer);
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
      // Use setTimeout to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setCustomCategory('');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [categorizeTarget]);

  const displayedGoals = useMemo(() => (showAllGoals ? goals : goals.slice(0, 2)), [goals, showAllGoals]);

  const cycleAccount = () => {
    if (accounts.length === 0) return;
    setActiveAccountIndex((prev) => (prev + 1) % accounts.length);
  };

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountForm({ name: '', balance: '', color: DEFAULT_ACCOUNT_COLOR_ID, lastFour: '' });
    setAccountSaveError(null);
    setShowAccountModal(true);
  };

  const openEditAccount = (account: FinanceAccount) => {
    setEditingAccount(account);
    setAccountForm({
      name: account.name,
      balance: account.balance.toString(),
      color: normalizeAccountColor(account.color),
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
      const safeLastFour = accountForm.lastFour.replace(/\D/g, '').slice(-4);
      if (safeLastFour.length !== 4) {
        setAccountSaving(false);
        setAccountSaveError('Enter the last 4 digits.');
        return;
      }
      
      const error = await updateAccount(editingAccount.id, { 
        name: safeName, 
        color: accountForm.color,
        lastFour: safeLastFour
      });
      setAccountSaving(false);
      if (error) {
        setAccountSaveError(error);
        return;
      }
      setShowAccountModal(false);
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

    const error = await createAccount({
      name: safeName,
      balance: balanceValue,
      color: accountForm.color,
      lastFour: safeLastFour
    });

    setAccountSaving(false);
    if (error) {
      setAccountSaveError(error);
      return;
    }
    setShowAccountModal(false);
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

    const error = await createGoal({
      name: safeName,
      target: targetValue,
      current: currentValue,
      color: goalForm.color
    });

    setGoalSaving(false);
    if (error) {
      setGoalSaveError(error);
      return;
    }

    setShowGoalModal(false);
    setGoalForm({ name: '', target: '', current: '', color: goalColors[0] });
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    await deleteGoal(goalId);
  };

  const handleDeleteAccount = async () => {
    if (!editingAccount || !user) return;
    setAccountSaving(true);
    setAccountSaveError(null);
    const error = await deleteAccount(editingAccount.id);
    setAccountSaving(false);
    if (error) {
      setAccountSaveError(error);
      return;
    }
    setShowAccountModal(false);
  };

  const openInfoModal = (title: string, description = 'Full view coming soon.') => {
    setInfoModal({ title, description });
  };

  const closeInfoModal = () => {
    setInfoModal(null);
  };

  const handleCardDrop = (targetId: DashboardCardId) => {
    handleDashboardCardDrop(draggingCardId, targetId);
    setDraggingCardId(null);
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

  const queueDeleteTransaction = (transaction: ActivityTransaction) => {
    if (!user) {
      openInfoModal('Sign in required', 'Sign in to delete transactions.');
      return;
    }

    if (pendingDelete) {
      clearTimeout(pendingDelete.timeoutId);
      deleteFinanceEntry(pendingDelete.id);
    }

    setTransactions((prev) => prev.filter((item) => item.id !== transaction.id));
    setRawEntries((prev) => prev.filter((item) => item.id !== transaction.id));
    setUndoToast({ id: transaction.id, label: 'Transaction removed.' });

    const timeoutId = setTimeout(async () => {
      setUndoToast(null);
      setPendingDelete(null);
      await deleteFinanceEntry(transaction.id);
      fetchEntries();
    }, 3000);

    setPendingDelete({ id: transaction.id, timeoutId });
  };

  const handleUndoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timeoutId);
    setPendingDelete(null);
    setUndoToast(null);
    fetchEntries();
  };

  const isActionCardPinned = actionMenuCardId
    ? dashboardConfig.pinned.includes(actionMenuCardId)
    : false;

  // Transform data to match expected types
  // topCategoriesAll needs to be transformed for dashboard view (category) but kept as-is for sheets (name)
  const transformedTopCategoriesAll = useMemo(() => topCategoriesAll.map((item) => ({ category: item.name, amount: item.amount })), [topCategoriesAll]);
  const transformedTopCategories = useMemo(() => topCategories.map((item) => ({ name: item.name, amount: item.amount })), [topCategories]);
  // For sheets, we need the original format with 'name' property
  const topCategoriesAllForSheets = topCategoriesAll;
  const transformedAnomalyCategories = useMemo(() => anomalyCategories.map((item) => ({ category: item.name, amount: item.amount })), [anomalyCategories]);
  // For InsightsSheet, we need the full anomaly data with delta
  const anomalyCategoriesForSheets = useMemo(() => anomalyCategories.map((item) => ({
    name: item.name,
    amount: item.amount,
    delta: item.delta ?? 0
  })), [anomalyCategories]);
  const transformedCategoryTrends = useMemo(() => categoryTrends.map((item) => ({
    category: item.name,
    trend: item.delta === null ? 'stable' : item.delta > 0.1 ? 'up' : item.delta < -0.1 ? 'down' : 'stable'
  })), [categoryTrends]);
  // For InsightsSheet, we need the full category trend data
  const categoryTrendsForSheets = categoryTrends;
  // upcomingBills is already in the correct format: { name: string; amount: number; dateLabel: string; date: Date }[]
  // We just need to remove the date property
  const transformedUpcomingBills = useMemo(() => upcomingBills.map((item) => ({
    name: item.name,
    dateLabel: item.dateLabel,
    amount: item.amount
  })), [upcomingBills]);
  // orderedActivityGroups is already in the correct format: Array<[string, ActivityTransaction[]]>
  const transformedOrderedActivityGroups = orderedActivityGroups;

  const viewProps: FinanceDashboardViewProps = {
    accounts,
    goals,
    transactions,
    rawEntries,
    bills,
    subscriptions,
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
    dashboardConfig,
    orderedDashboardCards,
    hiddenCards,
    thisWeekRange,
    thisWeekSummary,
    weeklyBudget,
    weeklyProgress,
    thisWeekChart,
    weeklyHelperText: weeklyHelperText ?? '',
    weeklyInsight,
    incomeDelta: null,
    netDelta: null,
    topCategoriesRange,
    topCategoriesAll: transformedTopCategoriesAll,
    topCategoriesAllForSheets,
    topCategoriesTotal,
    topCategories: transformedTopCategories,
    topCategoriesInsight,
    subscriptionsRange,
    categorySuggestions,
    subscriptionsSummary,
    subscriptionsInsight,
    subscriptionShare: subscriptionShare ?? 0,
    anomalyCategories: transformedAnomalyCategories,
    anomalyCategoriesForSheets,
    categoryTrends: transformedCategoryTrends,
    categoryTrendsForSheets,
    upcomingBillsRange,
    upcomingBills: transformedUpcomingBills,
    upcomingBillsMonthTotal,
    upcomingBillsInsight,
    activityRange,
    filteredTransactions,
    recentTransactions,
    hasMoreActivity,
    orderedActivityGroups: transformedOrderedActivityGroups,
    activityInsight,
    animatedTransactionIds: Array.from(animatedTransactionIds),
    activeAccountIndex,
    showAllGoals,
    draggingCardId,
    actionMenuCardId,
    categorizeTarget,
    customCategory,
    undoToast,
    scrollPaddingBottom,
    undoBottom,
    showAccountModal,
    showGoalModal,
    showBillsModal,
    showSubscriptionsModal,
    infoModal,
    activeSheet,
    editingAccount,
    accountForm,
    accountSaveError,
    accountSaving,
    goalForm,
    goalSaveError,
    goalSaving,
    displayedGoals,
    isActionCardPinned,
    user,
    authLoading,
    currencyCode,
    onCycleAccount: cycleAccount,
    onOpenAddAccount: openAddAccount,
    onOpenEditAccount: openEditAccount,
    onSaveAccount: saveAccount,
    onDeleteAccount: handleDeleteAccount,
    onAccountFormChange: (field, value) => {
      if (field === 'name') {
        setAccountForm((prev) => ({ ...prev, name: sanitizeText(value) }));
      } else if (field === 'balance') {
        setAccountForm((prev) => ({ ...prev, balance: value }));
      } else if (field === 'lastFour') {
        setAccountForm((prev) => ({ ...prev, lastFour: value }));
      }
    },
    onAccountColorChange: (color: string) => {
      setAccountForm((prev) => ({ ...prev, color: color as AccountColorId }));
    },
    onOpenGoalModal: () => setShowGoalModal(true),
    onSaveGoal: saveGoal,
    onGoalFormChange: (field, value) => {
      if (field === 'name') {
        setGoalForm((prev) => ({ ...prev, name: sanitizeText(value) }));
      } else if (field === 'target') {
        setGoalForm((prev) => ({ ...prev, target: value }));
      } else if (field === 'current') {
        setGoalForm((prev) => ({ ...prev, current: value }));
      }
    },
    onGoalColorChange: (color) => {
      setGoalForm((prev) => ({ ...prev, color }));
    },
    onDeleteGoal: handleDeleteGoal,
    onToggleShowAllGoals: () => setShowAllGoals((prev) => !prev),
    onOpenInfoModal: openInfoModal,
    onCloseInfoModal: closeInfoModal,
    onCardDrop: handleCardDrop,
    onCardEdit: handleCardEdit,
    onCardLongPress: setActionMenuCardId,
    onCardSwipe: handleCardSwipe,
    onCardDragStart: setDraggingCardId,
    onCardDragEnd: () => setDraggingCardId(null),
    onCardPinToggle: handleCardPinToggle,
    onCardHide: handleCardHide,
    onCardShow: handleCardShow,
    onCategorySelection: handleCategorySelection,
    onDeleteTransaction: queueDeleteTransaction,
    onUndoDelete: handleUndoDelete,
    onCategorizeTransaction: setCategorizeTarget,
    onCustomCategoryChange: (value) => setCustomCategory(sanitizeText(value)),
    onSaveCustomCategory: () => handleCategorySelection(customCategory),
    onSetActiveSheet: setActiveSheet,
    onCloseSheet: () => setActiveSheet(null),
    onCloseAccountModal: () => setShowAccountModal(false),
    onCloseGoalModal: () => setShowGoalModal(false),
    onCloseBillsModal: () => setShowBillsModal(false),
    onCloseSubscriptionsModal: () => setShowSubscriptionsModal(false),
    onSetCategorizeTarget: setCategorizeTarget,
    setTransactions: (updater: (prev: import('../../../types').FinanceTransaction[]) => import('../../../types').FinanceTransaction[]) => {
      // Wrapper to convert between FinanceTransaction[] and ActivityTransaction[]
      setTransactions((prev) => {
        const financeTransactions: import('../../../types').FinanceTransaction[] = prev.map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          amount: t.amount,
          type: t.type,
          date: t.date,
          iconName: t.iconName,
          icon: t.icon,
          accountId: t.accountId
        }));
        const updated = updater(financeTransactions);
        // Convert back to ActivityTransaction[] - preserve existing ActivityTransaction properties where possible
        return updated.map((t, idx) => {
          const existing = prev[idx];
          return {
            ...t,
            createdAt: existing?.createdAt ?? null,
            createdAtTime: existing?.createdAtTime ?? 0,
            hasValidDate: existing?.hasValidDate ?? false
          } as ActivityTransaction;
        });
      });
    },
    setRawEntries,
    fetchEntries,
    createAccount,
    updateAccount: async (id: string, data: { name?: string; balance?: number; color?: string; lastFour?: string }) => {
      // The actual updateAccount requires name and color, so we provide defaults if missing
      if (!data.name || !data.color) {
        const account = accounts.find((a) => a.id === id);
        if (!account) return 'Account not found.';
        return updateAccount(id, {
          name: data.name ?? account.name,
          color: data.color ?? account.color,
          lastFour: data.lastFour
        });
      }
      return updateAccount(id, {
        name: data.name,
        color: data.color,
        lastFour: data.lastFour
      });
    },
    createGoal,
    deleteGoal: async (id: string) => {
      return await deleteGoal(id);
    },
    createBill,
    updateBill: async (id: string, data: Partial<import('../types').BillFormInput>) => {
      // The actual updateBill requires full BillFormInput, so we need to get the existing bill first
      const existingBill = bills.find((b) => b.id === id);
      if (!existingBill) return 'Bill not found.';
      return updateBill(id, {
        name: data.name ?? existingBill.name,
        amount: data.amount ?? existingBill.amount,
        cadence: data.cadence ?? existingBill.cadence,
        nextDueDate: data.nextDueDate ?? existingBill.nextDueDate ?? '',
        accountId: data.accountId ?? existingBill.accountId,
        reminderDays: data.reminderDays ?? existingBill.reminderDays
      });
    },
    deleteBill: async (id: string) => {
      await deleteBill(id);
      return null;
    },
    createSubscription,
    updateSubscription: async (id: string, data: Partial<import('../types').SubscriptionFormInput>) => {
      // The actual updateSubscription requires full SubscriptionFormInput, so we need to get the existing subscription first
      const existingSubscription = subscriptions.find((s) => s.id === id);
      if (!existingSubscription) return 'Subscription not found.';
      return updateSubscription(id, {
        name: data.name ?? existingSubscription.name,
        amount: data.amount ?? existingSubscription.amount,
        cadence: data.cadence ?? existingSubscription.cadence,
        nextDueDate: data.nextDueDate ?? existingSubscription.nextDueDate ?? '',
        accountId: data.accountId ?? existingSubscription.accountId,
        reminderDays: data.reminderDays ?? existingSubscription.reminderDays
      });
    },
    deleteSubscription: async (id: string) => {
      await deleteSubscription(id);
      return null;
    },
    deleteFinanceEntry: async (id: string) => {
      await deleteFinanceEntry(id);
    },
    updateEntryCategory,
    formatEntryTime,
    getRangeLabel,
    getRangeBadge
  };

  return <FinanceDashboardView {...viewProps} />;
};

