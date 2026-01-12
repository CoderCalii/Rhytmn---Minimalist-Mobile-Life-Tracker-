import { TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';

interface TaskSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function TaskSearchBar({ value, onChange }: TaskSearchBarProps) {
  return (
    <View className="flex-row items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
      <Search size={18} color="#9ca3af" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search tasks and notes"
        placeholderTextColor="#9ca3af"
        className="flex-1 text-xs font-semibold tracking-wide text-gray-600"
      />
    </View>
  );
}
