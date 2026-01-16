import { Pressable, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import type { FinanceAccount } from '../../../../types';
import { AccountCard } from '../AccountCard';

type AccountStackProps = {
  isSignedIn: boolean;
  authLoading: boolean;
  accountsLoading: boolean;
  accountsError: string | null;
  accounts: FinanceAccount[];
  activeAccountIndex: number;
  currencyCode: 'USD' | 'PHP';
  onCycleAccount: () => void;
  onAddAccount: () => void;
  onEditAccount: (account: FinanceAccount) => void;
};

const AccountStack = ({
  isSignedIn,
  authLoading,
  accountsLoading,
  accountsError,
  accounts,
  activeAccountIndex,
  currencyCode,
  onCycleAccount,
  onAddAccount,
  onEditAccount
}: AccountStackProps) => {
  const getCardStyle = (index: number) => {
    const diff = (index - activeAccountIndex + accounts.length) % accounts.length;
    if (diff === 0) return { transform: [{ translateY: 0 }, { scale: 1 }], zIndex: 30, opacity: 1 };
    if (diff === 1) return { transform: [{ translateY: 16 }, { scale: 0.95 }], zIndex: 20, opacity: 0.6 };
    return { transform: [{ translateY: 32 }, { scale: 0.9 }], zIndex: 10, opacity: 0.3 };
  };

  return (
    <>
      <Pressable className="relative h-60 mb-4" onPress={onCycleAccount}>
        {authLoading || accountsLoading ? (
          <View className="absolute inset-0 rounded-[2.5rem] bg-gray-50" />
        ) : !isSignedIn ? (
          <View className="absolute inset-0 rounded-[2.5rem] bg-gray-50 items-center justify-center">
            <Text className="text-sm text-gray-400">Sign in to view accounts.</Text>
          </View>
        ) : accountsError ? (
          <View className="absolute inset-0 rounded-[2.5rem] bg-rose-50 items-center justify-center">
            <Text className="text-sm text-rose-500">{accountsError}</Text>
          </View>
        ) : accounts.length === 0 ? (
          <Pressable
            onPress={() => onAddAccount()}
            className="absolute inset-0 rounded-[2.5rem] border-2 border-dashed border-gray-200 items-center justify-center"
          >
            <View className="w-12 h-12 rounded-full border border-dashed border-gray-300 items-center justify-center">
              <Plus size={20} color="#9ca3af" />
            </View>
            <Text className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Add Account
            </Text>
          </Pressable>
        ) : (
          accounts.map((account, index) => (
            <AccountCard
              key={account.id}
              account={account}
              style={getCardStyle(index)}
              isActive={index === activeAccountIndex}
              onEdit={onEditAccount}
              currencyCode={currencyCode}
            />
          ))
        )}
      </Pressable>

      {isSignedIn && accounts.length > 0 ? (
        <View className="flex-row justify-end">
          <Pressable onPress={onAddAccount}>
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-500">Add Account</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
};

export default AccountStack;
