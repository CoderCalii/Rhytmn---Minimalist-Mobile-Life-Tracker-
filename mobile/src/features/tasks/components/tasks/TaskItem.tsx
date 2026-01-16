import { Pressable, Text, View } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';

interface TaskItemData {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string | null;
}

interface TaskItemProps {
  task: TaskItemData;
  timestampLabel: string;
  dueDateLabel: string;
  isSelected: boolean;
  isSelectMode: boolean;
  onToggleComplete: () => void;
  onToggleSelect: () => void;
  onLongPress: () => void;
}

export function TaskItem({
  task,
  timestampLabel,
  dueDateLabel,
  isSelected,
  isSelectMode,
  onToggleComplete,
  onToggleSelect,
  onLongPress
}: TaskItemProps) {
  const handlePress = () => {
    if (isSelectMode) {
      onToggleSelect();
      return;
    }
    onToggleComplete();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={450}
      className={`flex-row items-start p-5 rounded-2xl border shadow-sm ${
        isSelected ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
      }`}
    >
      <View className={`mt-1 mr-4 ${task.completed ? 'text-green-500' : 'text-gray-300'}`}>
        {task.completed ? <CheckCircle2 size={24} color="#22c55e" /> : <Circle size={24} color="#d1d5db" />}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className={`text-lg font-medium ${task.completed ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
            {task.title}
          </Text>
        </View>
        {dueDateLabel || timestampLabel ? (
          <View className="mt-2 flex-row flex-wrap items-center">
            {dueDateLabel ? (
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2">
                Due {dueDateLabel}
              </Text>
            ) : null}
            {timestampLabel ? (
              <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {timestampLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {isSelectMode ? (
        <View className={`ml-3 mt-2 h-5 w-5 rounded-full border ${isSelected ? 'bg-black border-black' : 'border-gray-300'}`} />
      ) : null}
    </Pressable>
  );
}
