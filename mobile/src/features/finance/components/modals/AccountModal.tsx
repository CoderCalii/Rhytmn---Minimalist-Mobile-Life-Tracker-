import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Check } from 'lucide-react-native';
import type { FinanceAccount } from '../../../../types';
import { ACCOUNT_COLORS, type AccountColorId, getAccountColorHex } from '../../utils/financeUi';

type AccountFormState = {
  name: string;
  balance: string;
  color: AccountColorId;
  lastFour: string;
};

type AccountModalProps = {
  isOpen: boolean;
  editingAccount: FinanceAccount | null;
  accountForm: AccountFormState;
  accountSaveError: string | null;
  accountSaving: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onBalanceChange: (value: string) => void;
  onLastFourChange: (value: string) => void;
  onColorChange: (color: AccountColorId) => void;
  onSave: () => void;
  onDelete?: () => void;
};

const AccountModal = ({
  isOpen,
  editingAccount,
  accountForm,
  accountSaveError,
  accountSaving,
  onClose,
  onNameChange,
  onBalanceChange,
  onLastFourChange,
  onColorChange,
  onSave,
  onDelete
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
              <TextInput
                placeholder="Last 4 digits"
                value={accountForm.lastFour}
                onChangeText={onLastFourChange}
                keyboardType="number-pad"
                className="mt-3 w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold"
              />
            )}
            <View className="mt-4">
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Color</Text>
              <View style={styles.colorPickerContainer}>
                {ACCOUNT_COLORS.map((colorOption, index) => {
                  const isSelected = accountForm.color === colorOption.id;
                  const backgroundColor = getAccountColorHex(colorOption.id);
                  return (
                    <Pressable
                      key={colorOption.id}
                      onPress={() => onColorChange(colorOption.id)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor },
                        isSelected && styles.colorSwatchSelected,
                        index % 5 !== 0 && styles.colorSwatchMargin
                      ]}
                    >
                      {isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <View style={styles.checkmarkBackground}>
                            <Check size={16} color="#ffffff" strokeWidth={3} />
                          </View>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {accountSaveError ? (
              <Text className="mt-3 text-xs font-semibold text-rose-500">{accountSaveError}</Text>
            ) : null}
          </View>
          <View className="mt-6 gap-3">
            {editingAccount && onDelete ? (
              <Pressable
                onPress={onDelete}
                disabled={accountSaving}
                className="w-full rounded-2xl bg-rose-500 py-3"
              >
                <Text className="text-center text-xs font-bold uppercase tracking-widest text-white">
                  {accountSaving ? 'Deleting...' : 'Delete Account'}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onSave}
              disabled={accountSaving}
              className="w-full rounded-2xl bg-black py-3"
            >
              <Text className="text-center text-xs font-bold uppercase tracking-widest text-white">
                {accountSaving ? 'Saving...' : editingAccount ? 'Save Account' : 'Create Account'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    marginBottom: 12,
  },
  colorSwatchMargin: {
    marginLeft: 12,
  },
  colorSwatchSelected: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
    borderWidth: 2,
    borderColor: '#000000',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
});

export default AccountModal;
