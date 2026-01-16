import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View
} from 'react-native';
import type { TextInput } from 'react-native';
import { differenceInHours, format, formatDistanceToNowStrict } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { sanitizeText } from '../../../utils/sanitize';
import { useAuth } from '../../../hooks/useAuth';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteFilters } from '../components/notes/NoteFilters';
import { TaskBulkActions } from '../components/tasks/TaskBulkActions';
import { TaskCreator } from '../components/tasks/TaskCreator';
import { TaskItem } from '../components/tasks/TaskItem';
import { TasksHeader } from '../components/tasks/TasksHeader';
import { TaskNoteComposer } from '../components/notes/TaskNoteComposer';
import { TaskSearchBar } from '../components/tasks/TaskSearchBar';
import { HabitsTodaySection } from '../components/tasks/HabitsTodaySection';
import { SwipeableTaskRow } from '../components/tasks/SwipeableTaskRow';
import { useNotes } from '../components/useNotes';
import type { NoteRow } from '../components/useNotes';
import { useDailyRollover } from '../components/useDailyRollover';
import { useTaskSelection } from '../components/useTaskSelection';
import { useTasks } from '../../../store/tasksProvider';
import { useHabits } from '../../../store/habitsProvider';
import type { RootStackParamList } from '../../../navigation/types';
import { getScrollPaddingBottom } from '../../../components/layout/layoutConstants';

type NoteFilter = 'All' | 'Ideas' | 'Personal';
type FocusMode = 'tasks' | 'notes';

interface TasksViewProps {
  isAddingInline: boolean;
  inlineValue: string;
  inlineInputRef: RefObject<TextInput | null>;
  onInlineChange: (value: string) => void;
  onStartInline: () => void;
  onCancelInline: () => void;
  onInlineAdded?: (title: string) => void;
}

const NOTE_FILTERS: NoteFilter[] = ['All', 'Ideas', 'Personal'];
const NOTE_CATEGORIES = ['Idea', 'Meeting', 'Personal', 'Urgent'];

const formatTimestamp = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hoursDiff = Math.abs(differenceInHours(new Date(), date));
  if (hoursDiff < 24) {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
  return format(date, 'MMM d');
};

const formatShortDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'MMM d');
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toLocalDateKey = (value?: string | null) => {
  const parsed = parseDate(value);
  if (!parsed) return null;
  return format(parsed, 'yyyy-MM-dd');
};

const TasksView = ({
  isAddingInline,
  inlineValue,
  inlineInputRef,
  onInlineChange,
  onStartInline,
  onCancelInline,
  onInlineAdded
}: TasksViewProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteCategory, setNoteCategory] = useState('Idea');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState<string | null>(null);
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [noteFilter, setNoteFilter] = useState<NoteFilter>('All');
  const [inlineDueDate, setInlineDueDate] = useState('');
  const [inlineHasDeadline, setInlineHasDeadline] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>('tasks');
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = getScrollPaddingBottom(insets);

  const userId = user ? ((user as { uid?: string }).uid ?? user.id) : null;
  const normalizedNotesSearch = notesSearchQuery.trim().toLowerCase();
  const tasksFocused = focusMode === 'tasks';
  const notesFocused = focusMode === 'notes';
  const tasksOpacityRef = useRef(new Animated.Value(tasksFocused ? 1 : 0));
  const notesOpacityRef = useRef(new Animated.Value(notesFocused ? 1 : 0));
  const tasksTranslateRef = useRef(new Animated.Value(tasksFocused ? 0 : 8));
  const notesTranslateRef = useRef(new Animated.Value(notesFocused ? 0 : 8));
  // Animated.Value refs are safe to access during render - they're stable references
  const tasksOpacity = tasksOpacityRef.current;
  const notesOpacity = notesOpacityRef.current;
  const tasksTranslate = tasksTranslateRef.current;
  const notesTranslate = notesTranslateRef.current;
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refreshTasks,
    createTask,
    completeTask,
    archiveTask,
    bulkComplete,
    bulkArchive
  } = useTasks();
  const {
    habits: allHabits,
    loading: habitsLoading,
    error: habitsError,
    toggleHabitToday,
    isHabitCompletedToday
  } = useHabits();
  
  // Compute todayKey locally (yyyy-MM-dd format)
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  
  // Derive today's habits from provider data
  const todayHabits = allHabits.filter((habit) => habit.active !== false);
  const completedHabitIds = new Set(
    todayHabits
      .filter((habit) => isHabitCompletedToday(habit.id))
      .map((habit) => habit.id)
  );
  const {
    notes,
    notesLoading,
    notesError,
    refreshNotes,
    addNote
  } = useNotes(userId);
  const {
    selectMode,
    selectedTaskIds,
    selectedIds,
    enterSelectMode,
    toggleSelection,
    exitSelectMode
  } = useTaskSelection();
  const notesReady = !notesLoading && !tasksLoading;
  const tasksReady = !tasksLoading;
  
  const { rolloverCount } = useDailyRollover({
    userId,
    tasks,
    notesReady,
    tasksReady
  });

  useEffect(() => {
    if (rolloverCount === 0) return;
    refreshTasks();
    refreshNotes();
    exitSelectMode();
  }, [exitSelectMode, refreshNotes, refreshTasks, rolloverCount]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.parallel([
      Animated.timing(tasksOpacity, {
        toValue: tasksFocused ? 1 : 0,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(notesOpacity, {
        toValue: notesFocused ? 1 : 0,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(tasksTranslate, {
        toValue: tasksFocused ? 0 : 8,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.timing(notesTranslate, {
        toValue: notesFocused ? 0 : 8,
        duration: 180,
        useNativeDriver: true
      })
    ]).start();
    // Animated.Value refs are stable and don't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesFocused, tasksFocused]);

  // Split tasks into todayTasks and looseTasks
  // All tasks from useTasks are already active (archived_at IS NULL)
  const todayTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const taskDateKey = toLocalDateKey(task.due_date);
    return taskDateKey === todayKey;
  });
  
  const looseTasks = tasks.filter((task) => task.due_date == null);

  const noteMatchesFilter = (note: NoteRow) => {
    if (noteFilter === 'All') return true;
    const category = note.category?.toLowerCase() ?? '';
    if (noteFilter === 'Ideas') return category.includes('idea');
    return category.includes('personal');
  };

  const matchesNotesSearch = (note: NoteRow) => {
    if (normalizedNotesSearch.length === 0) return true;
    const title = note.title?.toLowerCase() ?? '';
    const content = note.content?.toLowerCase() ?? '';
    return title.includes(normalizedNotesSearch) || content.includes(normalizedNotesSearch);
  };

  const filteredNotes = notes.filter((note) => (
    matchesNotesSearch(note) && noteMatchesFilter(note)
  ));

  const sortNotes = (list: NoteRow[]) => (
    [...list].sort((first, second) => {
      const firstPinned = first.is_pinned === true;
      const secondPinned = second.is_pinned === true;
      if (firstPinned !== secondPinned) return secondPinned ? 1 : -1;
      const firstTime = parseDate(first.created_at)?.getTime() ?? 0;
      const secondTime = parseDate(second.created_at)?.getTime() ?? 0;
      return secondTime - firstTime;
    })
  );

  const todayNotes = filteredNotes.filter((note) => {
    const noteDateKey = toLocalDateKey(note.created_at);
    if (!noteDateKey) return false;
    return noteDateKey === todayKey;
  });

  const pastNotes = filteredNotes.filter((note) => {
    const noteDateKey = toLocalDateKey(note.created_at);
    if (!noteDateKey) return false;
    return noteDateKey < todayKey;
  });

  const sortedTodayNotes = sortNotes(todayNotes);
  const sortedPastNotes = sortNotes(pastNotes);

  const resetInlineMeta = () => {
    setInlineDueDate('');
    setInlineHasDeadline(false);
  };

  const handleStartInline = () => {
    if (selectMode) exitSelectMode();
    resetInlineMeta();
    onStartInline();
  };

  const handleAddInline = async () => {
    if (!userId) return;
    const trimmed = sanitizeText(inlineValue).trim();
    if (!trimmed) {
      resetInlineMeta();
      onCancelInline();
      return;
    }

    const created = await createTask(
      trimmed,
      inlineHasDeadline ? inlineDueDate || null : null
    );

    if (created) {
      onInlineChange('');
      resetInlineMeta();
      onInlineAdded?.(trimmed);
    }
  };

  const resetNoteComposer = () => {
    setNoteTitle('');
    setNoteBody('');
    setNoteCategory('Idea');
    setNoteSaveError(null);
    setIsAddingNote(false);
  };

  const handleAddNote = async () => {
    if (!userId) return;
    const safeTitle = sanitizeText(noteTitle).trim() || 'Untitled Note';
    const safeBody = sanitizeText(noteBody).trim();
    if (!safeBody) {
      setNoteSaveError('Add a note before saving.');
      return;
    }
    const safeCategory = sanitizeText(noteCategory).trim() || 'Idea';

    setNoteSaving(true);
    setNoteSaveError(null);
    const created = await addNote({
      title: safeTitle,
      content: safeBody,
      category: safeCategory,
      icon: 'N',
      isPinned: false
    });
    setNoteSaving(false);

    if (created) {
      resetNoteComposer();
    } else {
      setNoteSaveError('Failed to save note.');
    }
  };

  const handleToggleTask = async (task: { id: string }) => {
    await completeTask(task.id);
  };

  const handleBulkComplete = async () => {
    if (selectedIds.length === 0) return;
    const updated = await bulkComplete(selectedIds);
    if (updated) {
      exitSelectMode();
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    const updated = await bulkArchive(selectedIds);
    if (updated) {
      exitSelectMode();
    }
  };


  return (
    <ScrollView
      className="flex-1"
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
    >
      <TasksHeader focusMode={focusMode} onFocusChange={setFocusMode} />

      <View className="px-6">
        <Animated.View
          className="mt-10"
          pointerEvents={tasksFocused ? 'auto' : 'none'}
          style={[
            { opacity: tasksOpacity, transform: [{ translateY: tasksTranslate }] },
            !tasksFocused && { height: 0, overflow: 'hidden' },
            tasksFocused ? { marginBottom: 40 } : { marginBottom: 0 }
          ]}
        >
            {selectMode ? (
              <View className="mb-6">
                <TaskBulkActions
                  selectedCount={selectedTaskIds.size}
                  onComplete={handleBulkComplete}
                  onArchive={handleBulkArchive}
                  onExit={exitSelectMode}
                />
              </View>
            ) : null}

            {/* Today Tasks Section */}
            <View className="mb-6">
              <View className="mb-4">
                <View className="flex-row items-center justify-between px-1">
                  <Text className="text-xs font-black uppercase tracking-widest text-gray-400">Today</Text>
                  <Text className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                    {todayTasks.length} tasks
                  </Text>
                </View>
              </View>
              
              {authLoading || tasksLoading ? (
                <Text className="p-5 text-sm text-gray-400">Loading tasks...</Text>
              ) : !user ? (
                <Text className="p-5 text-sm text-gray-400">Sign in to view your tasks.</Text>
              ) : tasksError ? (
                <Text className="p-5 text-sm text-rose-500">{tasksError}</Text>
              ) : todayTasks.length === 0 ? (
                <Text className="p-5 text-sm text-gray-400">No tasks for today.</Text>
              ) : (
                <View className="gap-3">
                  {todayTasks.map((task) => {
                    const row = (
                      <TaskItem
                        key={task.id}
                        task={task}
                        timestampLabel={formatTimestamp(task.updated_at ?? task.created_at)}
                        dueDateLabel={formatShortDate(task.due_date)}
                        isSelected={selectedTaskIds.has(task.id)}
                        isSelectMode={selectMode}
                        onToggleComplete={() => handleToggleTask(task)}
                        onToggleSelect={() => toggleSelection(task.id)}
                        onLongPress={() => enterSelectMode(task.id)}
                      />
                    );

                    if (selectMode) {
                      return row;
                    }

                    return (
                      <SwipeableTaskRow
                        key={task.id}
                        onArchive={() => {
                          archiveTask(task.id);
                        }}
                      >
                        {row}
                      </SwipeableTaskRow>
                    );
                  })}
                </View>
              )}
            </View>

            <View className="mt-2">
              <TaskCreator
                isAdding={isAddingInline}
                value={inlineValue}
                dueDate={inlineDueDate}
                hasDeadline={inlineHasDeadline}
                inputRef={inlineInputRef}
                onChange={onInlineChange}
                onDueDateChange={setInlineDueDate}
                onToggleDeadline={(nextValue) => {
                  setInlineHasDeadline(nextValue);
                  if (!nextValue) {
                    setInlineDueDate('');
                  }
                }}
                onStart={handleStartInline}
                onCancel={() => {
                  resetInlineMeta();
                  onCancelInline();
                }}
                onSubmit={handleAddInline}
                disabled={!user}
                placeholder={user ? 'What needs to be done?' : 'Sign in to add tasks'}
              />
            </View>

            {/* Loose Notes Section */}
            <View className="mt-8">
              <View className="mb-4">
                <View className="flex-row items-center justify-between px-1">
                  <Text className="text-xs font-black uppercase tracking-widest text-gray-400">Loose Notes</Text>
                  <Text className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                    {looseTasks.length} items
                  </Text>
                </View>
              </View>
              
              {looseTasks.length === 0 ? (
                <Text className="p-5 text-sm text-gray-400">No loose notes yet.</Text>
              ) : (
                <View className="gap-3">
                  {looseTasks.map((task) => {
                    const row = (
                      <TaskItem
                        key={task.id}
                        task={task}
                        timestampLabel={formatTimestamp(task.updated_at ?? task.created_at)}
                        dueDateLabel=""
                        isSelected={selectedTaskIds.has(task.id)}
                        isSelectMode={selectMode}
                        onToggleComplete={() => handleToggleTask(task)}
                        onToggleSelect={() => toggleSelection(task.id)}
                        onLongPress={() => enterSelectMode(task.id)}
                      />
                    );

                    if (selectMode) {
                      return row;
                    }

                    return (
                      <SwipeableTaskRow
                        key={task.id}
                        onArchive={() => {
                          archiveTask(task.id);
                        }}
                      >
                        {row}
                      </SwipeableTaskRow>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Habits Today Section (read-only relative to tasks) */}
            <HabitsTodaySection
              habits={todayHabits.map((h) => ({ id: h.id, title: h.title, frequency: h.frequency }))}
              completedHabitIds={completedHabitIds}
              loading={habitsLoading}
              error={habitsError}
              onToggleHabit={toggleHabitToday}
            />

            {/* Archive Link */}
            <View className="mt-8">
              <Pressable
                onPress={() => {
                  navigation.navigate('ArchivedTasks');
                }}
                className="flex-row items-center justify-center py-4 px-6 rounded-2xl border border-gray-200 bg-gray-50"
              >
                <Text className="text-sm font-bold uppercase tracking-widest text-gray-600">
                  View Archive
                </Text>
              </Pressable>
            </View>
        </Animated.View>

        <Animated.View
          pointerEvents={notesFocused ? 'auto' : 'none'}
          style={[
            { opacity: notesOpacity, transform: [{ translateY: notesTranslate }] },
            !notesFocused && { height: 0, overflow: 'hidden' }
          ]}
        >
          <View className="mt-8">
            <View className="mb-4">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-xs font-black uppercase tracking-widest text-gray-400">Notes Today</Text>
                <Text className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                  {sortedTodayNotes.length} notes
                </Text>
              </View>
            </View>

            <View className="mt-4">
              {authLoading || notesLoading ? (
                <Text className="p-4 text-sm text-gray-400">Loading notes...</Text>
              ) : !user ? (
                <Text className="p-4 text-sm text-gray-400">Sign in to view notes.</Text>
              ) : notesError ? (
                <Text className="p-4 text-sm text-rose-500">{notesError}</Text>
              ) : sortedTodayNotes.length === 0 ? null : (
                <View className="gap-3">
                  {sortedTodayNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      title={note.title ?? 'Untitled Note'}
                      icon={note.icon ?? 'N'}
                      timestamp={formatTimestamp(note.created_at)}
                      content={note.content ?? ''}
                      isPinned={note.is_pinned === true}
                      onSelect={() => {}}
                    />
                  ))}
                </View>
              )}
            </View>

            <View className="mt-4">
              <TaskNoteComposer
                isAdding={isAddingNote}
                title={noteTitle}
                body={noteBody}
                category={noteCategory}
                categories={NOTE_CATEGORIES}
                isSaving={noteSaving}
                disabled={!user}
                onStart={() => {
                  setNoteSaveError(null);
                  setIsAddingNote(true);
                }}
                onCancel={resetNoteComposer}
                onSave={handleAddNote}
                onTitleChange={(value) => setNoteTitle(sanitizeText(value))}
                onBodyChange={(value) => setNoteBody(sanitizeText(value))}
                onCategoryChange={setNoteCategory}
              />

              {noteSaveError ? (
                <Text className="mt-2 text-xs font-semibold text-rose-500">{noteSaveError}</Text>
              ) : null}
            </View>

            <View className="mt-12">
              <View className="flex-row items-center justify-between px-1 mb-4 flex-wrap">
                <Text className="text-xs font-black uppercase tracking-widest text-gray-400">Past Notes & Brainstorms</Text>
                <NoteFilters filters={NOTE_FILTERS} activeFilter={noteFilter} onChange={(value) => setNoteFilter(value as NoteFilter)} />
              </View>
              <View className="mb-4">
                <TaskSearchBar value={notesSearchQuery} onChange={setNotesSearchQuery} />
              </View>

              <View>
                {authLoading || notesLoading ? (
                  <Text className="p-5 text-sm text-gray-400">Loading notes...</Text>
                ) : !user ? (
                  <Text className="p-5 text-sm text-gray-400">Sign in to view notes.</Text>
                ) : notesError ? (
                  <Text className="p-5 text-sm text-rose-500">{notesError}</Text>
                ) : sortedPastNotes.length === 0 ? (
                  <Text className="p-5 text-sm text-gray-400">
                    {normalizedNotesSearch ? 'No notes match your search.' : 'No notes yet.'}
                  </Text>
                ) : (
                  <View className="gap-3">
                    {sortedPastNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        title={note.title ?? 'Untitled Note'}
                        icon={note.icon ?? 'N'}
                        timestamp={formatTimestamp(note.created_at)}
                        content={note.content ?? ''}
                        isPinned={note.is_pinned === true}
                        onSelect={() => {}}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

export default TasksView;
