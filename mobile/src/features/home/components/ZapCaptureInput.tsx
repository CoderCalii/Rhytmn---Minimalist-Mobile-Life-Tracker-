import { Pressable, TextInput, View } from 'react-native';
import { Plus, Zap } from 'lucide-react-native';

interface ZapCaptureInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const ZapCaptureInput = ({ value, onChange, onSubmit }: ZapCaptureInputProps) => {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
      <Zap size={16} color="#6b7280" />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder="Zap Capture"
        className="flex-1 bg-transparent text-sm font-medium text-gray-900"
        placeholderTextColor="#9ca3af"
        returnKeyType="done"
      />
      <Pressable
        onPress={onSubmit}
        className="rounded-full bg-black p-2"
        accessibilityLabel="Add capture"
      >
        <Plus size={14} color="#ffffff" />
      </Pressable>
    </View>
  );
};

export default ZapCaptureInput;
