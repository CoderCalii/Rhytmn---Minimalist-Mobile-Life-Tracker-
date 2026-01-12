import { Modal, Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

type InfoModalState = {
  title: string;
  description: string;
};

type InfoModalProps = {
  isOpen: boolean;
  info: InfoModalState | null;
  onClose: () => void;
};

const InfoModal = ({ isOpen, info, onClose }: InfoModalProps) => {
  if (!isOpen || !info) return null;

  return (
    <Modal transparent visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-end px-4 pb-10">
        <BlurView intensity={45} tint="dark" className="absolute inset-0" pointerEvents="none" />
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
        <View className="w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-black">{info.title}</Text>
            <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-gray-50 items-center justify-center">
              <Text className="text-gray-400">X</Text>
            </Pressable>
          </View>
          <Text className="text-sm text-slate-500">{info.description}</Text>
          <Pressable onPress={onClose} className="mt-6 w-full rounded-2xl bg-black py-3">
            <Text className="text-center text-xs font-bold uppercase tracking-widest text-white">Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default InfoModal;
