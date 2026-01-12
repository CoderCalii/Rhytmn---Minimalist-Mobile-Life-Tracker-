import { Text, View } from 'react-native';
import type { FinanceGoal } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';

type GrowthTargetsSheetProps = {
  goals: FinanceGoal[];
  currencyCode: 'USD' | 'PHP';
  isActive?: boolean;
};

const GrowthTargetsSheet = ({ goals, currencyCode }: GrowthTargetsSheetProps) => {
  return (
    <View>
      {goals.length === 0 ? (
        <Text className="text-sm text-slate-400">No goals created yet.</Text>
      ) : (
        goals.map((goal) => {
          const progress = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
          const projectedProgress = Math.min(progress + (1 - progress) * 0.35, 1);

          return (
            <View key={goal.id} className="rounded-2xl bg-slate-50 p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-slate-900">{goal.name}</Text>
                  <Text className="text-xs text-slate-400">
                    {formatCurrency(goal.current, currencyCode)} of {formatCurrency(goal.target, currencyCode)}
                  </Text>
                </View>
                <Text className="text-[10px] font-black text-slate-900">{Math.round(progress * 100)}%</Text>
              </View>
              <View className="mt-4">
                <View className="relative h-2 w-full rounded-full bg-slate-200/70">
                  <View
                    className="absolute inset-y-0 left-0 rounded-full bg-slate-900"
                    style={{ width: `${progress * 100}%` }}
                  />
                  <View
                    className="absolute inset-y-0 left-0 rounded-full bg-slate-400/70"
                    style={{ width: `${projectedProgress * 100}%` }}
                  />
                </View>
                <View className="mt-2 flex-row justify-between">
                  <Text className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Past</Text>
                  <Text className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Now</Text>
                  <Text className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Projected</Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

export default GrowthTargetsSheet;
