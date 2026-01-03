import { createElement } from 'react';
import { Brain, Car, TrendingUp, Tv, Utensils, Zap } from 'lucide-react';
import type { FinanceAccount, FinanceGoal, FinanceTransaction, Habit, Page } from './types';

export const INITIAL_PAGES: Page[] = [
  {
    id: 'daily',
    title: 'Today',
    icon: 'ðŸ—“ï¸',
    category: 'system',
    updatedAt: 'Now',
    blocks: [
      { id: 'b1', type: 'heading', content: 'Morning Focus' },
      { id: 'b2', type: 'todo', content: { text: 'Review Q4 strategy document', completed: false } },
      { id: 'b3', type: 'todo', content: { text: 'Email marketing team', completed: true } },
    ]
  },
  {
    id: '1',
    title: 'Product Strategy',
    icon: createElement(Brain, { size: 20, className: 'text-black' }),
    updatedAt: '2h ago',
    blocks: [
      { id: 'b4', type: 'heading', content: 'Core Principles' },
      { id: 'b5', type: 'text', content: 'Simplicity is the ultimate sophistication.' },
    ]
  },
];

export const INITIAL_TRANSACTIONS: FinanceTransaction[] = [
  { id: 't1', title: 'Blue Bottle Coffee', category: 'Food & Drink', amount: 6.50, type: 'expense', date: 'Today', icon: createElement(Utensils, { size: 16 }) },
  { id: 't2', title: 'Salary Deposit', category: 'Work', amount: 4200.00, type: 'income', date: 'Today', icon: createElement(TrendingUp, { size: 16 }) },
  { id: 't3', title: 'Apple Store', category: 'Tech', amount: 129.00, type: 'expense', date: 'Yesterday', icon: createElement(Zap, { size: 16 }) },
  { id: 't4', title: 'Uber Trip', category: 'Transport', amount: 24.80, type: 'expense', date: 'Yesterday', icon: createElement(Car, { size: 16 }) },
  { id: 't5', title: 'Netflix', category: 'Entertainment', amount: 15.99, type: 'expense', date: 'Jan 1', icon: createElement(Tv, { size: 16 }) },
];

export const INITIAL_GOALS: FinanceGoal[] = [
  { id: 'g1', name: 'Real Estate', target: 100000, current: 84200, color: 'bg-orange-50' },
  { id: 'g2', name: 'New Car', target: 45000, current: 12000, color: 'bg-purple-50' },
  { id: 'g3', name: 'Emergency Fund', target: 20000, current: 18500, color: 'bg-blue-50' },
  { id: 'g4', name: 'Japan Trip', target: 8000, current: 3200, color: 'bg-rose-50' },
];

export const INITIAL_ACCOUNTS: FinanceAccount[] = [
  { name: 'Main Spending', balance: 12450.80, color: 'bg-black', text: 'text-white', number: '8821' },
  { name: 'High Yield Savings', balance: 45200.00, color: 'bg-blue-600', text: 'text-white', number: '4410' },
  { name: 'Business Pro', balance: 8900.25, color: 'bg-emerald-500', text: 'text-white', number: '1002' },
];

export const INITIAL_HABITS: Habit[] = [
  { id: 'h1', name: 'Deep Work', meta: '2h/day', color: 'bg-black', data: [1, 1, 0, 1, 1, 1, 0], monthly: 22, yearly: 245 },
  { id: 'h2', name: 'Reading', meta: '20p/day', color: 'bg-black', data: [0, 1, 1, 1, 0, 1, 1], monthly: 18, yearly: 190 },
  { id: 'h3', name: 'Movement', meta: '45m/day', color: 'bg-black', data: [1, 0, 1, 0, 1, 1, 1], monthly: 25, yearly: 310 }
];
