import { Car, TrendingUp, Tv, Utensils, Wallet, Zap } from 'lucide-react-native';
import type { FinanceIconName } from '../../../types';

const iconMap = {
  'trending-up': TrendingUp,
  utensils: Utensils,
  car: Car,
  tv: Tv,
  zap: Zap,
  wallet: Wallet
} as const;

type TransactionIconProps = {
  name: FinanceIconName;
  size?: number;
  color?: string;
};

const TransactionIcon = ({ name, size = 16, color = '#0f172a' }: TransactionIconProps) => {
  const Icon = iconMap[name] ?? Wallet;
  return <Icon size={size} color={color} />;
};

export default TransactionIcon;
