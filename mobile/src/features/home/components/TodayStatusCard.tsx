import { Pressable, Text, View } from 'react-native';
import { Card } from '../../../components/ui/Card';

interface TodayStatusCardProps {
  tasksOpen: number;
  habitsLeft: number;
  alertsCount: number;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onTasksPress?: () => void;
  onHabitsPress?: () => void;
  onAlertsPress?: () => void;
}

const TodayStatusCard = ({
  tasksOpen,
  habitsLeft,
  alertsCount,
  loading,
  isSignedIn,
  error,
  onTasksPress,
  onHabitsPress,
  onAlertsPress
}: TodayStatusCardProps) => {
  const alertsLabel = alertsCount === 0 ? 'None' : `${alertsCount} attention`;
  const alertsTone = alertsCount === 0 ? 'text-slate-400' : 'text-rose-500';

  return (
    <Card
      blurIntensity={28}
      shadowColor="#0f172a"
      shadowOpacity={0.35}
      shadowRadius={24}
      shadowOffsetY={18}
      elevation={12}
      className="rounded-[28px] border border-white/80"
    >
      <View className="bg-white/85 p-5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Today</Text>
            <Text className="mt-2 text-lg font-semibold text-slate-900">Status</Text>
          </View>
        </View>
        <View className="mt-4">
          {loading ? (
            <Text className="text-slate-400">Loading today status...</Text>
          ) : error ? (
            <Text className="text-rose-500">Unable to load today status.</Text>
          ) : !isSignedIn ? (
            <Text className="text-slate-400">Sign in to see today status.</Text>
          ) : (
            <View className="gap-3">
              <Pressable
                onPress={onTasksPress}
                className="w-full flex-row items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-sm"
              >
                <Text className="text-slate-500">Tasks open</Text>
                <Text className={`font-semibold ${tasksOpen === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                  {tasksOpen}
                </Text>
              </Pressable>
              <Pressable
                onPress={onHabitsPress}
                className="w-full flex-row items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-sm"
              >
                <Text className="text-slate-500">Habits left</Text>
                <Text className={`font-semibold ${habitsLeft === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                  {habitsLeft}
                </Text>
              </Pressable>
              <Pressable
                onPress={onAlertsPress}
                className="w-full flex-row items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-sm"
              >
                <Text className="text-slate-500">Alerts</Text>
                <Text className={`font-semibold ${alertsTone}`}>{alertsLabel}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

export default TodayStatusCard;
