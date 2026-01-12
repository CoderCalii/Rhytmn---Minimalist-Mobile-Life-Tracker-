import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';

type GoalFormState = {
  name: string;
  target: string;
  current: string;
  color: string;
};

type GoalModalProps = {
  isOpen: boolean;
  goalForm: GoalFormState;
  goalColors: string[];
  goalSaveError: string | null;
  goalSaving: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onCurrentChange: (value: string) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
};

const GoalModal = ({
  isOpen,
  goalForm,
  goalColors,
  goalSaveError,
  goalSaving,
  onClose,
  onNameChange,
  onTargetChange,
  onCurrentChange,
  onColorChange,
  onSave
}: GoalModalProps) => {
  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-end px-4 pb-10">
        <BlurView intensity={45} tint="dark" className="absolute inset-0" pointerEvents="none" />
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-black">New Goal</Text>
            <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-gray-50 items-center justify-center">
              <Text className="text-gray-400">X</Text>
            </Pressable>
          </View>
          <View>
            <TextInput
              placeholder="Goal name"
              value={goalForm.name}
              onChangeText={onNameChange}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold"
            />
            <TextInput
              placeholder="Target amount"
              value={goalForm.target}
              onChangeText={onTargetChange}
              keyboardType="numeric"
              className="mt-3 w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold"
            />
            <TextInput
              placeholder="Current amount (optional)"
              value={goalForm.current}
              onChangeText={onCurrentChange}
              keyboardType="numeric"
              className="mt-3 w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold"
            />
            <View className="flex-row flex-wrap mt-4">
              {goalColors.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => onColorChange(color)}
                  className={`h-8 w-8 rounded-full mr-2 mb-2 ${color} ${goalForm.color === color ? 'ring-2 ring-black' : ''}`}
                />
              ))}
            </View>
            {goalSaveError ? (
              <Text className="text-xs font-semibold text-rose-500">{goalSaveError}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={onSave}
            disabled={goalSaving}
            className="mt-6 w-full rounded-2xl bg-black py-3"
          >
            <Text className="text-center text-xs font-bold uppercase tracking-widest text-white">
              {goalSaving ? 'Saving...' : 'Create Goal'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default GoalModal;
