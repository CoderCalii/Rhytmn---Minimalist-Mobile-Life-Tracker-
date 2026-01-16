import { AmountInput } from '../components/AmountInput';

interface AmountSectionProps {
  amount: number | null;
  onAmountChange: (amount: number | null) => void;
  currencySymbol: string;
  accentColor: string;
}

export const AmountSection = ({ amount, onAmountChange, currencySymbol, accentColor }: AmountSectionProps) => {
  return (
    <AmountInput
      amount={amount}
      onAmountChange={onAmountChange}
      currencySymbol={currencySymbol}
      accentColor={accentColor}
    />
  );
};

