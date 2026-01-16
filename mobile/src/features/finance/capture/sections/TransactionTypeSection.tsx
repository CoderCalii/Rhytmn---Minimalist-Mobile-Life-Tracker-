import { TransactionTypeSelector } from '../components/TransactionTypeSelector';
import type { TransactionType } from '../capture.types';

interface TransactionTypeSectionProps {
  type: TransactionType;
  onTypeChange: (type: TransactionType) => void;
}

export const TransactionTypeSection = ({ type, onTypeChange }: TransactionTypeSectionProps) => {
  return <TransactionTypeSelector type={type} onTypeChange={onTypeChange} />;
};

