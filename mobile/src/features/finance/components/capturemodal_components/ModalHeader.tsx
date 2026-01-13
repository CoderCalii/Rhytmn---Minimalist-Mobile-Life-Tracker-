import { Text, View, Pressable } from 'react-native';
import { Calendar, X } from 'lucide-react-native';

interface ModalHeaderProps {
  date: Date;
  onClose: () => void;
}

export const ModalHeader = ({ date, onClose }: ModalHeaderProps) => {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <View className="flex-row items-center px-3 py-1 bg-slate-50 rounded-full">
        <View className="mr-2">
          <Calendar size={12} color="#94a3b8" />
        </View>
        <Text className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })},{' '}
          {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
      <Pressable onPress={onClose} className="p-2.5 bg-slate-50 rounded-full">
        <X size={18} color="#94a3b8" />
      </Pressable>
    </View>
  );
};

