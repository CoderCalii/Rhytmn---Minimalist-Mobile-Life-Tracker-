import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { ArrowRight, Clock, X } from 'lucide-react-native';
import { sanitizeText } from '../../utils/sanitize';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface HabitCaptureModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

const HabitCaptureModal = ({ onClose, onSaved }: HabitCaptureModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Daily');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = !name || isSaving || !user;

  const handleSave = async () => {
    if (!user) {
      setError('Sign in to create a habit.');
      return;
    }
    const safeName = sanitizeText(name).trim();
    if (!safeName) return;
    const safeGoal = sanitizeText(goal).trim();

    setIsSaving(true);
    setError(null);

    const { error: insertError } = await supabase
      .from('habits')
      .insert({ user_id: user.id, title: safeName, frequency: safeGoal });

    if (insertError) {
      setIsSaving(false);
      setError('Failed to save habit.');
      return;
    }

    setIsSaving(false);
    onSaved?.();
    onClose();
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="p-6 flex-row items-center justify-between">
          <Pressable
            onPress={onClose}
            className="p-2 items-center justify-center rounded-full"
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#f3f4f6' : 'transparent'
            })}
          >
            <X size={20} color="#6b7280" />
          </Pressable>
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Rhythm</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 px-8 pt-8">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            What do you want to build?
          </Text>
          <TextInput
            autoFocus
            placeholder="Exercise, Meditation, etc."
            value={name}
            onChangeText={(value) => setName(sanitizeText(value))}
            className="w-full text-4xl font-bold text-gray-900 border-b-2 border-gray-100 pb-4"
            placeholderTextColor="#f3f4f6"
          />

          <View className="mt-12">
            <View className="flex-row items-center gap-4">
              <Clock size={20} color="#9ca3af" />
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Frequency</Text>
                <View className="flex-row flex-wrap">
                  {['Daily', '3x Week', 'Weekly'].map((frequency) => {
                    const active = goal === frequency;
                    return (
                      <Pressable
                        key={frequency}
                        onPress={() => setGoal(frequency)}
                        className={`px-4 py-2 rounded-full text-xs font-bold mr-2 mb-2 ${active ? 'bg-black' : 'bg-gray-50'}`}
                      >
                        <Text className={active ? 'text-white' : 'text-gray-400'}>{frequency}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="p-8">
          <Pressable
            onPress={handleSave}
            disabled={isDisabled}
            className="w-full bg-black py-5 rounded-[24px] shadow-xl"
            style={({ pressed }) => ({
              opacity: isDisabled ? 0.2 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }]
            })}
          >
            <View className="flex-row items-center justify-center gap-3">
              <Text className="text-lg font-bold text-white">
                {isSaving ? 'Saving...' : 'Create Habit'}
              </Text>
              <ArrowRight size={20} color="#ffffff" />
            </View>
          </Pressable>
          {error && <Text className="mt-3 text-xs font-semibold text-rose-500 text-center">{error}</Text>}
        </View>
      </View>
    </Modal>
  );
};

export default HabitCaptureModal;
