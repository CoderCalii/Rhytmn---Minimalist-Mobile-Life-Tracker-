import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
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
    <View className="mb-8 p-1 bg-slate-100 rounded-[2rem] flex-row items-center">
      {transactionTypes.map((t) => {
        const active = type === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => handlePress(t.id)}
            className={`flex-1 py-3.5 rounded-[1.7rem] flex-row items-center justify-center ${active ? 'bg-white shadow-sm' : ''}`}
          >
            <View className="flex-row items-center">
              <View className="mr-2">
                {t.icon}
              </View>
              <Text className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-black' : 'text-slate-400'}`}>
                {t.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

export { transactionTypes };
export type { TransactionType };
