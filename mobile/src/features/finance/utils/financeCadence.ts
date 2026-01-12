import type { RecurrenceCadence } from '../types';

export const normalizeCadence = (value?: string | null): RecurrenceCadence => {
  if (value === 'weekly' || value === 'yearly') return value;
  return 'monthly';
};
