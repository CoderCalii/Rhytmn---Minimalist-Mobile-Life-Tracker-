import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
        return '#10b981';
      case 'expense':
        return '#000000';
      case 'transfer':
        return '#2563eb';
      case 'goal':
        return '#9333ea';
      default:
        return '#000000';
    }
  };

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.button,
          { backgroundColor: getBackgroundColor() },
          isDisabled && styles.buttonDisabled,
        ]}
      >
        {isSaving ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#ffffff" size="small" />
            <Text style={styles.buttonText}>Saving...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Confirm Entry</Text>
        )}
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {toast && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={[styles.toastText, toast.type === 'success' ? styles.toastTextSuccess : styles.toastTextError]}>
            {toast.message}
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 25,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: 8,
    fontWeight: '900',
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#f43f5e',
    textAlign: 'center',
  },
  toast: {
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toastSuccess: {
    backgroundColor: '#ecfdf5',
  },
  toastError: {
    backgroundColor: '#fef2f2',
  },
  toastText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  toastTextSuccess: {
    color: '#047857',
  },
  toastTextError: {
    color: '#dc2626',
  },
});


