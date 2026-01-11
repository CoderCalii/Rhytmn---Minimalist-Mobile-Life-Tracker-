import { Car, TrendingUp, Tv, Utensils, Wallet, Zap } from 'lucide-react';
import type { FinanceTransaction } from '../../../types';

export const getTransactionIcon = (category: string, type: FinanceTransaction['type']) => {
  if (type === 'income') return <TrendingUp size={16} />;
  const normalized = category.toLowerCase();
  if (normalized.includes('food') || normalized.includes('drink')) return <Utensils size={16} />;
  if (normalized.includes('transport') || normalized.includes('uber')) return <Car size={16} />;
  if (normalized.includes('entertainment') || normalized.includes('movie') || normalized.includes('tv')) {
    return <Tv size={16} />;
  }
  if (normalized.includes('tech') || normalized.includes('software')) return <Zap size={16} />;
  return <Wallet size={16} />;
};
