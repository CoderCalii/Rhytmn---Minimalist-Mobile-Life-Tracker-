import { Text, View } from 'react-native';

interface DailyOverviewCardProps {
  tasksDue: number;
  habitsRemaining: number;
  spendToday: number;
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

const DailyOverviewCard = ({
  tasksDue,
  habitsRemaining,
  spendToday,
  loading,
  isSignedIn,
  error
}: DailyOverviewCardProps) => {
  return (
    <View className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.45)]">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Daily Overview</Text>
          <Text className="mt-2 text-lg font-semibold text-slate-900">Today at a glance</Text>
        </View>
        <Text className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Today</Text>
      </View>
      <View className="mt-5">
        {loading ? (
          <Text className="text-xs text-slate-400">Loading overview...</Text>
        ) : error ? (
          <Text className="text-xs text-rose-500">Unable to load overview.</Text>
        ) : !isSignedIn ? (
          <Text className="text-xs text-slate-400">Sign in to see your day.</Text>
        ) : (
          <View className="flex-row justify-between">
            <View className="rounded-2xl bg-white/70 p-3 shadow-sm items-center" style={{ width: '31%' }}>
              <Text className="text-xs font-semibold text-slate-400">Tasks Due</Text>
              <Text className="mt-2 text-xl font-semibold text-slate-900">{tasksDue}</Text>
            </View>
            <View className="rounded-2xl bg-white/70 p-3 shadow-sm items-center" style={{ width: '31%' }}>
              <Text className="text-xs font-semibold text-slate-400">Habits Left</Text>
              <Text className="mt-2 text-xl font-semibold text-slate-900">{habitsRemaining}</Text>
            </View>
            <View className="rounded-2xl bg-white/70 p-3 shadow-sm items-center" style={{ width: '31%' }}>
              <Text className="text-xs font-semibold text-slate-400">Spend</Text>
              <Text className="mt-2 text-xl font-semibold text-slate-900">
                {formatCurrency(spendToday)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default DailyOverviewCard;
