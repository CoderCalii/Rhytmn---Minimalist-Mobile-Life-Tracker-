import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { FinanceAccount } from '../../types';
import { sanitizeText } from '../../utils/sanitize';
import { validateAmount } from './utils/validateFinance';
import { CARD_TITLES, UNKNOWN_DATE_LABEL, accountColors, goalColors } from './constants';
import FinanceHeader from './components/FinanceHeader';
import DashboardCardShell from './components/DashboardCardShell';
import AccountStack from './components/cards/AccountStack';
import GrowthTargetsCard from './components/cards/GrowthTargetsCard';
import ActivityCard from './components/cards/ActivityCard';
import HiddenCardsBar from './components/cards/HiddenCardsBar';
import ThisWeekSummary from './components/ThisWeekSummary';
import UpcomingBillsCard from './components/UpcomingBillsCard';
import SubscriptionsSummary from './components/SubscriptionsSummary';
import TopCategoriesSummary from './components/TopCategoriesSummary';
import BottomSheet from './components/BottomSheet';
import BillsManagerModal from './components/BillsManagerModal';
import SubscriptionsManagerModal from './components/SubscriptionsManagerModal';
import ThisWeekSheet from './components/sheets/ThisWeekSheet';
import TopCategoriesSheet from './components/sheets/TopCategoriesSheet';
import GrowthTargetsSheet from './components/sheets/GrowthTargetsSheet';
import ActivitySheet from './components/sheets/ActivitySheet';
import InsightsSheet from './components/sheets/InsightsSheet';
import CategorizeSheet from './components/sheets/CategorizeSheet';
import ActionMenuSheet from './components/sheets/ActionMenuSheet';
import AccountModal from './components/modals/AccountModal';
import GoalModal from './components/modals/GoalModal';
import InfoModal from './components/modals/InfoModal';
import useDashboardConfig from './hooks/useDashboardConfig';
import useFinanceData from './hooks/useFinanceData';
import useFinanceInsights from './hooks/useFinanceInsights';
import useTransactionAnimations from './hooks/useTransactionAnimations';
import { formatEntryTime } from './utils/financeDates';
import { getRangeBadge, getRangeLabel } from './utils/financeRanges';
import type { ActivityTransaction, DashboardCardId } from './types';

interface FinanceViewProps {
  refreshToken?: number;
  currencyCode?: 'USD' | 'PHP';
  fabIntent?: { type: 'subscription' } | null;
  onFabIntentHandled?: () => void;
  onFabContextChange?: (context: 'portfolio' | 'activity' | 'subscriptions') => void;
}

const FinanceView = ({
  refreshToken = 0,
  currencyCode = 'USD',
  fabIntent = null,
  onFabIntentHandled,
  onFabContextChange
}: FinanceViewProps) => {
  const { user, loading: authLoading } = useAuth();
  const dashboardKey = useMemo(() => `finance.dashboard.v1.${user?.id ?? 'guest'}`, [user?.id]);

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
    incomeDelta,
    netDelta,
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
  const [draggingCardId, setDraggingCardId] = useState<DashboardCardId | null>(null);
  const [actionMenuCardId, setActionMenuCardId] = useState<DashboardCardId | null>(null);
  const [categorizeTarget, setCategorizeTarget] = useState<ActivityTransaction | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    timeoutId: number;
  } | null>(null);
  const [undoToast, setUndoToast] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    if (activeAccountIndex >= accounts.length) {
      setActiveAccountIndex(0);
    }
  }, [accounts.length, activeAccountIndex]);

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
      const error = await updateAccount(editingAccount.id, { name: safeName, color: accountForm.color });
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

  const isActionCardPinned = actionMenuCardId
    ? dashboardConfig.pinned.includes(actionMenuCardId)
    : false;

  const themeStyle = {
    '--finance-sand': '#fbf8f3',
    '--finance-ink': '#0f172a',
    '--finance-glow': '#fbe5cf',
    '--finance-mint': '#b9f5d8',
    '--finance-sky': '#cfe9ff'
  } as CSSProperties;

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
        <AccountStack
          isSignedIn={Boolean(user)}
          authLoading={authLoading}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          accounts={accounts}
          activeAccountIndex={activeAccountIndex}
          currencyCode={currencyCode}
          onCycleAccount={cycleAccount}
          onAddAccount={openAddAccount}
          onEditAccount={openEditAccount}
        />

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
                    monthTotal={upcomingBillsMonthTotal}
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
              const growthRangeLabel = getRangeBadge(dashboardConfig.ranges['growth-targets'] ?? 'month');
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
                  <GrowthTargetsCard
                    isSignedIn={Boolean(user)}
                    authLoading={authLoading}
                    goalsLoading={goalsLoading}
                    goalsError={goalsError}
                    goals={goals}
                    displayedGoals={displayedGoals}
                    showAllGoals={showAllGoals}
                    rangeLabel={growthRangeLabel}
                    onToggleShowAllGoals={() => setShowAllGoals((prev) => !prev)}
                    onOpenGoalModal={() => setShowGoalModal(true)}
                    onOpenSheet={() => setActiveSheet('growth-targets')}
                    onDeleteGoal={handleDeleteGoal}
                  />
                </DashboardCardShell>
              );
            }

            if (cardId === 'activity') {
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
                  <ActivityCard
                    isSignedIn={Boolean(user)}
                    authLoading={authLoading}
                    entriesLoading={entriesLoading}
                    entriesError={entriesError}
                    recentTransactions={recentTransactions}
                    orderedActivityGroups={orderedActivityGroups}
                    hasMoreActivity={hasMoreActivity}
                    activityInsight={activityInsight}
                    activityRangeLabel={getRangeBadge(activityRange)}
                    currencyCode={currencyCode}
                    animatedTransactionIds={animatedTransactionIds}
                    unknownDateLabel={UNKNOWN_DATE_LABEL}
                    onOpenSheet={() => setActiveSheet('activity')}
                    onDeleteTransaction={queueDeleteTransaction}
                    onCategorizeTransaction={(target) => setCategorizeTarget(target)}
                    formatEntryTime={formatEntryTime}
                  />
                </DashboardCardShell>
              );
            }

            return null;
          })}
        </div>

        <HiddenCardsBar hiddenCards={hiddenCards} onShowCard={handleCardShow} />
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
          <ActionMenuSheet
            isPinned={isActionCardPinned}
            onEdit={() => {
              handleCardEdit(actionMenuCardId);
              setActionMenuCardId(null);
            }}
            onPinToggle={() => {
              handleCardPinToggle(actionMenuCardId);
              setActionMenuCardId(null);
            }}
            onHide={() => {
              handleCardHide(actionMenuCardId);
              setActionMenuCardId(null);
            }}
            onInsights={() => {
              setActiveSheet('insights');
              setActionMenuCardId(null);
            }}
          />
        </BottomSheet>
      )}

      <BottomSheet
        isOpen={activeSheet === 'this-week'}
        title={`${getRangeLabel(thisWeekRange)} details`}
        onClose={() => setActiveSheet(null)}
      >
        <ThisWeekSheet
          summary={thisWeekSummary}
          weeklyBudget={weeklyBudget}
          weeklyInsight={weeklyInsight}
          chart={thisWeekChart}
          currencyCode={currencyCode}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'top-categories'}
        title={`Top categories - ${getRangeLabel(topCategoriesRange)}`}
        onClose={() => setActiveSheet(null)}
      >
        <TopCategoriesSheet
          categories={topCategoriesAll}
          total={topCategoriesTotal}
          insight={topCategoriesInsight}
          currencyCode={currencyCode}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'growth-targets'}
        title="Growth targets timeline"
        onClose={() => setActiveSheet(null)}
      >
        <GrowthTargetsSheet goals={goals} currencyCode={currencyCode} isActive={activeSheet === 'growth-targets'} />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'activity'}
        title={`Activity - ${getRangeLabel(activityRange)}`}
        onClose={() => setActiveSheet(null)}
      >
        <ActivitySheet
          filteredTransactions={filteredTransactions}
          currencyCode={currencyCode}
          unknownDateLabel={UNKNOWN_DATE_LABEL}
          onDeleteTransaction={queueDeleteTransaction}
          onCategorizeTransaction={(target) => setCategorizeTarget(target)}
          formatEntryTime={formatEntryTime}
        />
      </BottomSheet>

      <BottomSheet isOpen={activeSheet === 'insights'} title="Insights" onClose={() => setActiveSheet(null)}>
        <InsightsSheet
          anomalyCategories={anomalyCategories}
          subscriptionShare={subscriptionShare}
          categoryTrends={categoryTrends}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={Boolean(categorizeTarget)}
        title="Categorize transaction"
        onClose={() => setCategorizeTarget(null)}
      >
        <CategorizeSheet
          categorizeTarget={categorizeTarget}
          categorySuggestions={categorySuggestions}
          customCategory={customCategory}
          onCustomCategoryChange={(value) => setCustomCategory(sanitizeText(value))}
          onSelectCategory={handleCategorySelection}
          onSaveCustom={() => handleCategorySelection(customCategory)}
        />
      </BottomSheet>

      <AccountModal
        isOpen={showAccountModal}
        editingAccount={editingAccount}
        accountForm={accountForm}
        accountColors={accountColors}
        accountSaveError={accountSaveError}
        accountSaving={accountSaving}
        onClose={() => setShowAccountModal(false)}
        onNameChange={(value) => setAccountForm((prev) => ({ ...prev, name: sanitizeText(value) }))}
        onBalanceChange={(value) => setAccountForm((prev) => ({ ...prev, balance: value }))}
        onLastFourChange={(value) => setAccountForm((prev) => ({ ...prev, lastFour: value }))}
        onColorChange={(color) => setAccountForm((prev) => ({ ...prev, color }))}
        onSave={saveAccount}
      />

      <GoalModal
        isOpen={showGoalModal}
        goalForm={goalForm}
        goalColors={goalColors}
        goalSaveError={goalSaveError}
        goalSaving={goalSaving}
        onClose={() => setShowGoalModal(false)}
        onNameChange={(value) => setGoalForm((prev) => ({ ...prev, name: sanitizeText(value) }))}
        onTargetChange={(value) => setGoalForm((prev) => ({ ...prev, target: value }))}
        onCurrentChange={(value) => setGoalForm((prev) => ({ ...prev, current: value }))}
        onColorChange={(color) => setGoalForm((prev) => ({ ...prev, color }))}
        onSave={saveGoal}
      />

      <InfoModal isOpen={Boolean(infoModal)} info={infoModal} onClose={closeInfoModal} />

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
