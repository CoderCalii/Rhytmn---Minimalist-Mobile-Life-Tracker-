import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { FinanceAccount } from '../../../../types';

interface AccountSelectorProps {
  accounts: FinanceAccount[];
  selectedAccountId: string | null;
  onAccountSelect: (accountId: string) => void;
  loading: boolean;
  formatMoney: (value: number) => string;
  disabledAccountId?: string | null;
  showBalance?: boolean;
  showProjectedBalance?: boolean;
  projectedBalance?: number;
  isOverdraft?: boolean;
}

export const AccountSelector = ({
  accounts,
  selectedAccountId,
  onAccountSelect,
  loading,
  formatMoney,
  disabledAccountId,
  showBalance = false,
  showProjectedBalance = false,
  projectedBalance,
  isOverdraft = false
}: AccountSelectorProps) => {
  useEffect(() => {
    console.log('[AccountSelector] Mounted/Rendered', {
      accountsCount: accounts.length,
      selectedAccountId,
      loading,
      showBalance,
      showProjectedBalance
    });
  });

  if (loading) {
    return <Text className="text-[10px] font-bold text-slate-400">Loading accounts...</Text>;
  }

  if (accounts.length === 0) {
    return <Text className="text-[10px] font-bold text-slate-400">No accounts found.</Text>;
  }

  const handleAccountSelect = (accountId: string) => {
    console.log('[AccountSelector] Account selected:', accountId);
    try {
      onAccountSelect(accountId);
      console.log('[AccountSelector] onAccountSelect called successfully');
    } catch (error) {
      console.error('[AccountSelector] Error in onAccountSelect:', error);
      console.error('[AccountSelector] Error stack:', error instanceof Error ? error.stack : 'No stack');
    }
  };

  return (
    <View className="flex-row flex-wrap">
      {accounts.map((account) => {
        const isSelected = selectedAccountId === account.id;
        const isDisabled = disabledAccountId === account.id;

        return (
          <Pressable
            key={account.id}
            onPress={() => handleAccountSelect(account.id)}
            disabled={isDisabled}
            className={`px-4 py-2 rounded-2xl mb-2 mr-2 ${
              isSelected ? 'bg-black' : 'bg-slate-50'
            } ${isDisabled ? 'opacity-40' : ''}`}
          >
            <Text className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
              {account.name} - {account.lastFour}
            </Text>
            {isSelected && showBalance && (
              <Text className={`mt-1 text-[9px] font-semibold ${isOverdraft ? 'text-rose-500' : 'text-slate-300'}`}>
                Current: {formatMoney(account.balance)}
              </Text>
            )}
            {isSelected && showProjectedBalance && projectedBalance !== undefined && (
              <Text className="mt-1 text-[9px] font-semibold text-blue-200">
                After: {formatMoney(projectedBalance)}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};
