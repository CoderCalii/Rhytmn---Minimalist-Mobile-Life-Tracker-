export type TransactionType = 'income' | 'expense' | 'goal' | 'transfer';

export type GoalFlow = 'contribution' | 'withdrawal';

export interface FinanceCaptureModalProps {
  onClose: () => void;
  onSaved?: () => void;
  accounts?: import('../../../types').FinanceAccount[];
  goals?: import('../../../types').FinanceGoal[];
  initialGoalId?: string | null;
  initialType?: TransactionType | null;
  currencySymbol?: '$' | 'ƒ,ñ';
  currencyCode?: 'USD' | 'PHP';
}

export interface FinanceAccountRow {
  id: string;
  name: string | null;
  balance: number | string | null;
  color: string | null;
  last_four: string | null;
}

export interface FinanceGoalRow {
  id: string;
  name: string | null;
  target: number | string | null;
  current: number | string | null;
  color: string | null;
}

