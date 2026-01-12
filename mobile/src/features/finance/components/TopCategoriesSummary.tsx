import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedNumber from './AnimatedNumber';
import { Card } from '../../../components/ui/Card';

interface CategorySummary {
  name: string;
  amount: number;
}

interface TopCategoriesSummaryProps {
  categories: CategorySummary[];
  currencyCode?: 'USD' | 'PHP';
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onPress?: () => void;
  rangeLabel?: string;
  insight?: string | null;
}

const formatCurrency = (value: number, currencyCode: 'USD' | 'PHP') => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value)
);

const TopCategoriesSummary = ({
  categories,
  currencyCode = 'USD',
  loading,
  isSignedIn,
  error,
  onPress,
  rangeLabel = 'This week',
  insight
}: TopCategoriesSummaryProps) => {
  const isInteractive = Boolean(onPress);

  return (
    <Card
      blurIntensity={24}
      shadowColor="#0ea5e9"
      shadowOpacity={0.35}
      shadowRadius={18}
      shadowOffsetY={12}
      elevation={10}
      className="rounded-3xl border border-sky-200/70"
    >
      <Pressable
        onPress={onPress}
        disabled={!isInteractive}
        className="bg-white/85 p-5"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Top Categories</Text>
          {!loading && !error && isSignedIn ? (
            <View className="rounded-full bg-slate-100 px-2 py-1">
              <Text className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{rangeLabel}</Text>
            </View>
          ) : null}
        </View>
        <View className="mt-3 h-[3px] w-12 overflow-hidden rounded-full">
          <LinearGradient
            colors={['#38bdf8', '#22d3ee', '#5eead4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 3, width: 48 }}
          />
        </View>
        {loading ? (
          <Text className="mt-3 text-sm text-slate-400">Loading categories...</Text>
        ) : error ? (
          <Text className="mt-3 text-sm text-rose-500">Unable to load categories.</Text>
        ) : !isSignedIn ? (
          <Text className="mt-3 text-sm text-slate-400">Sign in to see categories.</Text>
        ) : categories.length === 0 ? (
          <Text className="mt-3 text-sm text-slate-400">No spending yet.</Text>
        ) : (
          <View className="mt-4 gap-3">
            {categories.map((category) => (
              <View
                key={category.name}
                className="flex-row items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm border border-sky-100/70"
              >
                <Text className="font-semibold text-slate-900">{category.name}</Text>
                <AnimatedNumber
                  value={category.amount}
                  format={(value) => formatCurrency(value, currencyCode)}
                  className="font-semibold text-slate-900"
                />
              </View>
            ))}
            {insight ? (
              <Text className="pt-1 text-xs text-slate-500">{insight}</Text>
            ) : null}
          </View>
        )}
      </Pressable>
    </Card>
  );
};

export default TopCategoriesSummary;
