import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, Text, View } from 'react-native';
import { Pencil, Wallet } from 'lucide-react-native';
import type { FinanceAccount } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

type AccountCardProps = {
  account: FinanceAccount;
  textClassName: string;
  style?: StyleProp<ViewStyle>;
  isActive?: boolean;
  onEdit?: (account: FinanceAccount) => void;
  currencyCode?: 'USD' | 'PHP';
};

export function AccountCard({
  account,
  textClassName,
  style,
  isActive = false,
  onEdit,
  currencyCode = 'USD'
}: AccountCardProps) {
  return (
    <View
      style={style}
      className={`absolute inset-0 p-8 rounded-[2.5rem] shadow-2xl ${account.color} ${textClassName} flex-col justify-between`}
    >
      <View className="flex-row justify-between items-start">
        <View>
          <Text className="text-[10px] opacity-60 font-black uppercase tracking-[0.2em]">{account.name}</Text>
          <Text className="text-3xl font-black mt-2 tracking-tighter">
            {formatCurrency(account.balance, currencyCode)}
          </Text>
        </View>
        <View className="flex-row items-center">
          {onEdit && isActive ? (
            <Pressable
              onPress={() => onEdit(account)}
              className="p-2 bg-white/10 rounded-2xl border border-white/10 mr-2"
            >
              <Pencil size={16} color="#ffffff" />
            </Pressable>
          ) : null}
          <View className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <Wallet size={20} color="#ffffff" />
          </View>
        </View>
      </View>
      <View className="flex-row justify-between items-end">
        <Text className="font-mono tracking-[0.3em] text-[10px] opacity-50 underline">**** {account.lastFour}</Text>
        <View className="h-8 w-12 bg-white/10 rounded-lg border border-white/20" />
      </View>
    </View>
  );
}
