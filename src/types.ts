import type { ReactNode } from 'react';

export type TimeScale = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export type TodoContent = {
  text: string;
  completed?: boolean;
  done?: boolean;
};

export type Block =
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'heading'; content: string }
  | { id: string; type: 'todo'; content: TodoContent }
  | { id: string; type: 'habit_widget'; content: Record<string, unknown> }
  | { id: string; type: 'finance_widget'; content: Record<string, unknown> };

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
