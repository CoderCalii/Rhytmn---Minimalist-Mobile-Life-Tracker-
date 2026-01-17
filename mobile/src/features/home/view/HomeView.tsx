import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Sun } from 'lucide-react-native';
import { addDays, endOfDay, format, startOfDay, subDays } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import AppHeader from '../../../components/AppHeader';
import AuthControl from '../components/AuthControl';
import FocusTile from '../components/FocusTile';
import ResurfacingCard from '../components/ResurfacingCard';
import TodayStatusCard from '../components/TodayStatusCard';
import { useTasks } from '../../../store/tasksProvider';
import { useHabits } from '../../../store/habitsProvider';
import { useAuth } from '../../../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { getScrollPaddingBottom } from '../../../components/layout/layoutConstants';

interface HomeViewProps {
  onGoTasks?: () => void;
  onGoHabits?: () => void;
  onGoAlerts?: () => void;
  onOpenSettings?: () => void;
}

interface NoteRow {
  id: string;
  title?: string | null;
  content?: string | null;
  created_at?: string | null;
}

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

const parseFlexibleDate = (value?: string | null) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const HomeView = ({ onGoTasks, onGoHabits, onGoAlerts, onOpenSettings }: HomeViewProps) => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { habits, habitLogs, loading: habitsLoading, error: habitsError } = useHabits();
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [resurfacingNote, setResurfacingNote] = useState<NoteRow | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = getScrollPaddingBottom(insets);

  const homeLoading = tasksLoading || habitsLoading || notesLoading;
  const homeError = tasksError || habitsError || notesError;

  // Fetch notes (still needed, but can be moved to a provider later)
  useEffect(() => {
    if (!user) {
      // Reset state when user becomes null
      const timer = setTimeout(() => {
        setResurfacingNote(null);
        setNotesLoading(false);
        setNotesError(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;
    // Use setTimeout to avoid synchronous setState warning
    setTimeout(() => {
      setNotesLoading(true);
      setNotesError(null);
    }, 0);

    // Check if Supabase is configured before making API calls
    if (isSupabaseConfigured) {
      supabase
        .from('notes')
        .select('id, title, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data, error: notesFetchError }) => {
          if (!isMounted) return;
          if (notesFetchError) {
            setNotesError('Failed to load notes.');
            setResurfacingNote(null);
          } else {
            const notes = (data ?? []) as NoteRow[];
            const recentNote = notes.find((note) => note.title || note.content);
            setResurfacingNote(recentNote ?? null);
          }
          setNotesLoading(false);
        })
        .catch((err) => {
          console.warn('[HomeView] Failed to fetch notes:', err);
          if (!isMounted) return;
          setNotesError('Failed to load notes.');
          setResurfacingNote(null);
          setNotesLoading(false);
        });
    } else {
      setNotesLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Compute derived state from provider data
  const { todayStatus, focusItem, resurfacing } = useMemo(() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    const yesterdayKey = toDateKey(subDays(now, 1));
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const nextWeekEnd = endOfDay(addDays(now, 7));

    // Tasks computation
    const incompleteTasks = tasks.filter((task) => !task.completed);
    const tasksOpen = incompleteTasks.length;
    const overdueTasks = incompleteTasks.filter((task) => {
      const dueDate = parseFlexibleDate(task.due_date ?? null);
      return Boolean(dueDate && dueDate < todayStart);
    });
    const billsDue = incompleteTasks.filter((task) => {
      const dueDate = parseFlexibleDate(task.due_date ?? null);
      if (!dueDate || dueDate > nextWeekEnd) return false;
      const title = task.title?.toLowerCase() ?? '';
      return title.includes('bill');
    });

    // Habits computation
    const activeHabits = habits.filter((habit) => habit.active !== false);
    const habitCompletedDates = new Map<string, Set<string>>();
    habitLogs.forEach((log) => {
      if (!log.completed_on) return;
      if (!habitCompletedDates.has(log.habit_id)) {
        habitCompletedDates.set(log.habit_id, new Set());
      }
      habitCompletedDates.get(log.habit_id)!.add(log.completed_on);
    });

    const pendingHabits = activeHabits.filter((habit) => {
      const dates = habitCompletedDates.get(habit.id) ?? new Set();
      return !dates.has(todayKey);
    });
    const habitsRemaining = pendingHabits.length;
    const habitsMissed = activeHabits.filter((habit) => {
      const dates = habitCompletedDates.get(habit.id) ?? new Set();
      return !dates.has(todayKey) && !dates.has(yesterdayKey);
    }).length;

    // Focus task
    const focusTask = incompleteTasks
      .slice()
      .sort((first, second) => {
        const firstDue = parseFlexibleDate(first.due_date ?? null);
        const secondDue = parseFlexibleDate(second.due_date ?? null);
        if (firstDue && secondDue) return firstDue.getTime() - secondDue.getTime();
        if (firstDue) return -1;
        if (secondDue) return 1;
        return 0;
      })[0];

    const focusTaskDue = focusTask ? parseFlexibleDate(focusTask.due_date ?? null) : null;
    const focusTaskActionable = Boolean(
      focusTask && focusTaskDue && focusTaskDue <= todayEnd
    );
    const focusItem = focusTaskActionable && focusTask
      ? {
          title: focusTask.title,
          subtitle: focusTaskDue ? `Due ${format(focusTaskDue, 'MMM d')}` : 'Upcoming task',
          isValid: true
        }
      : { title: '', subtitle: '', isValid: false };

    // Resurfacing note
    const recentNote = resurfacingNote;
    const resurfacing = recentNote
      ? (() => {
          const noteDate = parseFlexibleDate(recentNote.created_at ?? null);
          const snippet = recentNote.content?.replace(/\s+/g, ' ').trim() ?? '';
          return {
            title: recentNote.title ?? 'Recent note',
            description: snippet ? `${snippet.slice(0, 90)}${snippet.length > 90 ? '...' : ''}` : 'A recent note is ready.',
            highlight: null as string | null,
            items: [] as string[],
            dateLabel: noteDate ? format(noteDate, 'MMM d') : null
          };
        })()
      : {
          title: 'Gentle reminder',
          description: 'Nothing resurfaced yet.',
          highlight: null as string | null,
          items: [] as string[],
          dateLabel: null as string | null
        };

    // Alerts
    const alertTaskIds = new Set<string>();
    overdueTasks.forEach((task) => alertTaskIds.add(task.id));
    billsDue.forEach((task) => alertTaskIds.add(task.id));
    const alertsCount = alertTaskIds.size + habitsMissed;

    return {
      todayStatus: {
        tasksOpen,
        habitsLeft: habitsRemaining,
        alertsCount
      },
      focusItem,
      resurfacing
    };
  }, [tasks, habits, habitLogs, resurfacingNote]);

  const isSignedIn = Boolean(user);

  const todayLabel = format(new Date(), 'EEEE, MMM d');

  return (
    <View className="flex-1 bg-[#f5efe8]">
      <View pointerEvents="none" className="absolute inset-0">
        <View
          className="absolute -top-24 right-[-60px] h-64 w-64 rounded-full bg-[#f7c59f] opacity-70"
          style={{ shadowColor: '#f7c59f', shadowOpacity: 0.6, shadowRadius: 40, shadowOffset: { width: 0, height: 0 }, elevation: 6 }}
        />
        <View
          className="absolute top-44 -left-28 h-72 w-72 rounded-full bg-[#bae6fd] opacity-70"
          style={{ shadowColor: '#bae6fd', shadowOpacity: 0.6, shadowRadius: 50, shadowOffset: { width: 0, height: 0 }, elevation: 6 }}
        />
        <View
          className="absolute bottom-24 right-[-40px] h-56 w-56 rounded-full bg-[#b9f5d8] opacity-60"
          style={{ shadowColor: '#b9f5d8', shadowOpacity: 0.6, shadowRadius: 40, shadowOffset: { width: 0, height: 0 }, elevation: 6 }}
        />
      </View>

      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
      >
        <AppHeader
          title="Home"
          subtitle={todayLabel}
          rightAction={(
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 rounded-full bg-white/70 items-center justify-center">
                <Sun size={18} color="#0f172a" />
              </View>
              <AuthControl onOpenSettings={onOpenSettings} />
            </View>
          )}
        />

        <View className="px-6 mt-2 gap-10">
          <View>
            <TodayStatusCard
              tasksOpen={todayStatus.tasksOpen}
              habitsLeft={todayStatus.habitsLeft}
              alertsCount={todayStatus.alertsCount}
              loading={homeLoading}
              isSignedIn={isSignedIn}
              error={homeError}
              onTasksPress={onGoTasks}
              onHabitsPress={onGoHabits}
              onAlertsPress={onGoAlerts ?? onGoTasks}
            />
          </View>

          <View>
            <ResurfacingCard
              title={resurfacing.title}
              description={resurfacing.description}
              highlight={resurfacing.highlight}
              items={resurfacing.items}
              dateLabel={resurfacing.dateLabel}
              loading={homeLoading}
              isSignedIn={isSignedIn}
              error={homeError}
              onPress={
                resurfacingNote && !homeLoading && !homeError
                  ? () => setIsNoteOpen(true)
                  : undefined
              }
            />
          </View>

          {focusItem.isValid ? (
            <View>
              <FocusTile
                title={focusItem.title}
                subtitle={focusItem.subtitle}
                loading={homeLoading}
                isSignedIn={isSignedIn}
                error={homeError}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal transparent visible={isNoteOpen} animationType="slide" onRequestClose={() => setIsNoteOpen(false)}>
        <View className="flex-1 items-center justify-end px-4 pb-10">
          <BlurView intensity={50} tint="dark" className="absolute inset-0" pointerEvents="none" />
          <Pressable className="absolute inset-0 bg-black/60" onPress={() => setIsNoteOpen(false)} />
          <View className="w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-lg font-black">{resurfacingNote?.title ?? 'Note'}</Text>
              <Pressable
                onPress={() => setIsNoteOpen(false)}
                className="h-8 w-8 rounded-full bg-gray-50 items-center justify-center"
              >
                <Text className="text-gray-400">X</Text>
              </Pressable>
            </View>
            <Text className="text-sm text-slate-600">{resurfacingNote?.content ?? ''}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeView;
