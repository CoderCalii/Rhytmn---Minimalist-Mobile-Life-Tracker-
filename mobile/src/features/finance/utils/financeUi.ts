import type { DeltaIndicator } from '../types';

export type AccountColorId = 'black' | 'slate' | 'blue' | 'emerald' | 'purple' | 'pink' | 'orange' | 'amber' | 'rose' | 'indigo';

export interface AccountColor {
  id: AccountColorId;
  backgroundClass: string;
  textClass: string;
  name: string;
}

export const ACCOUNT_COLORS: AccountColor[] = [
  { id: 'black', backgroundClass: 'bg-black', textClass: 'text-white', name: 'Black' },
  { id: 'slate', backgroundClass: 'bg-slate-900', textClass: 'text-white', name: 'Slate' },
  { id: 'blue', backgroundClass: 'bg-blue-600', textClass: 'text-white', name: 'Blue' },
  { id: 'emerald', backgroundClass: 'bg-emerald-500', textClass: 'text-white', name: 'Emerald' },
  { id: 'purple', backgroundClass: 'bg-purple-600', textClass: 'text-white', name: 'Purple' },
  { id: 'pink', backgroundClass: 'bg-pink-500', textClass: 'text-white', name: 'Pink' },
  { id: 'orange', backgroundClass: 'bg-orange-500', textClass: 'text-white', name: 'Orange' },
  { id: 'amber', backgroundClass: 'bg-amber-500', textClass: 'text-white', name: 'Amber' },
  { id: 'rose', backgroundClass: 'bg-rose-500', textClass: 'text-white', name: 'Rose' },
  { id: 'indigo', backgroundClass: 'bg-indigo-600', textClass: 'text-white', name: 'Indigo' }
];

const COLOR_HEX_MAP: Record<AccountColorId, string> = {
  black: '#000000',
  slate: '#0f172a',
  blue: '#2563eb',
  emerald: '#10b981',
  purple: '#9333ea',
  pink: '#ec4899',
  orange: '#f97316',
  amber: '#f59e0b',
  rose: '#f43f5e',
  indigo: '#4f46e5'
};

export const getAccountColorHex = (colorId: AccountColorId): string => {
  return COLOR_HEX_MAP[colorId] || '#000000';
};

export const DEFAULT_ACCOUNT_COLOR_ID: AccountColorId = 'black';

export const getAccountColorById = (colorId: string | null | undefined): AccountColor => {
  const color = ACCOUNT_COLORS.find((c) => c.id === colorId);
  return color ?? ACCOUNT_COLORS[0];
};

export const getAccountBackgroundClass = (colorId: string | null | undefined): string => {
  return getAccountColorById(colorId).backgroundClass;
};

export const getAccountTextClass = (colorId: string | null | undefined): string => {
  return getAccountColorById(colorId).textClass;
};

export const isValidAccountColorId = (colorId: string | null | undefined): colorId is AccountColorId => {
  return ACCOUNT_COLORS.some((c) => c.id === colorId);
};

export const normalizeAccountColor = (color: string | null | undefined): AccountColorId => {
  if (isValidAccountColorId(color)) {
    return color;
  }
  return DEFAULT_ACCOUNT_COLOR_ID;
};

export const triggerHaptic = () => {
  // No-op for React Native without extra haptics dependencies.
};

export const buildDeltaIndicator = (current: number, previous: number): DeltaIndicator | null => {
  if (current === 0 && previous === 0) return null;
  if (previous <= 0) {
    return { direction: 'up', label: 'New' };
  }
  const rawDelta = ((current - previous) / previous) * 100;
  const rounded = Math.round(rawDelta);
  if (rounded === 0) {
    return { direction: 'flat', label: 'Flat' };
  }
  return {
    direction: rounded > 0 ? 'up' : 'down',
    label: `${rounded > 0 ? '↑' : '↓'} ${Math.abs(rounded)}%`
  };
};
