import type { TransactionType } from './capture.types';

export const defaultCategorySets: Record<TransactionType, string[]> = {
  income: ['Salary', 'Gift', 'Investment', 'Refund'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills'],
  transfer: [],
  goal: []
};

