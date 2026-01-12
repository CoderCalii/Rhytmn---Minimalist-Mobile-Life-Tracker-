import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import type { FinanceAccount } from '../../../../types';

type AccountFormState = {
  name: string;
  balance: string;
  color: string;
  lastFour: string;
};

type AccountModalProps = {
  isOpen: boolean;
  editingAccount: FinanceAccount | null;
  accountForm: AccountFormState;
  accountColors: string[];
  accountSaveError: string | null;
  accountSaving: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onBalanceChange: (value: string) => void;
  onLastFourChange: (value: string) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
};

const AccountModal = ({
  isOpen,
  editingAccount,
  accountForm,
  accountColors,
  accountSaveError,
  accountSaving,
  onClose,
  onNameChange,
  onBalanceChange,
  onLastFourChange,
  onColorChange,
  onSave
}: AccountModalProps) => {
  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-end px-4 pb-10">
        <BlurView intensity={45} tint="dark" className="absolute inset-0" pointerEvents="none" />
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-lg font-black">{editingAccount ? 'Rename Account' : 'New Account'}</Text>
            <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-gray-50 items-center justify-center">
              <Text className="text-gray-400">X</Text>
            </Pressable>
          </View>
          <View>
            <TextInput
              placeholder="Account name"
              value={accountForm.name}
              onChangeText={onNameChange}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold"
            />
            {!editingAccount ? (
              <TextInput
                placeholder="Starting balance"
                value={accountForm.balance}
                onChangeText={onBalanceChange}
                keyboardType="numeric"
                className="mt-3 w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold"
              />
            ) : null}
            {!editingAccount ? (
              <TextInput
                placeholder="Last 4 digits"
                value={accountForm.lastFour}
                onChangeText={onLastFourChange}
                keyboardType="number-pad"
                className="mt-3 w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold"
              />
            ) : (
              <Text className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Last four: {accountForm.lastFour}
              </Text>
            )}
            <View className="flex-row flex-wrap mt-4">
              {accountColors.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => onColorChange(color)}
                  className={`h-8 w-8 rounded-full mr-2 mb-2 ${color} ${accountForm.color === color ? 'ring-2 ring-black' : ''}`}
                />
              ))}
            </View>
            {accountSaveError ? (
              <Text className="text-xs font-semibold text-rose-500">{accountSaveError}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={onSave}
            disabled={accountSaving}
            className="mt-6 w-full rounded-2xl bg-black py-3"
          >
            <Text className="text-center text-xs font-bold uppercase tracking-widest text-white">
              {accountSaving ? 'Saving...' : editingAccount ? 'Save Account' : 'Create Account'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default AccountModal;
