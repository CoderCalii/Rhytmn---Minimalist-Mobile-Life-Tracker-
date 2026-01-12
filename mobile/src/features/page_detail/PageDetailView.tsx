import { Pressable, ScrollView, Text, View } from 'react-native';
import { CheckCircle2, ChevronLeft, Circle } from 'lucide-react-native';
import { INITIAL_PAGES } from '../../mockData';
import type { Page } from '../../types';
import { getTodoCompleted } from '../../utils/todo';

interface PageDetailViewProps {
  page: Page;
  onBack: () => void;
  onToggleTodo: (pageId: string, blockId: string) => void;
}

const PageDetailView = ({ page = INITIAL_PAGES[0], onBack, onToggleTodo }: PageDetailViewProps) => (
  <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
    <View className="p-4 flex-row items-center">
      <Pressable onPress={onBack} className="p-2 rounded-full">
        <ChevronLeft size={20} color="#0f172a" />
      </Pressable>
    </View>
    <View className="px-6">
      <Text className="text-5xl mb-6">{page.icon}</Text>
      <Text className="text-3xl font-bold mb-8 leading-tight">{page.title}</Text>
      <View>
        {page.blocks.map((block) => {
          if (block.type === 'heading') {
            return (
              <Text key={block.id} className="text-xl font-bold mt-4 mb-2">
                {block.content}
              </Text>
            );
          }
          if (block.type === 'todo') {
            const completed = getTodoCompleted(block.content);
            return (
              <Pressable
                key={block.id}
                onPress={() => onToggleTodo(page.id, block.id)}
                className="flex-row items-center py-3 border-b border-gray-50"
              >
                <View className="mr-4">
                  {completed ? (
                    <CheckCircle2 size={24} color="#22c55e" />
                  ) : (
                    <Circle size={24} color="#d1d5db" />
                  )}
                </View>
                <Text className={completed ? 'text-gray-300 line-through text-lg' : 'text-gray-800 text-lg'}>
                  {block.content.text}
                </Text>
              </Pressable>
            );
          }
          if (block.type === 'text') {
            return (
              <Text key={block.id} className="text-lg text-gray-800 leading-relaxed">
                {block.content}
              </Text>
            );
          }
          return null;
        })}
      </View>
    </View>
  </ScrollView>
);

export default PageDetailView;
