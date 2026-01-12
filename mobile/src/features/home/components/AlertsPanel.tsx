import { Text, View } from 'react-native';

interface AlertsPanelProps {
  overdueTasks: number;
  billsDue: number;
  habitsMissed: number;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
}

const AlertsPanel = ({
  overdueTasks,
  billsDue,
  habitsMissed,
  loading,
  isSignedIn,
  error
}: AlertsPanelProps) => {
  return (
    <View className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.45)]">
      <Text className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Alerts</Text>
      {loading ? (
        <Text className="mt-4 text-sm text-slate-400">Loading alerts...</Text>
      ) : error ? (
        <Text className="mt-4 text-sm text-rose-500">Unable to load alerts.</Text>
      ) : !isSignedIn ? (
        <Text className="mt-4 text-sm text-slate-400">Sign in to see alerts.</Text>
      ) : (
        <View className="mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-slate-600">Overdue tasks</Text>
            <Text className="text-sm font-semibold text-slate-900">{overdueTasks}</Text>
          </View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-slate-600">Bills due (7 days)</Text>
            <Text className="text-sm font-semibold text-slate-900">{billsDue}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-slate-600">Habits missed 2 days</Text>
            <Text className="text-sm font-semibold text-slate-900">{habitsMissed}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AlertsPanel;
