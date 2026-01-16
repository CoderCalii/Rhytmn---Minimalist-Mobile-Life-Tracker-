import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Archive } from 'lucide-react-native';

interface SwipeableTaskRowProps {
  children: ReactNode;
  onArchive: () => void;
}

export function SwipeableTaskRow({ children, onArchive }: SwipeableTaskRowProps) {
  const renderRightActions = () => (
    <View className="flex-row items-center justify-end bg-amber-500/90 px-4 rounded-2xl h-full">
      <View className="flex-row items-center gap-2">
        <Archive size={18} color="#ffffff" />
        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
          Archive
        </Text>
      </View>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={onArchive}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}


