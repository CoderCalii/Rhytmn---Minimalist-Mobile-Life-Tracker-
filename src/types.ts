import type { ReactNode } from 'react';

export type TimeScale = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface Block {
  id: string;
  type: 'text' | 'heading' | 'todo' | 'habit_widget' | 'finance_widget';
  content: any;
}

export interface Page {
  id: string;
  title: string;
  icon: ReactNode;
  category?: string;
  blocks: Block[];
  updatedAt: string;
}

export interface FinanceGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
}

export interface FinanceAccount {
  name: string;
  balance: number;
  color: string;
  text: string;
  number: string;
}

export interface FinanceTransaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  icon: ReactNode;
}

export interface Habit {
  id: string;
  name: string;
  meta: string;
  color: string;
  data: number[];
  monthly: number;
  yearly: number;
}
