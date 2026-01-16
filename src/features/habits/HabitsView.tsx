import { useEffect, useState } from 'react';
import { Check, Flame } from 'lucide-react';
import { eachDayOfInterval, endOfMonth, format, getDaysInMonth, getDaysInYear, startOfMonth, subDays } from 'date-fns';
import AppHeader from '../../components/AppHeader';
import BrandLogo from '../../components/BrandLogo';
import type { TimeScale } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

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

  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDates = Array.from({ length: 7 }, (_, index) => subDays(today, 6 - index));
  const weekKeys = weekDates.map((date) => toDateKey(date));
  const monthDates = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
  const monthPrefix = format(today, 'yyyy-MM');
  const yearPrefix = format(today, 'yyyy');
  const daysInYear = getDaysInYear(today);

  useEffect(() => {
    if (!user) {
      setTimeout(() => {
        setHabits([]);
        setLoading(false);
        setError(null);
      }, 0);
      return;
    }

    let isMounted = true;
    const userId = user.id;
    setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    // TODO: Move to React Query (TanStack Query) for caching and background refetching as this scales.
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
      window.alert('Failed to update habit.');
    }
  };

  const renderScaleContent = () => {
    switch (scale) {
      case 'Daily': {
        const currentStreak = habits.reduce((max, habit) => Math.max(max, getCurrentStreak(habit.completedDates, today)), 0);
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 bg-gray-50 p-4 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Current Streak</span>
                <span className="text-xl font-bold">{currentStreak} Days</span>
              </div>
              <Flame className="text-orange-400 fill-orange-400" size={20} />
            </div>
            {habits.map((habit) => {
              const isCompletedToday = habit.completedDates.has(todayKey);
              return (
                <div key={habit.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${isCompletedToday ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    <div>
                      <h4 className="font-bold text-sm">{habit.name}</h4>
                      <p className="text-[10px] text-gray-400">{habit.meta}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    aria-pressed={isCompletedToday}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCompletedToday ? 'bg-black text-white' : 'bg-gray-100 text-gray-300'}`}
                  >
                    <Check size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        );
      }

      case 'Weekly': {
        return (
          <div className="space-y-8">
            <div className="flex justify-between px-2">
              {weekDates.map((date) => (
                <span key={toDateKey(date)} className="text-[10px] font-bold text-gray-400 w-8 text-center">
                  {format(date, 'EEEEE')}
                </span>
              ))}
            </div>
            {habits.map((habit) => {
              const weeklyCount = weekKeys.reduce((count, dateKey) => (
                count + (habit.completedDates.has(dateKey) ? 1 : 0)
              ), 0);
              return (
                <div key={habit.id}>
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="font-bold text-sm uppercase tracking-wider">{habit.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{weeklyCount}/7 days</span>
                  </div>
                  <div className="flex justify-between gap-1.5 h-10">
                    {weekKeys.map((dateKey) => (
                      <div
                        key={dateKey}
                        className={`flex-1 rounded-lg transition-all duration-500 ${habit.completedDates.has(dateKey) ? habit.color : 'bg-[#f3f4f6]'}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'Monthly': {
        return (
          <div className="space-y-8">
            {habits.map((habit) => {
              const monthlyCount = countDatesWithPrefix(habit.completedDates, monthPrefix);
              return (
                <div key={habit.id}>
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="font-bold text-sm uppercase tracking-wider">{habit.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{monthlyCount} days active</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthDates.map((date) => {
                      const dateKey = toDateKey(date);
                      const isActive = habit.completedDates.has(dateKey);
                      return (
                        <div 
                          key={dateKey} 
                          className={`aspect-square rounded-sm ${isActive ? habit.color : 'bg-[#f3f4f6]'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'Yearly': {
        return (
          <div className="space-y-10">
            {habits.map((habit) => {
              const yearlyCount = countDatesWithPrefix(habit.completedDates, yearPrefix);
              const monthCounts = Array.from({ length: 12 }, (_, monthIdx) => (
                countDatesWithPrefix(habit.completedDates, format(new Date(today.getFullYear(), monthIdx, 1), 'yyyy-MM'))
              ));
              return (
                <div key={habit.id}>
                  <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{habit.name}</h4>
                  <div className="flex flex-wrap gap-1">
                    {monthCounts.map((count, monthIdx) => {
                      const monthDate = new Date(today.getFullYear(), monthIdx, 1);
                      const daysInMonth = getDaysInMonth(monthDate);
                      const completionPercent = daysInMonth ? Math.round((count / daysInMonth) * 100) : 0;
                      return (
                        <div key={format(monthDate, 'yyyy-MM')} className="flex flex-col gap-1">
                          <div className="w-6 h-20 bg-[#f3f4f6] rounded-full relative overflow-hidden">
                            <div 
                              className={`absolute bottom-0 left-0 right-0 ${habit.color} transition-all duration-1000`} 
                              style={{ height: `${completionPercent}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-gray-400 font-bold text-center">{format(monthDate, 'MMM')}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Annual Completion</span>
                    <span className="text-lg font-mono font-bold">{yearlyCount}/{daysInYear}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-40">
      <AppHeader
        title="Rhythm"
        subtitle="Consistency > Intensity"
        rightAction={<BrandLogo className="h-8 w-8" />}
      />
      
      <div className="px-6 mb-8 mt-2 sticky top-24 bg-white/95 backdrop-blur-sm pb-4 z-10">
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-100">
          {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as TimeScale[]).map((mode) => (
            <button 
              key={mode} 
              onClick={() => setScale(mode)} 
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${scale === mode ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {authLoading || loading ? (
          <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-400">Loading habits...</div>
        ) : !user ? (
          <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-400">Sign in to view your habits.</div>
        ) : error ? (
          <div className="p-4 bg-rose-50 rounded-2xl text-sm text-rose-500">{error}</div>
        ) : habits.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-400">No habits yet.</div>
        ) : (
          renderScaleContent()
        )}
      </div>
    </div>
  );
};

export default HabitsView;
