import { Pressable, ScrollView, Text, View } from 'react-native';
import { UNKNOWN_DATE_LABEL } from '../constants';
import FinanceHeader from '../components/FinanceHeader';
import DashboardCardShell from '../components/DashboardCardShell';
import AccountStack from '../components/cards/AccountStack';
import GrowthTargetsCard from '../components/cards/GrowthTargetsCard';
import ActivityCard from '../components/cards/ActivityCard';
import HiddenCardsBar from '../components/cards/HiddenCardsBar';
import ThisWeekSummary from '../components/ThisWeekSummary';
import UpcomingBillsCard from '../components/UpcomingBillsCard';
import SubscriptionsSummary from '../components/SubscriptionsSummary';
import TopCategoriesSummary from '../components/TopCategoriesSummary';
import { FinanceModals } from './FinanceModals';
import { FinanceSheets } from './FinanceSheets';
import type { FinanceDashboardViewProps } from './dashboard.types';

export const FinanceDashboardView = (props: FinanceDashboardViewProps) => {
  const {
    accounts,
    goals,
    accountsLoading,
    accountsError,
    activeAccountIndex,
    currencyCode,
    user,
    authLoading,
    entriesLoading,
    entriesError,
    billsLoading,
    billsError,
    subscriptionsLoading,
    subscriptionsError,
    goalsLoading,
    goalsError,
    orderedDashboardCards,
    hiddenCards,
    thisWeekSummary,
    weeklyHelperText,
    weeklyProgress,
    weeklyBudget,
    incomeDelta,
    netDelta,
    weeklyInsight,
    thisWeekRange,
    upcomingBills,
    upcomingBillsInsight,
    upcomingBillsMonthTotal,
    upcomingBillsRange,
    subscriptionsSummary,
    subscriptionsInsight,
    subscriptionsRange,
    topCategories,
    topCategoriesInsight,
    topCategoriesRange,
    topCategoriesAllForSheets,
    anomalyCategoriesForSheets,
    categoryTrendsForSheets,
    dashboardConfig,
    displayedGoals,
    showAllGoals,
    recentTransactions,
    orderedActivityGroups,
    hasMoreActivity,
    activityInsight,
    activityRange,
    animatedTransactionIds,
    undoToast,
    undoBottom,
    scrollPaddingBottom,
    onCycleAccount,
    onOpenAddAccount,
    onOpenEditAccount,
    onCardLongPress,
    onCardSwipe,
    onCardDragStart,
    onCardDragEnd,
    onCardDrop,
    onToggleShowAllGoals,
    onOpenGoalModal,
    onDeleteGoal,
    onCardShow,
    onSetActiveSheet,
    onDeleteTransaction,
    onCategorizeTransaction,
    getRangeLabel,
    getRangeBadge,
    formatEntryTime
  } = props;

  return (
    <View className="flex-1 bg-[#fbf8f3]">
      <View pointerEvents="none" className="absolute inset-0">
        <View
          className="absolute -top-24 right-[-60px] h-64 w-64 rounded-full bg-[#fbe5cf] opacity-45"
          style={{ shadowColor: '#fbe5cf', shadowOpacity: 0.6, shadowRadius: 40, shadowOffset: { width: 0, height: 0 }, elevation: 6 }}
        />
        <View
          className="absolute top-40 -left-28 h-72 w-72 rounded-full bg-[#cfe9ff] opacity-40"
          style={{ shadowColor: '#cfe9ff', shadowOpacity: 0.6, shadowRadius: 50, shadowOffset: { width: 0, height: 0 }, elevation: 6 }}
        />
        <View
          className="absolute bottom-24 right-[-40px] h-56 w-56 rounded-full bg-[#b9f5d8] opacity-35"
          style={{ shadowColor: '#b9f5d8', shadowOpacity: 0.6, shadowRadius: 40, shadowOffset: { width: 0, height: 0 }, elevation: 6 }}
        />
      </View>

      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
      >
        <FinanceHeader />

        <View className="px-6 pt-4">
          <View className="gap-14">
            <AccountStack
              isSignedIn={Boolean(user)}
              authLoading={authLoading}
              accountsLoading={accountsLoading}
              accountsError={accountsError}
              accounts={accounts}
              activeAccountIndex={activeAccountIndex}
              currencyCode={currencyCode}
              onCycleAccount={onCycleAccount}
              onAddAccount={onOpenAddAccount}
              onEditAccount={onOpenEditAccount}
            />

            <View className="gap-6">
              {orderedDashboardCards.map((cardId) => {
                if (cardId === 'this-week') {
                  return (
                    <DashboardCardShell
                      key={cardId}
                      id={cardId}
                      onLongPress={onCardLongPress}
                      onSwipeLeft={() => onCardSwipe(cardId, 'next')}
                      onSwipeRight={() => onCardSwipe(cardId, 'prev')}
                      onDragStart={onCardDragStart}
                      onDragEnd={onCardDragEnd}
                      onDrop={onCardDrop}
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
                        onPress={() => onSetActiveSheet('this-week')}
                        rangeLabel={getRangeLabel(thisWeekRange)}
                        progress={weeklyProgress}
                        budgetAmount={weeklyBudget ?? undefined}
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
                      onLongPress={onCardLongPress}
                      onSwipeLeft={() => onCardSwipe(cardId, 'next')}
                      onSwipeRight={() => onCardSwipe(cardId, 'prev')}
                      onDragStart={onCardDragStart}
                      onDragEnd={onCardDragEnd}
                      onDrop={onCardDrop}
                    >
                      <UpcomingBillsCard
                        bills={upcomingBills}
                        currencyCode={currencyCode}
                        loading={authLoading || billsLoading}
                        isSignedIn={Boolean(user)}
                        error={billsError}
                        onPress={() => props.onCardEdit('upcoming-bills')}
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
                      onLongPress={onCardLongPress}
                      onSwipeLeft={() => onCardSwipe(cardId, 'next')}
                      onSwipeRight={() => onCardSwipe(cardId, 'prev')}
                      onDragStart={onCardDragStart}
                      onDragEnd={onCardDragEnd}
                      onDrop={onCardDrop}
                    >
                      <SubscriptionsSummary
                        total={subscriptionsSummary.total}
                        names={subscriptionsSummary.names}
                        count={subscriptionsSummary.count}
                        currencyCode={currencyCode}
                        loading={authLoading || subscriptionsLoading}
                        isSignedIn={Boolean(user)}
                        error={subscriptionsError}
                        onPress={() => props.onCardEdit('subscriptions')}
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
                      onLongPress={onCardLongPress}
                      onSwipeLeft={() => onCardSwipe(cardId, 'next')}
                      onSwipeRight={() => onCardSwipe(cardId, 'prev')}
                      onDragStart={onCardDragStart}
                      onDragEnd={onCardDragEnd}
                      onDrop={onCardDrop}
                    >
                      <TopCategoriesSummary
                        categories={topCategories}
                        currencyCode={currencyCode}
                        loading={authLoading || entriesLoading}
                        isSignedIn={Boolean(user)}
                        error={entriesError}
                        onPress={() => onSetActiveSheet('top-categories')}
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
                      onLongPress={onCardLongPress}
                      onSwipeLeft={() => onCardSwipe(cardId, 'next')}
                      onSwipeRight={() => onCardSwipe(cardId, 'prev')}
                      onDragStart={onCardDragStart}
                      onDragEnd={onCardDragEnd}
                      onDrop={onCardDrop}
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
                        onToggleShowAllGoals={onToggleShowAllGoals}
                        onOpenGoalModal={onOpenGoalModal}
                        onOpenSheet={() => onSetActiveSheet('growth-targets')}
                        onDeleteGoal={onDeleteGoal}
                      />
                    </DashboardCardShell>
                  );
                }

                if (cardId === 'activity') {
                  return (
                    <DashboardCardShell
                      key={cardId}
                      id={cardId}
                      onLongPress={onCardLongPress}
                      onSwipeLeft={() => onCardSwipe(cardId, 'next')}
                      onSwipeRight={() => onCardSwipe(cardId, 'prev')}
                      onDragStart={onCardDragStart}
                      onDragEnd={onCardDragEnd}
                      onDrop={onCardDrop}
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
                        onOpenSheet={() => onSetActiveSheet('activity')}
                        onDeleteTransaction={onDeleteTransaction}
                        onCategorizeTransaction={onCategorizeTransaction}
                        formatEntryTime={formatEntryTime}
                      />
                    </DashboardCardShell>
                  );
                }

                return null;
              })}
            </View>

            <HiddenCardsBar hiddenCards={hiddenCards} onShowCard={onCardShow} />
          </View>
        </View>
      </ScrollView>

      {undoToast && (
        <View className="absolute left-0 right-0 items-center" style={{ bottom: undoBottom }}>
          <View className="flex-row items-center rounded-full border border-slate-200 bg-white/95 px-4 py-2 shadow-lg">
            <Text className="mr-3 text-xs font-semibold text-slate-700">{undoToast.label}</Text>
            <Pressable
              onPress={props.onUndoDelete}
              className="rounded-full bg-black px-3 py-1"
            >
              <Text className="text-[10px] font-black uppercase tracking-widest text-white">Undo</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FinanceSheets {...props} />
      <FinanceModals {...props} />
    </View>
  );
};

