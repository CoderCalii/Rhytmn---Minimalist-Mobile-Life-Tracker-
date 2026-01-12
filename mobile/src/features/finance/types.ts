import type { FinanceTransaction } from '../../types';

export type RecurrenceCadence = 'weekly' | 'monthly' | 'yearly';

export interface BillItem {
  id: string;
  name: string;
  amount: number;
  cadence: RecurrenceCadence;
  nextDueDate: string | null;
  accountId: string | null;
  reminderDays: number | null;
  active: boolean;
}

export interface BillFormInput {
  name: string;
  amount: number;
  cadence: RecurrenceCadence;
  nextDueDate: string;
  accountId: string | null;
  reminderDays: number | null;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  cadence: RecurrenceCadence;
  nextDueDate: string | null;
  accountId: string | null;
  reminderDays: number | null;
  active: boolean;
}

export interface SubscriptionFormInput {
  name: string;
  amount: number;
  cadence: RecurrenceCadence;
  nextDueDate: string;
  accountId: string | null;
  reminderDays: number | null;
}

export interface FinanceAccountRow {
  id: string;
  name: string | null;
  balance: number | string | null;
  color: string | null;
  last_four: string | null;
}

export interface FinanceGoalRow {
  id: string;
  name: string | null;
  target: number | string | null;
  current: number | string | null;
  color: string | null;
}

export interface FinanceBillRow {
  id: string;
  name: string | null;
  amount: number | string | null;
  cadence: string | null;
  next_due_date: string | null;
  account_id: string | null;
  reminder_days: number | string | null;
  active: boolean | null;
}

export interface FinanceSubscriptionRow {
  id: string;
  name: string | null;
  amount: number | string | null;
  cadence: string | null;
  next_due_date: string | null;
  account_id: string | null;
  reminder_days: number | string | null;
  active: boolean | null;
}

export type TimeRange = 'week' | 'month' | 'year';
export type DashboardCardId =
  | 'this-week'
  | 'upcoming-bills'
  | 'subscriptions'
  | 'top-categories'
  | 'growth-targets'
  | 'activity';

export type DeltaIndicator = {
  direction: 'up' | 'down' | 'flat';
  label: string;
};

export type DashboardConfig = {
  order: DashboardCardId[];
  hidden: DashboardCardId[];
  pinned: DashboardCardId[];
  ranges: Record<DashboardCardId, TimeRange>;
};

export type ActivityTransaction = FinanceTransaction & {
  createdAt: string | null;
  createdAtTime: number;
  hasValidDate: boolean;
};

export type DatedBill = { bill: BillItem; date: Date };
