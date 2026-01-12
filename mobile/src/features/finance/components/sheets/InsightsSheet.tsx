import { Text, View } from 'react-native';

type AnomalyCategory = { name: string; amount: number; delta: number };
type CategoryTrend = { name: string; amount: number; previous: number; delta: number | null };

type InsightsSheetProps = {
  anomalyCategories: AnomalyCategory[];
  subscriptionShare: number | null;
  categoryTrends: CategoryTrend[];
};

const InsightsSheet = ({ anomalyCategories, subscriptionShare, categoryTrends }: InsightsSheetProps) => {
  return (
    <View>
      <View className="rounded-2xl bg-slate-50 p-4 mb-4">
        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          Spending anomalies
        </Text>
        {anomalyCategories.length === 0 ? (
          <Text className="text-xs text-slate-500">No unusual spikes detected.</Text>
        ) : (
          <View>
            {anomalyCategories.map((item) => (
              <View key={item.name} className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-slate-600">{item.name}</Text>
                <Text className="text-xs font-semibold text-rose-500">+{Math.round(item.delta * 100)}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View className="rounded-2xl bg-slate-50 p-4 mb-4">
        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          Subscription creep
        </Text>
        {subscriptionShare ? (
          <Text className="text-xs text-slate-600">Subscriptions are {subscriptionShare}% of monthly income.</Text>
        ) : (
          <Text className="text-xs text-slate-500">No income data to compare yet.</Text>
        )}
      </View>
      <View className="rounded-2xl bg-slate-50 p-4">
        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          Category trends
        </Text>
        {categoryTrends.length === 0 ? (
          <Text className="text-xs text-slate-500">No category trends yet.</Text>
        ) : (
          <View>
            {categoryTrends.map((item) => (
              <View key={item.name} className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-slate-600">{item.name}</Text>
                {item.delta === null ? (
                  <Text className="text-xs text-slate-400">New</Text>
                ) : (
                  <Text className={`text-xs ${item.delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {item.delta >= 0 ? '+' : '-'} {Math.round(Math.abs(item.delta) * 100)}%
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default InsightsSheet;
