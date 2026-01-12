import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, Flame } from 'lucide-react-native';
import { eachDayOfInterval, endOfMonth, format, getDaysInMonth, getDaysInYear, startOfMonth, subDays } from 'date-fns';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import BrandLogo from '../../components/BrandLogo';
import type { TimeScale } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { getScrollPaddingBottom } from '../../components/layout/layoutConstants';

interface HabitLogRow {
  completed_on: string | null;
  user_id?: string | null;
}

interface HabitRow {
  id: string;
  title: string;
  frequency?: string | null;
  habit_logs?: HabitLogRow[] | null;
}

interface HabitEntry {
  id: string;
  name: string;
  meta: string;
  color: string;
  completedDates: Set<string>;
}

interface HabitsViewProps {
  refreshToken?: number;
}

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

const countDatesWithPrefix = (dates: Set<string>, prefix: string) => {
  let count = 0;
  dates.forEach((date) => {
    if (date.startsWith(prefix)) {
      count += 1;
    }
  });
  return count;
};

const MONTH_GRID_GAP = 4;

const getCurrentStreak = (dates: Set<string>, startDate: Date) => {
  let streak = 0;
  let cursor = startDate;

  while (dates.has(toDateKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
};

const HabitsView = ({ refreshToken = 0 }: HabitsViewProps) => {
  const [scale, setScale] = useState<TimeScale>('Daily');
  const { user, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthGridWidth, setMonthGridWidth] = useState(0);
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = getScrollPaddingBottom(insets) + 32;

  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDates = Array.from({ length: 7 }, (_, index) => subDays(today, 6 - index));
  const weekKeys = weekDates.map((date) => toDateKey(date));
  const monthDates = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
  const monthPrefix = format(today, 'yyyy-MM');
  const yearPrefix = format(today, 'yyyy');
  const daysInYear = getDaysInYear(today);
  const monthCellSize = monthGridWidth > 0
    ? (monthGridWidth - MONTH_GRID_GAP * 6) / 7
    : 0;

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    const userId = user.id;
    setLoading(true);
    setError(null);

    supabase
      .from('habits')
      .select('id, title, frequency, habit_logs(completed_on, user_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (!isMounted) return;
        if (fetchError) {
          setError('Failed to load habits.');
          setHabits([]);
        } else {
          const rows = (data ?? []) as HabitRow[];
          setHabits(rows.map((row) => {
            const completedDates = new Set(
              (row.habit_logs ?? [])
                .filter((log) => !log.user_id || log.user_id === userId)
                .map((log) => log.completed_on)
                .filter((date): date is string => Boolean(date))
            );

            return {
              id: row.id,
              name: row.title,
              meta: row.frequency ?? 'Daily',
              color: 'bg-black',
              completedDates
            };
          }));
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, refreshToken]);

  const toggleHabit = async (habitId: string) => {
    if (!user) {
      setError('Sign in to update habits.');
      return;
    }

    const habit = habits.find((entry) => entry.id === habitId);
    if (!habit) return;

    const dateKey = toDateKey(new Date());
    const wasCompleted = habit.completedDates.has(dateKey);
    const previousDates = new Set(habit.completedDates);

    setError(null);
    setHabits((prev) => prev.map((entry) => {
      if (entry.id !== habitId) return entry;
      const nextDates = new Set(entry.completedDates);
      if (wasCompleted) {
        nextDates.delete(dateKey);
      } else {
        nextDates.add(dateKey);
      }
      return { ...entry, completedDates: nextDates };
    }));

    const { error: toggleError } = wasCompleted
      ? await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_on', dateKey)
          .eq('user_id', user.id)
      : await supabase
          .from('habit_logs')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completed_on: dateKey,
            completed_at: new Date().toISOString()
          });

    if (toggleError) {
      setHabits((prev) => prev.map((entry) => (
        entry.id === habitId ? { ...entry, completedDates: new Set(previousDates) } : entry
      )));
      setError('Failed to update habit.');
      Alert.alert('Update failed', 'Failed to update habit.');
    }
  };

  const renderScaleContent = () => {
    switch (scale) {
      case 'Daily': {
        const currentStreak = habits.reduce((max, habit) => Math.max(max, getCurrentStreak(habit.completedDates, today)), 0);
        return (
          <View className="gap-6">
            <View className="flex-row items-center justify-between px-2 bg-gray-50 p-4 rounded-2xl">
              <View>
                <Text className="text-[10px] font-bold text-gray-400 uppercase">Current Streak</Text>
                <Text className="text-xl font-bold">{currentStreak} Days</Text>
              </View>
              <Flame size={20} color="#fb923c" fill="#fb923c" />
            </View>
            {habits.map((habit) => {
              const isCompletedToday = habit.completedDates.has(todayKey);
              return (
                <View key={habit.id} className="flex-row items-center justify-between p-4 border border-gray-200 rounded-2xl">
                  <View className="flex-row items-center gap-4">
                    <View className={`w-3 h-3 rounded-full ${isCompletedToday ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    <View>
                      <Text className="font-bold text-sm">{habit.name}</Text>
                      <Text className="text-[10px] text-gray-400">{habit.meta}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => toggleHabit(habit.id)}
                    className={`w-10 h-10 rounded-xl items-center justify-center ${isCompletedToday ? 'bg-black' : 'bg-gray-100'}`}
                  >
                    <Check size={20} color={isCompletedToday ? '#ffffff' : '#d1d5db'} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        );
      }

      case 'Weekly': {
        return (
          <View className="gap-8">
            <View className="flex-row justify-between px-2">
              {weekDates.map((date) => (
                <Text key={toDateKey(date)} className="text-[10px] font-bold text-gray-400 w-8 text-center">
                  {format(date, 'EEEEE')}
                </Text>
              ))}
            </View>
            {habits.map((habit) => {
              const weeklyCount = weekKeys.reduce((count, dateKey) => (
                count + (habit.completedDates.has(dateKey) ? 1 : 0)
              ), 0);
              return (
                <View key={habit.id}>
                  <View className="flex-row justify-between items-baseline mb-3">
                    <Text className="font-bold text-sm uppercase tracking-wider">{habit.name}</Text>
                    <Text className="text-[10px] text-gray-400 font-bold">{weeklyCount}/7 days</Text>
                  </View>
                  <View className="flex-row gap-1.5">
                    {weekKeys.map((dateKey) => (
                      <View
                        key={dateKey}
                        className={`flex-1 h-10 rounded-lg ${habit.completedDates.has(dateKey) ? habit.color : 'bg-[#d1d5db]'}`}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        );
      }

      case 'Monthly': {
        return (
          <View className="gap-8">
            {habits.map((habit) => {
              const monthlyCount = countDatesWithPrefix(habit.completedDates, monthPrefix);
              return (
                <View key={habit.id}>
                  <View className="flex-row justify-between items-baseline mb-3">
                    <Text className="font-bold text-sm uppercase tracking-wider">{habit.name}</Text>
                    <Text className="text-[10px] text-gray-400 font-bold">{monthlyCount} days active</Text>
                  </View>
                  <View
                    className="flex-row flex-wrap"
                    onLayout={(event) => {
                      const nextWidth = Math.floor(event.nativeEvent.layout.width);
                      if (nextWidth > 0 && nextWidth !== monthGridWidth) {
                        setMonthGridWidth(nextWidth);
                      }
                    }}
                  >
                    {monthDates.map((date, index) => {
                      const dateKey = toDateKey(date);
                      const isActive = habit.completedDates.has(dateKey);
                      const isRowEnd = (index + 1) % 7 === 0;
                      return (
                        <View
                          key={dateKey}
                          style={{
                            width: monthCellSize || undefined,
                            height: monthCellSize || undefined,
                            marginRight: isRowEnd ? 0 : MONTH_GRID_GAP,
                            marginBottom: MONTH_GRID_GAP
                          }}
                          className={`rounded-sm ${isActive ? habit.color : 'bg-[#d1d5db]'}`}
                        />
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        );
      }

      case 'Yearly': {
        return (
          <View className="gap-10">
            {habits.map((habit) => {
              const yearlyCount = countDatesWithPrefix(habit.completedDates, yearPrefix);
              const monthCounts = Array.from({ length: 12 }, (_, monthIdx) => (
                countDatesWithPrefix(habit.completedDates, format(new Date(today.getFullYear(), monthIdx, 1), 'yyyy-MM'))
              ));
              return (
                <View key={habit.id}>
                  <Text className="font-bold text-sm uppercase tracking-wider mb-4">{habit.name}</Text>
                  <View className="flex-row flex-wrap gap-1">
                    {monthCounts.map((count, monthIdx) => {
                      const monthDate = new Date(today.getFullYear(), monthIdx, 1);
                      const daysInMonth = getDaysInMonth(monthDate);
                      const completionPercent = daysInMonth ? Math.round((count / daysInMonth) * 100) : 0;
                      return (
                        <View key={format(monthDate, 'yyyy-MM')} className="items-center gap-1">
                          <View className="w-6 h-20 bg-[#d1d5db] rounded-full relative overflow-hidden">
                            <View
                              className={`absolute bottom-0 left-0 right-0 ${habit.color}`}
                              style={{ height: `${completionPercent}%` }}
                            />
                          </View>
                          <Text className="text-[8px] text-gray-400 font-bold text-center">{format(monthDate, 'MMM')}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View className="mt-4 p-4 bg-gray-50 rounded-2xl flex-row justify-between items-center">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase">Annual Completion</Text>
                    <Text
                      className="text-lg font-bold"
                      style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) }}
                    >
                      {yearlyCount}/{daysInYear}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
      }
    }
  };

  return (
    <ScrollView
      className="flex-1"
      stickyHeaderIndices={[0, 1]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
    >
      <AppHeader
        title="Rhythm"
        subtitle="Consistency > Intensity"
        rightAction={<BrandLogo className="h-8 w-8" />}
      />

      <View className="overflow-hidden">
        <BlurView intensity={40} tint="light" className="absolute inset-0" pointerEvents="none" />
        <View className="px-6 mb-8 mt-2 pb-4 bg-white/95">
          <View className="flex-row bg-gray-100 p-1 rounded-2xl border border-gray-100">
            {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as TimeScale[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setScale(mode)}
                className={`flex-1 py-2 rounded-xl ${scale === mode ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`text-center text-[10px] font-bold uppercase tracking-wider ${scale === mode ? 'text-black' : 'text-gray-400'}`}>
                  {mode}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View className="px-6">
        {authLoading || loading ? (
          <View className="p-4 bg-gray-50 rounded-2xl">
            <Text className="text-sm text-gray-400">Loading habits...</Text>
          </View>
        ) : !user ? (
          <View className="p-4 bg-gray-50 rounded-2xl">
            <Text className="text-sm text-gray-400">Sign in to view your habits.</Text>
          </View>
        ) : error ? (
          <View className="p-4 bg-rose-50 rounded-2xl">
            <Text className="text-sm text-rose-500">{error}</Text>
          </View>
        ) : habits.length === 0 ? (
          <View className="p-4 bg-gray-50 rounded-2xl">
            <Text className="text-sm text-gray-400">No habits yet.</Text>
          </View>
        ) : (
          renderScaleContent()
        )}
      </View>
    </ScrollView>
  );
};

export default HabitsView;
