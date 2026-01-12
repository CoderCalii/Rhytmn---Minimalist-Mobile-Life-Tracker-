import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedNumber from './AnimatedNumber';
import { Card } from '../../../components/ui/Card';

type DeltaIndicator = {
  direction: 'up' | 'down' | 'flat';
  label: string;
};

interface ThisWeekSummaryProps {
  spent: number;
  income: number;
  net: number;
  currencyCode?: 'USD' | 'PHP';
  helperText?: string | null;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onPress?: () => void;
  rangeLabel?: string;
  progress?: number;
  budgetAmount?: number;
  incomeDelta?: DeltaIndicator | null;
  netDelta?: DeltaIndicator | null;
  insight?: string | null;
}

const formatCurrency = (value: number, currencyCode: 'USD' | 'PHP') => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value)
);

const ThisWeekSummary = ({
  spent,
  income,
  net,
  currencyCode = 'USD',
  helperText,
  loading,
  isSignedIn,
  error,
  onPress,
  rangeLabel = 'This Week',
  progress,
  budgetAmount,
  incomeDelta,
  netDelta,
  insight
}: ThisWeekSummaryProps) => {
  const isInteractive = Boolean(onPress);
  const progressValue = progress ? Math.min(Math.max(progress, 0), 1) : 0;

  const renderDelta = (delta?: DeltaIndicator | null) => {
    if (!delta) return null;
    const tone =
      delta.direction === 'up'
        ? 'text-emerald-600 bg-emerald-50'
        : delta.direction === 'down'
          ? 'text-rose-600 bg-rose-50'
          : 'text-slate-400 bg-slate-100';
    return (
      <View className={`rounded-full px-2 py-0.5 ${tone}`}>
        <Text className="text-[9px] font-black uppercase tracking-widest">{delta.label}</Text>
      </View>
    );
  };

  return (
    <Card
      blurIntensity={24}
      shadowColor="#10b981"
      shadowOpacity={0.35}
      shadowRadius={18}
      shadowOffsetY={12}
      elevation={10}
      className="rounded-3xl border border-emerald-200/70"
    >
      <Pressable
        onPress={onPress}
        disabled={!isInteractive}
        className="bg-white/85 p-5"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{rangeLabel}</Text>
          {helperText && !loading && !error && isSignedIn ? (
            <View className={`rounded-full px-2 py-1 ${net >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <Text className={`text-[9px] font-bold uppercase tracking-widest ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {net >= 0 ? 'On track' : 'Watch spend'}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="mt-3 h-[3px] w-12 overflow-hidden rounded-full">
          <LinearGradient
            colors={['#34d399', '#a3e635', '#fcd34d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 3, width: 48 }}
          />
        </View>
        {loading ? (
          <Text className="mt-3 text-sm text-slate-400">Loading summary...</Text>
        ) : error ? (
          <Text className="mt-3 text-sm text-rose-500">Unable to load summary.</Text>
        ) : !isSignedIn ? (
          <Text className="mt-3 text-sm text-slate-400">Sign in to see weekly summary.</Text>
        ) : (
          <View className="mt-4 gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Spent so far</Text>
                {budgetAmount !== undefined && budgetAmount > 0 ? (
                  <Text className="text-[10px] font-semibold text-slate-400">
                    of {formatCurrency(budgetAmount, currencyCode)}
                  </Text>
                ) : null}
              </View>
              <AnimatedNumber
                value={spent}
                format={(value) => formatCurrency(value, currencyCode)}
                className="font-semibold text-slate-900"
              />
            </View>
            {budgetAmount !== undefined && budgetAmount > 0 ? (
              <View className="h-1.5 w-full rounded-full bg-slate-100">
                <View
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${progressValue * 100}%` }}
                />
              </View>
            ) : null}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Income</Text>
                {renderDelta(incomeDelta)}
              </View>
              <AnimatedNumber
                value={income}
                format={(value) => formatCurrency(value, currencyCode)}
                className="font-semibold text-emerald-600"
              />
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Net</Text>
                {renderDelta(netDelta)}
              </View>
              <AnimatedNumber
                value={net}
                format={(value) => formatCurrency(value, currencyCode)}
                className={`font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}
              />
            </View>
            {insight ? (
              <Text className="pt-2 text-xs text-slate-500">{insight}</Text>
            ) : null}
          </View>
        )}
      </Pressable>
    </Card>
  );
};

export default ThisWeekSummary;
