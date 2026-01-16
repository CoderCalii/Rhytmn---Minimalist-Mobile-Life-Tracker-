import { Pressable, Text, View } from 'react-native';
import { Check, Circle } from 'lucide-react-native';

interface TodayHabit {
  id: string;
  title: string;
  frequency?: string | null;
}

interface HabitsTodaySectionProps {
  habits: TodayHabit[];
  completedHabitIds: Set<string>;
  loading: boolean;
  error: string | null;
  onToggleHabit: (habitId: string) => void;
}

export function HabitsTodaySection({
  habits,
  completedHabitIds,
  loading,
  error,
  onToggleHabit
}: HabitsTodaySectionProps) {
  return (
    <View className="mt-8">
      <View className="mb-4">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-xs font-black uppercase tracking-widest text-gray-400">Habits</Text>
          <Text className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
            {habits.length} habits
          </Text>
        </View>
      </View>

      {loading ? (
        <Text className="p-5 text-sm text-gray-400">Loading habits...</Text>
      ) : error ? (
        <Text className="p-5 text-sm text-rose-500">{error}</Text>
      ) : habits.length === 0 ? (
        <Text className="p-5 text-sm text-gray-400">No habits yet.</Text>
      ) : (
        <View className="gap-3">
          {habits.map((habit) => {
            const isCompletedToday = completedHabitIds.has(habit.id);
            return (
              <Pressable
                key={habit.id}
                onPress={() => onToggleHabit(habit.id)}
                className="flex-row items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50"
              >
                <View className="flex-row items-center gap-3">
                  <View className={`h-3 w-3 rounded-full ${isCompletedToday ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <View>
                    <Text className="font-semibold text-gray-800">{habit.title}</Text>
                    {habit.frequency ? (
                      <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {habit.frequency}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center ${
                    isCompletedToday ? 'bg-black' : 'bg-white border border-gray-200'
                  }`}
                >
                  {isCompletedToday ? <Check size={18} color="#ffffff" /> : <Circle size={18} color="#d1d5db" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}


