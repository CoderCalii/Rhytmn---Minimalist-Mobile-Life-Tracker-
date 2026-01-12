import { useEffect, useState } from 'react';
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
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import type { TaskRow } from '../../tasks/components/useTasks';
import { isTaskArchived, parseTags } from '../../tasks/components/useTasks';
import { getScrollPaddingBottom } from '../../../components/layout/layoutConstants';

interface HomeViewProps {
  onGoTasks?: () => void;
  onGoHabits?: () => void;
  onGoAlerts?: () => void;
  onOpenSettings?: () => void;
}

interface HabitLogRow {
  completed_on?: string | null;
  user_id?: string | null;
}

interface HabitRow {
  id: string;
  title?: string | null;
  frequency?: string | null;
  habit_logs?: HabitLogRow[] | null;
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
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);
  const [todayStatus, setTodayStatus] = useState({
    tasksOpen: 0,
    habitsLeft: 0,
    alertsCount: 0
  });
  const [focusItem, setFocusItem] = useState({
    title: '',
    subtitle: '',
    isValid: false
  });
  const [resurfacing, setResurfacing] = useState({
    title: 'Gentle reminder',
    description: 'Nothing resurfaced yet.',
    highlight: null as string | null,
    items: [] as string[],
    dateLabel: null as string | null
  });
  const [resurfacingNote, setResurfacingNote] = useState<NoteRow | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = getScrollPaddingBottom(insets);

  useEffect(() => {
    if (!user) {
      setHomeLoading(false);
      setHomeError(null);
      setTodayStatus({ tasksOpen: 0, habitsLeft: 0, alertsCount: 0 });
      setFocusItem({ title: '', subtitle: '', isValid: false });
      setResurfacingNote(null);
      setResurfacing({
        title: 'Gentle reminder',
        description: 'Nothing resurfaced yet.',
        highlight: null,
        items: [],
        dateLabel: null
      });
      return;
    }

    let isMounted = true;
    setHomeLoading(true);
    setHomeError(null);

    const now = new Date();
    const todayKey = toDateKey(now);
    const yesterdayKey = toDateKey(subDays(now, 1));
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const nextWeekEnd = endOfDay(addDays(now, 7));

    const fetchHomeData = async () => {
      const [tasksResult, habitsResult, notesResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, completed, created_at, updated_at, due_date, priority, tags')
          .eq('user_id', user.id),
        supabase
          .from('habits')
          .select('id, title, frequency, habit_logs(completed_on, user_id)')
          .eq('user_id', user.id),
        supabase
          .from('notes')
          .select('id, title, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (!isMounted) return;

      const homeLoadFailed = Boolean(tasksResult.error || habitsResult.error || notesResult.error);
      if (homeLoadFailed) {
        setHomeError('Failed to load home data.');
      }

      const tasks = (tasksResult.data ?? []) as TaskRow[];
      const habits = (habitsResult.data ?? []) as HabitRow[];
      const notes = (notesResult.data ?? []) as NoteRow[];

      const activeTasks = tasks.filter((task) => !isTaskArchived(task));
      const incompleteTasks = activeTasks.filter((task) => !task.completed);
      const tasksOpen = incompleteTasks.length;
      const overdueTasks = incompleteTasks.filter((task) => {
        const dueDate = parseFlexibleDate(task.due_date ?? null);
        return Boolean(dueDate && dueDate < todayStart);
      });
      const billsDue = incompleteTasks.filter((task) => {
        const dueDate = parseFlexibleDate(task.due_date ?? null);
        if (!dueDate || dueDate > nextWeekEnd) return false;
        const tags = parseTags(task.tags ?? null).map((tag) => tag.toLowerCase());
        return tags.some((tag) => tag.includes('bill'));
      });

      const habitEntries = habits.map((habit) => {
        const completedDates = new Set(
          (habit.habit_logs ?? [])
            .filter((log) => !log.user_id || log.user_id === user.id)
            .map((log) => log.completed_on)
            .filter((date): date is string => Boolean(date))
        );
        return {
          id: habit.id,
          title: habit.title ?? 'Habit',
          completedDates
        };
      });

      const pendingHabits = habitEntries.filter((habit) => !habit.completedDates.has(todayKey));
      const habitsRemaining = pendingHabits.length;
      const habitsMissed = habitEntries.filter((habit) => (
        !habit.completedDates.has(todayKey) && !habit.completedDates.has(yesterdayKey)
      )).length;

      const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const focusTask = incompleteTasks
        .slice()
        .sort((first, second) => {
          const firstDue = parseFlexibleDate(first.due_date ?? null);
          const secondDue = parseFlexibleDate(second.due_date ?? null);
          if (firstDue && secondDue) return firstDue.getTime() - secondDue.getTime();
          if (firstDue) return -1;
          if (secondDue) return 1;
          const firstRank = priorityRank[first.priority ?? 'medium'] ?? 1;
          const secondRank = priorityRank[second.priority ?? 'medium'] ?? 1;
          return firstRank - secondRank;
        })[0];

      const focusTaskDue = focusTask ? parseFlexibleDate(focusTask.due_date ?? null) : null;
      const focusTaskActionable = Boolean(
        focusTask && ((focusTaskDue && focusTaskDue <= todayEnd) || focusTask?.priority === 'high')
      );
      if (focusTaskActionable && focusTask) {
        setFocusItem({
          title: focusTask.title,
          subtitle: focusTaskDue ? `Due ${format(focusTaskDue, 'MMM d')}` : 'High priority task',
          isValid: true
        });
      } else {
        setFocusItem({ title: '', subtitle: '', isValid: false });
      }

      const recentNote = notes.find((note) => note.title || note.content);
      if (recentNote) {
        setResurfacingNote(recentNote);
        const noteDate = parseFlexibleDate(recentNote.created_at ?? null);
        const snippet = recentNote.content?.replace(/\s+/g, ' ').trim() ?? '';
        setResurfacing({
          title: recentNote.title ?? 'Recent note',
          description: snippet ? `${snippet.slice(0, 90)}${snippet.length > 90 ? '...' : ''}` : 'A recent note is ready.',
          highlight: null,
          items: [],
          dateLabel: noteDate ? format(noteDate, 'MMM d') : null
        });
      } else {
        setResurfacingNote(null);
        setResurfacing({
          title: 'Gentle reminder',
          description: 'Nothing resurfaced yet.',
          highlight: null,
          items: [],
          dateLabel: null
        });
      }

      const alertTaskIds = new Set<string>();
      overdueTasks.forEach((task) => alertTaskIds.add(task.id));
      billsDue.forEach((task) => alertTaskIds.add(task.id));
      const alertsCount = alertTaskIds.size + habitsMissed;

      setTodayStatus({
        tasksOpen,
        habitsLeft: habitsRemaining,
        alertsCount
      });

      setHomeLoading(false);
    };

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
