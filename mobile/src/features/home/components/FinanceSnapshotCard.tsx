import { Text, View } from 'react-native';

interface FinanceSnapshotCardProps {
  balance: number;
  weeklySpend: number;
  budget: number | null;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
}

const formatCurrency = (value: number) => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
);

const FinanceSnapshotCard = ({
  balance,
  weeklySpend,
  budget,
  loading,
  isSignedIn,
  error
}: FinanceSnapshotCardProps) => {
  const hasBudget = budget !== null && Number.isFinite(budget);
  const spendRatio = hasBudget && budget ? Math.min(weeklySpend / budget, 1) : 0;

  return (
    <View className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.45)]">
      <Text className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Finance</Text>
      {loading ? (
        <Text className="mt-4 text-sm text-slate-400">Loading finance snapshot...</Text>
      ) : error ? (
        <Text className="mt-4 text-sm text-rose-500">Unable to load finance data.</Text>
      ) : !isSignedIn ? (
        <Text className="mt-4 text-sm text-slate-400">Sign in to see finance details.</Text>
      ) : (
        <View>
          <Text className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(balance)}</Text>
          <Text className="mt-1 text-xs text-slate-500">Current balance</Text>
          <View className="mt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500">This week spend</Text>
              <Text className="text-xs text-slate-500">{formatCurrency(weeklySpend)}</Text>
            </View>
            <View className="mt-2 h-2 rounded-full bg-slate-100">
              <View
                className="h-2 rounded-full bg-slate-900"
                style={{ width: `${Math.round(spendRatio * 100)}%` }}
              />
            </View>
            <Text className="mt-2 text-[11px] text-slate-400">
              {hasBudget ? `Budget: ${formatCurrency(budget)}` : 'Budget not set'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default FinanceSnapshotCard;
