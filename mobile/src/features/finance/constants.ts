import type { DashboardCardId, TimeRange } from './types';

export const UNKNOWN_DATE_LABEL = 'Unknown date';

// DEPRECATED: Use ACCOUNT_COLORS from financeUi.ts instead
// Kept for backward compatibility during migration
export const accountColors = ['black', 'blue', 'emerald', 'slate', 'rose'];
export const goalColors = ['bg-orange-50', 'bg-purple-50', 'bg-blue-50', 'bg-rose-50', 'bg-emerald-50'];

export const DASHBOARD_CARD_ORDER: DashboardCardId[] = [
  'this-week',
  'upcoming-bills',
  'subscriptions',
  'top-categories',
  'growth-targets',
  'activity'
];

export const CARD_TITLES: Record<DashboardCardId, string> = {
  'this-week': 'This Week',
  'upcoming-bills': 'Upcoming Bills',
  subscriptions: 'Subscriptions',
  'top-categories': 'Top Categories',
  'growth-targets': 'Growth Targets',
  activity: 'Activity'
};

export const TIME_RANGE_SEQUENCE: TimeRange[] = ['week', 'month', 'year'];
export const RANGE_LABELS: Record<TimeRange, string> = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year'
};
export const RANGE_BADGES: Record<TimeRange, string> = {
  week: 'This week',
  month: 'This month',
  year: 'This year'
};
