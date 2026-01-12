import { Pressable, Text, View } from 'react-native';
import type { Page } from '../../../types';

interface QueueListProps {
  pages: Page[];
  onSelectPage: (pageId: string) => void;
}

const QueueList = ({ pages, onSelectPage }: QueueListProps) => {
  const queuePages = pages.filter((page) => page.id !== 'daily');

  return (
    <View>
      <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Queue</Text>
      <View>
        {queuePages.length === 0 ? (
          <Text className="p-5 text-sm text-gray-400">No pages in the queue yet.</Text>
        ) : (
          queuePages.map((page) => (
            <Pressable
              key={page.id}
              onPress={() => onSelectPage(page.id)}
              className="w-full flex-row items-center p-4 rounded-xl border border-transparent bg-white/50"
            >
              <View className="mr-4 items-center justify-center">
                {typeof page.icon === 'string' ? (
                  <Text className="text-2xl">{page.icon}</Text>
                ) : (
                  page.icon
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  {page.category === 'unprocessed' && (
                    <View className="h-2 w-2 rounded-full bg-yellow-400 mr-2" />
                  )}
                  <Text className="font-semibold text-black text-[15px]">{page.title}</Text>
                </View>
                <Text className="text-xs text-gray-400 mt-0.5">
                  {page.blocks.length} blocks | {page.category || 'General'} | {page.updatedAt}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
};

export default QueueList;
