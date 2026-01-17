/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface HabitRow {
  id: string;
  title: string;
  frequency?: string | null;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HabitLogRow {
  id: string;
  habit_id: string;
  user_id: string;
  completed_on: string;
  completed_at?: string | null;
  created_at?: string | null;
}

interface HabitsContextValue {
  habits: HabitRow[];
  habitLogs: HabitLogRow[];
  loading: boolean;
  error: string | null;
  refreshHabits: () => Promise<void>;
  toggleHabitToday: (habitId: string) => Promise<void>;
  isHabitCompletedToday: (habitId: string) => boolean;
  getHabitStreak: (habitId: string) => number;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

function useHabitsInternal(userId: string | null): HabitsContextValue {
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLogRow[]>([]);
  const [loading, setLoading] = useState(() => Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    if (!userId) {
      // Reset state when userId becomes null - using setTimeout to avoid synchronous setState
      setTimeout(() => {
        setHabits([]);
        setHabitLogs([]);
        setLoading(false);
        setError(null);
      }, 0);
      return;
    }

    // Skip Supabase calls if not configured
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setHabits([]);
        setHabitLogs([]);
        setLoading(false);
        setError(null);
      }, 0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [habitsResult, logsResult] = await Promise.all([
        supabase
          .from('habits')
          .select('id, title, frequency, active, created_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('habit_logs')
          .select('id, habit_id, user_id, completed_on, completed_at, created_at')
          .eq('user_id', userId)
          .order('completed_on', { ascending: false })
      ]);

      if (habitsResult.error) {
        setError('Failed to load habits.');
        setHabits([]);
        setHabitLogs([]);
        setLoading(false);
        return;
      }

      if (logsResult.error) {
        setError('Failed to load habit logs.');
        setHabits((habitsResult.data ?? []) as HabitRow[]);
        setHabitLogs([]);
        setLoading(false);
        return;
      }

      setHabits((habitsResult.data ?? []) as HabitRow[]);
      setHabitLogs((logsResult.data ?? []) as HabitLogRow[]);
    } catch (err) {
      console.warn('[habitsProvider] Failed to fetch habits:', err);
      setError('Failed to load habits.');
      setHabits([]);
      setHabitLogs([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState warning
    const timer = setTimeout(() => {
      fetchHabits();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchHabits]);

  const refreshHabits = useCallback(async () => {
    await fetchHabits();
  }, [fetchHabits]);

  const isHabitCompletedToday = useCallback(
    (habitId: string): boolean => {
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      return habitLogs.some(
        (log) => log.habit_id === habitId && log.completed_on === todayKey
      );
    },
    [habitLogs]
  );

  const toggleHabitToday = useCallback(
    async (habitId: string) => {
      if (!userId) return;

      const todayKey = format(new Date(), 'yyyy-MM-dd');
      const wasCompleted = isHabitCompletedToday(habitId);
      const previousLogs = [...habitLogs];

      // Optimistic update
      if (wasCompleted) {
        setHabitLogs((prev) =>
          prev.filter(
            (log) => !(log.habit_id === habitId && log.completed_on === todayKey)
          )
        );
      } else {
        const newLog: HabitLogRow = {
          id: `temp-${Date.now()}`,
          habit_id: habitId,
          user_id: userId,
          completed_on: todayKey,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        setHabitLogs((prev) => [newLog, ...prev]);
      }

      setError(null);

      // Background sync to Supabase
      const { error: toggleError } = wasCompleted
        ? await supabase
            .from('habit_logs')
            .delete()
            .eq('habit_id', habitId)
            .eq('completed_on', todayKey)
            .eq('user_id', userId)
        : await supabase.from('habit_logs').insert({
            habit_id: habitId,
            user_id: userId,
            completed_on: todayKey,
            completed_at: new Date().toISOString()
          });

      if (toggleError) {
        // Revert on error
        setHabitLogs(previousLogs);
        setError('Failed to update habit.');
      } else if (!wasCompleted) {
        // Refresh to get real ID from Supabase
        await fetchHabits();
      }
    },
    [userId, habitLogs, isHabitCompletedToday, fetchHabits]
  );

  const getHabitStreak = useCallback(
    (habitId: string): number => {
      const habitDates = habitLogs
        .filter((log) => log.habit_id === habitId && log.completed_on)
        .map((log) => log.completed_on!)
        .sort()
        .reverse();

      if (habitDates.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      for (let i = 0; i < habitDates.length; i++) {
        const expectedDate = format(
          new Date(today.getTime() - i * 24 * 60 * 60 * 1000),
          'yyyy-MM-dd'
        );
        if (habitDates[i] === expectedDate) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    },
    [habitLogs]
  );

  return {
    habits: userId ? habits : [],
    habitLogs: userId ? habitLogs : [],
    loading: userId ? loading : false,
    error: userId ? error : null,
    refreshHabits,
    toggleHabitToday,
    isHabitCompletedToday,
    getHabitStreak
  };
}

export const HabitsProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user ? user.id : null;
  const value = useHabitsInternal(userId);

  const merged: HabitsContextValue = {
    ...value,
    loading: authLoading || value.loading
  };

  return <HabitsContext.Provider value={merged}>{children}</HabitsContext.Provider>;
};

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return ctx;
}

