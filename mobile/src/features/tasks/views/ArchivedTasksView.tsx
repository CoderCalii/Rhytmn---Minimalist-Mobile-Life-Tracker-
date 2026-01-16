import { ScrollView, Text, View } from 'react-native';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks, type TaskRow } from '../../../store/tasksProvider';
import { getScrollPaddingBottom } from '../../../components/layout/layoutConstants';
import { SwipeableTaskRow } from '../components/tasks/SwipeableTaskRow';

type ArchiveBucketKey = 'today' | 'yesterday' | 'earlier';

interface ArchivedTaskRow extends TaskRow {
  archived_at: string;
}

const groupKeyFor = (archivedAt: string): ArchiveBucketKey => {
  const date = parseISO(archivedAt);
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  return 'earlier';
};

const labelForKey = (key: ArchiveBucketKey): string => {
  if (key === 'today') return 'Today';
  if (key === 'yesterday') return 'Yesterday';
  return 'Earlier';
};

const ArchivedTasksView = () => {
  const { archivedTasks, loading, error, restoreTask } = useTasks();
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = getScrollPaddingBottom(insets);

  const tasks = archivedTasks as ArchivedTaskRow[];

  const buckets: Record<ArchiveBucketKey, ArchivedTaskRow[]> = {
    today: [],
    yesterday: [],
    earlier: []
  };

  tasks.forEach((task) => {
    if (!task.archived_at) return;
    const key = groupKeyFor(task.archived_at);
    buckets[key].push(task);
  });

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return format(parsed, 'MMM d, yyyy');
  };

  const renderBucket = (key: ArchiveBucketKey) => {
    const list = buckets[key];
    if (list.length === 0) return null;

    return (
      <View key={key} className="mb-8">
        <Text className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          {labelForKey(key)}
        </Text>
        <View className="gap-3">
          {list.map((task) => (
            <SwipeableTaskRow
              key={task.id}
              onArchive={() => {
                restoreTask(task.id);
              }}
            >
              <View
                className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <Text className="font-semibold text-gray-800 mb-1">{task.title}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {task.due_date ? (
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Due {formatDate(task.due_date)}
                    </Text>
                  ) : null}
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Created {formatDate(task.created_at)}
                  </Text>
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Archived {formatDate(task.archived_at)}
                  </Text>
                  <Text
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      task.completed ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {task.completed ? 'Completed' : 'Open'}
                  </Text>
                </View>
              </View>
            </SwipeableTaskRow>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: scrollPaddingBottom, paddingHorizontal: 24, paddingTop: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-6">
        <Text className="text-2xl font-black text-gray-900 tracking-tight">
          Archive
        </Text>
        <Text className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-1">
          Swiped away, not forgotten
        </Text>
      </View>

      {loading ? (
        <Text className="text-sm text-gray-400">Loading archived tasks...</Text>
      ) : error ? (
        <Text className="text-sm text-rose-500">{error}</Text>
      ) : tasks.length === 0 ? (
        <Text className="text-sm text-gray-400">No archived tasks yet.</Text>
      ) : (
        <View>
          {renderBucket('today')}
          {renderBucket('yesterday')}
          {renderBucket('earlier')}
        </View>
      )}
    </ScrollView>
  );
};

export default ArchivedTasksView;


