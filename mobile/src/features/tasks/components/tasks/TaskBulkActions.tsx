import { Pressable, Text, View } from 'react-native';
import { Archive, CheckCircle2, X } from 'lucide-react-native';

interface TaskBulkActionsProps {
  selectedCount: number;
  onComplete: () => void;
  onArchive: () => void;
  onExit: () => void;
}

export function TaskBulkActions({ selectedCount, onComplete, onArchive, onExit }: TaskBulkActionsProps) {
  return (
    <View className="flex-row items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
      <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">
        {selectedCount} selected
      </Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onComplete}
          className="flex-row items-center gap-1 px-3 py-2 rounded-full bg-white border border-gray-100"
        >
          <CheckCircle2 size={12} color="#4b5563" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Complete</Text>
        </Pressable>
        <Pressable
          onPress={onArchive}
          className="flex-row items-center gap-1 px-3 py-2 rounded-full bg-white border border-gray-100"
        >
          <Archive size={12} color="#4b5563" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Archive</Text>
        </Pressable>
        <Pressable onPress={onExit} className="p-2 rounded-full bg-white border border-gray-100">
          <X size={14} color="#6b7280" />
        </Pressable>
      </View>
    </View>
  );
}
