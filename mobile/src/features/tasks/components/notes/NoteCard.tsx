import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Clock, Pin } from 'lucide-react-native';

interface NoteCardProps {
  title: string;
  icon: ReactNode;
  timestamp: string;
  content: string;
  isPinned: boolean;
  onSelect: () => void;
}

export function NoteCard({ title, icon, timestamp, content, isPinned, onSelect }: NoteCardProps) {
  return (
    <Pressable onPress={onSelect} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center">
          {typeof icon === 'string' ? <Text className="text-xl">{icon}</Text> : icon}
          <Text className="ml-2 font-bold text-gray-800">{title}</Text>
          {isPinned ? (
            <View className="ml-2">
              <Pin size={12} color="#9ca3af" />
            </View>
          ) : null}
        </View>
        {timestamp ? (
          <View className="flex-row items-center">
            <Clock size={10} color="#9ca3af" />
            <Text className="ml-1 text-[10px] text-gray-400 font-medium">{timestamp}</Text>
          </View>
        ) : null}
      </View>
      {content ? (
        <Text className="text-sm text-gray-500" numberOfLines={2}>
          {content}
        </Text>
      ) : null}
    </Pressable>
  );
}
