import { RANGE_BADGES, RANGE_LABELS, TIME_RANGE_SEQUENCE } from '../constants';
import type { TimeRange } from '../types';

export const getRangeLabel = (range: TimeRange) => RANGE_LABELS[range] ?? 'This Week';
export const getRangeBadge = (range: TimeRange) => RANGE_BADGES[range] ?? 'This week';

export const shiftRange = (range: TimeRange, direction: 'next' | 'prev') => {
  const index = TIME_RANGE_SEQUENCE.indexOf(range);
  if (index === -1) return 'week';
  const offset = direction === 'next' ? 1 : -1;
  const nextIndex = (index + offset + TIME_RANGE_SEQUENCE.length) % TIME_RANGE_SEQUENCE.length;
  return TIME_RANGE_SEQUENCE[nextIndex];
};
