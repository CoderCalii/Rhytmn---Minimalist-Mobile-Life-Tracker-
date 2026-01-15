import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Target
} from 'lucide-react-native';

type TransactionType = 'income' | 'expense' | 'goal' | 'transfer';

interface TransactionTypeSelectorProps {
  type: TransactionType;
  onTypeChange: (type: TransactionType) => void;
}

const transactionTypes: Array<{
  id: TransactionType;
  label: string;
  icon: ReactNode;
  accent: string;
}> = [
  { id: 'income', label: 'Income', icon: <ArrowDownLeft size={14} color="#10b981" />, accent: '#10b981' },
  { id: 'expense', label: 'Expense', icon: <ArrowUpRight size={14} color="#f43f5e" />, accent: '#f43f5e' },
  { id: 'transfer', label: 'Transfer', icon: <ArrowLeftRight size={14} color="#2563eb" />, accent: '#2563eb' },
  { id: 'goal', label: 'Goal', icon: <Target size={14} color="#7c3aed" />, accent: '#7c3aed' }
];

export const TransactionTypeSelector = ({ type, onTypeChange }: TransactionTypeSelectorProps) => {
  useEffect(() => {
    console.log('[TransactionTypeSelector] Mounted with type:', type);
    return () => {
      console.log('[TransactionTypeSelector] Unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('[TransactionTypeSelector] Type changed to:', type);
  }, [type]);

  const handlePress = (newType: TransactionType) => {
    console.log('[TransactionTypeSelector] Pressed:', newType, 'from', type);
    try {
      onTypeChange(newType);
      console.log('[TransactionTypeSelector] onTypeChange called successfully');
    } catch (error) {
      console.error('[TransactionTypeSelector] Error in onTypeChange:', error);
      console.error('[TransactionTypeSelector] Error stack:', error instanceof Error ? error.stack : 'No stack');
    }
  };

  return (
    <View style={styles.container}>
      {transactionTypes.map((t) => {
        const active = type === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => handlePress(t.id)}
            style={[styles.button, active && styles.buttonActive]}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                {t.icon}
              </View>
              <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
                {t.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    padding: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    color: '#94a3b8',
  },
  buttonTextActive: {
    color: '#000000',
  },
});

export { transactionTypes };
export type { TransactionType };
