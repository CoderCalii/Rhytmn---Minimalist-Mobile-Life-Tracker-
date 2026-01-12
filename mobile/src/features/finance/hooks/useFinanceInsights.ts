import { useCallback, useMemo } from 'react';
import { addDays, differenceInCalendarDays, startOfDay, subMonths, subWeeks, subYears } from 'date-fns';
import type { FinanceEntryRow } from '../../../lib/financeEntries';
import type {
  ActivityTransaction,
  BillItem,
  DashboardCardId,
  RecurrenceCadence,
  SubscriptionItem,
  TimeRange
} from '../types';
import { UNKNOWN_DATE_LABEL } from '../constants';
import { formatEntryTime, formatShortDate, getPreviousAnchor, getRangeWindow, parseDateOnly } from '../utils/financeDates';
import { getRangeBadge } from '../utils/financeRanges';
import { buildDeltaIndicator } from '../utils/financeUi';

type UseFinanceInsightsParams = {
  rawEntries: FinanceEntryRow[];
  transactions: ActivityTransaction[];
  bills: BillItem[];
  subscriptions: SubscriptionItem[];
  cardRanges: Record<DashboardCardId, TimeRange>;
  user: { id: string } | null;
};

const useFinanceInsights = ({
  rawEntries,
  transactions,
  bills,
  subscriptions,
  cardRanges,
  user
}: UseFinanceInsightsParams) => {
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

      const maxValue = Math.max(1, ...points.map((point) => Math.max(point.spend, point.budget)));

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
    const monthlyTotal = activeSubscriptions.reduce(
      (sum, subscription) => sum + subscription.amount * cadenceToMonthly[subscription.cadence],
      0
    );
    const multiplier = subscriptionsRange === 'week' ? 1 / 4 : subscriptionsRange === 'year' ? 12 : 1;

    return {
      total: monthlyTotal * multiplier,
      monthlyTotal,
      names: activeSubscriptions.slice(0, 3).map((subscription) => subscription.name),
      count: activeSubscriptions.length,
      nextDueDate:
        activeSubscriptions
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
      .filter((item): item is { name: string; amount: number; delta: number } => item.delta !== null && item.delta > 0.5)
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
  const upcomingBillsMonthTotal = useMemo(() => {
    const activeBills = bills.filter((bill) => bill.active);
    const { start, end } = getRangeWindow('month');
    return activeBills.reduce((total, bill) => {
      const date = parseDateOnly(bill.nextDueDate);
      if (!date) return total;
      if (date < start || date > end) return total;
      return total + bill.amount;
    }, 0);
  }, [bills]);
  const upcomingBills = useMemo(() => {
    const activeBills = bills.filter((bill) => bill.active);
    const { start, end } = getRangeWindow(upcomingBillsRange);
    const sorted = activeBills
      .map((bill) => ({ bill, date: parseDateOnly(bill.nextDueDate) }))
      .filter((item): item is { bill: BillItem; date: Date } => Boolean(item.date) && item.date >= start && item.date <= end)
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

  return {
    thisWeekRange,
    thisWeekSummary,
    previousThisWeekSummary,
    weeklyBudget,
    weeklyProgress,
    thisWeekChart,
    weeklyHelperText,
    weeklyCategories,
    weeklyInsight,
    incomeDelta,
    netDelta,
    topCategoriesRange,
    topCategoriesAll,
    topCategoriesTotal,
    previousTopCategoriesAll,
    topCategories,
    topCategoriesInsight,
    subscriptionsRange,
    categorySuggestions,
    subscriptionsSummary,
    subscriptionsInsight,
    monthlySummary,
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
    groupedRecentTransactions,
    hasMoreActivity,
    orderedActivityGroups,
    activityInsight
  };
};

export default useFinanceInsights;
