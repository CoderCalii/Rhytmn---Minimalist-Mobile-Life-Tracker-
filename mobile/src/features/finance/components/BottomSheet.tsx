import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

type BottomSheetProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const BottomSheet = ({ isOpen, title, onClose, children }: BottomSheetProps) => {
  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-end px-4 pb-10">
        <BlurView intensity={45} tint="dark" className="absolute inset-0" pointerEvents="none" />
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="w-full max-w-sm rounded-[3rem] bg-white p-7 shadow-2xl">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-black">{title}</Text>
            <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-gray-50 items-center justify-center">
              <X size={16} color="#9ca3af" />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default BottomSheet;
