import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedNumber from './AnimatedNumber';
import { Card } from '../../../components/ui/Card';

interface UpcomingBillItem {
  name: string;
  dateLabel: string;
  amount: number;
}

interface UpcomingBillsCardProps {
  bills: UpcomingBillItem[];
  currencyCode?: 'USD' | 'PHP';
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onPress?: () => void;
  rangeLabel?: string;
  insight?: string | null;
  monthTotal?: number | null;
}

const formatCurrency = (value: number, currencyCode: 'USD' | 'PHP') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value);

const UpcomingBillsCard = ({
  bills,
  currencyCode = 'USD',
  loading,
  isSignedIn,
  error,
  onPress,
  rangeLabel = 'This period',
  insight,
  monthTotal
}: UpcomingBillsCardProps) => {
  const isInteractive = Boolean(onPress);
  const showMonthTotal = isSignedIn && !loading && !error && monthTotal != null;

  return (
    <Card
      blurIntensity={24}
      shadowColor="#f43f5e"
      shadowOpacity={0.35}
      shadowRadius={18}
      shadowOffsetY={12}
      elevation={10}
      className="rounded-3xl border border-rose-200/70"
    >
      <Pressable
        onPress={onPress}
        disabled={!isInteractive}
        className="bg-white/85 p-5"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Upcoming Bills</Text>
          {!loading && !error && isSignedIn ? (
            <View className="rounded-full bg-slate-100 px-2 py-1">
              <Text className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                {bills.length} due {rangeLabel}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="mt-3 h-[3px] w-12 overflow-hidden rounded-full">
          <LinearGradient
            colors={['#fb7185', '#fdba74', '#fcd34d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 3, width: 48 }}
          />
        </View>
        {loading ? (
          <Text className="mt-3 text-sm text-slate-400">Loading bills...</Text>
        ) : error ? (
          <Text className="mt-3 text-sm text-rose-500">Unable to load bills.</Text>
        ) : !isSignedIn ? (
          <Text className="mt-3 text-sm text-slate-400">Sign in to see bills.</Text>
        ) : (
          <View className="mt-4 gap-3">
            {showMonthTotal ? (
              <View className="flex-row items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm border border-rose-100/70">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  This month total
                </Text>
                <AnimatedNumber
                  value={monthTotal ?? 0}
                  format={(value) => formatCurrency(value, currencyCode)}
                  className="font-semibold text-slate-900"
                />
              </View>
            ) : null}
            {bills.length === 0 ? (
              <Text className="text-sm text-slate-400">No upcoming bills.</Text>
            ) : (
              <View className="gap-3">
                {bills.map((bill) => (
                  <View
                    key={`${bill.name}-${bill.dateLabel}`}
                    className="flex-row items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm border border-rose-100/70"
                  >
                    <View>
                      <Text className="font-semibold text-slate-900">{bill.name}</Text>
                      <Text className="text-xs text-slate-400">{bill.dateLabel}</Text>
                    </View>
                    <Text className="font-semibold text-slate-900">{formatCurrency(bill.amount, currencyCode)}</Text>
                  </View>
                ))}
                {insight ? (
                  <Text className="pt-1 text-xs text-slate-500">{insight}</Text>
                ) : null}
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Card>
  );
};

export default UpcomingBillsCard;
