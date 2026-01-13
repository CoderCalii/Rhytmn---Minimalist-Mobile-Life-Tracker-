import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { TransactionType } from './TransactionTypeSelector';

interface ConfirmButtonProps {
  type: TransactionType;
  isSaving: boolean;
  isDisabled: boolean;
  onPress: () => void;
  error?: string | null;
  toast?: { type: 'success' | 'error'; message: string } | null;
}

export const ConfirmButton = ({ type, isSaving, isDisabled, onPress, error, toast }: ConfirmButtonProps) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'income':
        return 'bg-emerald-500';
      case 'expense':
        return 'bg-black';
      case 'transfer':
        return 'bg-blue-600';
      case 'goal':
        return 'bg-purple-600';
      default:
        return 'bg-black';
    }
  };

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={`w-full py-5 rounded-[2rem] shadow-xl ${getBackgroundColor()} ${isDisabled ? 'opacity-60' : ''}`}
      >
        {isSaving ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator color="#ffffff" size="small" />
            <Text className="ml-2 font-black text-base text-white">Saving...</Text>
          </View>
        ) : (
          <Text className="text-center font-black text-base text-white">Confirm Entry</Text>
        )}
      </Pressable>
      {error && <Text className="mt-3 text-xs font-semibold text-rose-500 text-center">{error}</Text>}
      {toast && (
        <View
          className={`mt-3 rounded-2xl px-4 py-2 ${
            toast.type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'
          }`}
        >
          <Text className={`text-center text-xs font-semibold ${toast.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
            {toast.message}
          </Text>
        </View>
      )}
    </>
  );
};

