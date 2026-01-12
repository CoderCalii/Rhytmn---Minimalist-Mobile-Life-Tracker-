import type { DeltaIndicator } from '../types';

export const getAccountTextClass = (color: string) => {
  if (color.includes('black') || color.includes('blue') || color.includes('emerald') || color.includes('slate')) {
    return 'text-white';
  }
  return 'text-black';
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
