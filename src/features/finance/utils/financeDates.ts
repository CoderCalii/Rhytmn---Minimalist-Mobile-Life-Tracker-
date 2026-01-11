import {
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
  subYears
} from 'date-fns';
import { UNKNOWN_DATE_LABEL } from '../constants';
import type { TimeRange } from '../types';

export const formatEntryDate = (value?: string | null) => {
  if (!value) return UNKNOWN_DATE_LABEL;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return UNKNOWN_DATE_LABEL;

  // Compare calendar days in local time to avoid DST/rounding drift.
  const diffDays = differenceInCalendarDays(startOfDay(new Date()), startOfDay(parsed));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatShortDate = (value: Date) =>
  value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const parseDateOnly = (value?: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const formatEntryTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const getRangeWindow = (range: TimeRange, referenceDate = new Date()) => {
  if (range === 'month') {
    return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
  }
  if (range === 'year') {
    return { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
  }
  return { start: startOfWeek(referenceDate, { weekStartsOn: 1 }), end: endOfDay(referenceDate) };
};

export const getPreviousAnchor = (range: TimeRange, referenceDate = new Date()) => {
  if (range === 'month') return subMonths(referenceDate, 1);
  if (range === 'year') return subYears(referenceDate, 1);
  return subWeeks(referenceDate, 1);
};
