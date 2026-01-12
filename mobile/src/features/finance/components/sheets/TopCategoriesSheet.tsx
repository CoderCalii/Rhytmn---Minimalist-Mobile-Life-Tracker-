import { formatCurrency } from '../../../../utils/formatters';
import { Text, View } from 'react-native';

type CategoryTotal = { name: string; amount: number };

type TopCategoriesSheetProps = {
  categories: CategoryTotal[];
  total: number;
  insight: string | null;
  currencyCode: 'USD' | 'PHP';
};

const TopCategoriesSheet = ({ categories, total, insight, currencyCode }: TopCategoriesSheetProps) => {
  return (
    <View>
      {categories.length === 0 ? (
        <Text className="text-sm text-slate-400">No spend captured yet.</Text>
      ) : (
        categories.map((category) => {
          const share = total > 0 ? Math.round((category.amount / total) * 100) : 0;
          return (
            <View key={category.name} className="mb-3 rounded-2xl bg-slate-50 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-900">{category.name}</Text>
                <Text className="text-sm font-semibold text-slate-900">
                  {formatCurrency(category.amount, currencyCode)}
                </Text>
              </View>
              <View className="mt-2 h-1.5 w-full rounded-full bg-slate-200/70">
                <View className="h-full rounded-full bg-sky-400" style={{ width: `${share}%` }} />
              </View>
              <Text className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {share}% of spend
              </Text>
            </View>
          );
        })
      )}
      {insight && <Text className="mt-1 text-xs text-slate-500">{insight}</Text>}
    </View>
  );
};

export default TopCategoriesSheet;
