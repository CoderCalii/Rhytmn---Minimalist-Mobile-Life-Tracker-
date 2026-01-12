import AsyncStorage from '@react-native-async-storage/async-storage';
import { DASHBOARD_CARD_ORDER } from '../constants';
import type { DashboardCardId, DashboardConfig, TimeRange } from '../types';

export const buildDefaultDashboardConfig = (): DashboardConfig => ({
  order: DASHBOARD_CARD_ORDER,
  hidden: [],
  pinned: [],
  ranges: {
    'this-week': 'week',
    'upcoming-bills': 'month',
    subscriptions: 'month',
    'top-categories': 'week',
    'growth-targets': 'month',
    activity: 'week'
  }
});

export const normalizeDashboardConfig = (value: Partial<DashboardConfig> | null | undefined): DashboardConfig => {
  const defaults = buildDefaultDashboardConfig();
  if (!value) return defaults;
  const order = Array.isArray(value.order)
    ? value.order.filter((item): item is DashboardCardId => DASHBOARD_CARD_ORDER.includes(item))
    : [];
  const missing = DASHBOARD_CARD_ORDER.filter((item) => !order.includes(item));
  const hidden = Array.isArray(value.hidden)
    ? value.hidden.filter((item): item is DashboardCardId => DASHBOARD_CARD_ORDER.includes(item))
    : [];
  const pinned = Array.isArray(value.pinned)
    ? value.pinned.filter((item): item is DashboardCardId => DASHBOARD_CARD_ORDER.includes(item))
    : [];
  const ranges = { ...defaults.ranges, ...(value.ranges ?? {}) } as Record<DashboardCardId, TimeRange>;
  return {
    order: [...order, ...missing],
    hidden,
    pinned,
    ranges
  };
};

export const readDashboardConfig = async (key: string) => {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return buildDefaultDashboardConfig();
    const parsed = JSON.parse(stored) as Partial<DashboardConfig>;
    return normalizeDashboardConfig(parsed);
  } catch {
    return buildDefaultDashboardConfig();
  }
};
