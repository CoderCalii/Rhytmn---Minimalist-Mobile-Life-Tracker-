import { Text, View } from 'react-native';
import { formatCurrency } from '../../../../utils/formatters';
import AnimatedNumber from '../AnimatedNumber';

type ChartPoint = { label: string; spend: number; budget: number };
type ChartData = { points: ChartPoint[]; maxValue: number };
type Summary = { spent: number; income: number; net: number };

type ThisWeekSheetProps = {
  summary: Summary;
  weeklyBudget: number;
  weeklyInsight: string | null;
  chart: ChartData;
  currencyCode: 'USD' | 'PHP';
};

const ThisWeekSheet = ({ summary, weeklyBudget, weeklyInsight, chart, currencyCode }: ThisWeekSheetProps) => {
  return (
    <View>
      <View className="flex-row mb-3">
        <View className="flex-1 rounded-2xl bg-slate-50 p-4 mr-3">
          <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Spent</Text>
          <AnimatedNumber
            value={summary.spent}
            format={(value) => formatCurrency(value, currencyCode)}
            className="text-xl font-black text-slate-900"
          />
          {weeklyBudget > 0 ? (
            <Text className="mt-1 text-[10px] font-semibold text-slate-400">
              Budget {formatCurrency(weeklyBudget, currencyCode)}
            </Text>
          ) : null}
        </View>
        <View className="flex-1 rounded-2xl bg-slate-50 p-4">
          <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Income</Text>
          <AnimatedNumber
            value={summary.income}
            format={(value) => formatCurrency(value, currencyCode)}
            className="text-xl font-black text-emerald-600"
          />
        </View>
      </View>
      <View className="rounded-2xl bg-slate-50 p-4 mb-3">
        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net</Text>
        <AnimatedNumber
          value={summary.net}
          format={(value) => formatCurrency(value, currencyCode)}
          className={`text-xl font-black ${summary.net >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}
        />
        {weeklyInsight ? (
          <Text className="mt-2 text-xs text-slate-500">{weeklyInsight}</Text>
        ) : null}
      </View>
      <View className="rounded-2xl bg-slate-50 p-4">
        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
          Spend vs budget
        </Text>
        <View className="flex-row items-end" style={{ height: 96 }}>
          {chart.points.map((point, index) => (
            <View key={`${point.label}-${index}`} className="flex-1 items-center justify-end">
              <View className="w-full rounded-full bg-slate-200/70 relative" style={{ height: 96 }}>
                {point.budget > 0 ? (
                  <View
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-emerald-200/70"
                    style={{ height: `${(point.budget / chart.maxValue) * 100}%` }}
                  />
                ) : null}
                <View
                  className="absolute bottom-0 left-0 right-0 rounded-full bg-emerald-400"
                  style={{ height: `${(point.spend / chart.maxValue) * 100}%` }}
                />
              </View>
              <Text className="mt-2 text-[9px] font-semibold text-slate-400">{point.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default ThisWeekSheet;
