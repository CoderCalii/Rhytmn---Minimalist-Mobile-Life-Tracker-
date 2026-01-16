import { createElement } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Target
} from 'lucide-react-native';
import type { TransactionType } from '../capture.types';

export const transactionTypes: Array<{
  id: TransactionType;
  label: string;
  icon: ReactNode;
  accent: string;
}> = [
  { id: 'income', label: 'Income', icon: createElement(ArrowDownLeft, { size: 14, color: '#10b981' }), accent: '#10b981' },
  { id: 'expense', label: 'Expense', icon: createElement(ArrowUpRight, { size: 14, color: '#f43f5e' }), accent: '#f43f5e' },
  { id: 'transfer', label: 'Transfer', icon: createElement(ArrowLeftRight, { size: 14, color: '#2563eb' }), accent: '#2563eb' },
  { id: 'goal', label: 'Goal', icon: createElement(Target, { size: 14, color: '#7c3aed' }), accent: '#7c3aed' }
];

