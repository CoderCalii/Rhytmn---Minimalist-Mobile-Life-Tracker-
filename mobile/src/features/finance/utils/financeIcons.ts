import type { FinanceIconName, FinanceTransaction } from '../../../types';

export const getTransactionIconName = (
  category: string,
  type: FinanceTransaction['type']
): FinanceIconName => {
  if (type === 'income') return 'trending-up';
  const normalized = category.toLowerCase();
  if (normalized.includes('food') || normalized.includes('drink')) return 'utensils';
  if (normalized.includes('transport') || normalized.includes('uber')) return 'car';
  if (normalized.includes('entertainment') || normalized.includes('movie') || normalized.includes('tv')) {
    return 'tv';
  }
  if (normalized.includes('tech') || normalized.includes('software')) return 'zap';
  return 'wallet';
};
