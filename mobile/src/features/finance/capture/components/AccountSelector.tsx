import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  if (loading) {
    return <Text style={styles.emptyText}>Loading accounts...</Text>;
  }

  if (accounts.length === 0) {
    return <Text style={styles.emptyText}>No accounts found.</Text>;
  }

  return (
    <View style={styles.container}>
      {accounts.map((account) => {
        const isSelected = selectedAccountId === account.id;
        const isDisabled = disabledAccountId === account.id;

        return (
          <Pressable
            key={account.id}
            onPress={() => onAccountSelect(account.id)}
            disabled={isDisabled}
            style={[
              styles.accountButton,
              isSelected && styles.accountButtonSelected,
              isDisabled && styles.accountButtonDisabled,
            ]}
          >
            <Text style={[styles.accountText, isSelected && styles.accountTextSelected]}>
              {account.name} - {account.lastFour}
            </Text>
            {isSelected && showBalance && (
              <Text style={[styles.balanceText, isOverdraft && styles.balanceTextOverdraft]}>
                Current: {formatMoney(account.balance)}
              </Text>
            )}
            {isSelected && showProjectedBalance && projectedBalance !== undefined && (
              <Text style={styles.projectedBalanceText}>
                After: {formatMoney(projectedBalance)}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  accountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
    marginRight: 8,
    backgroundColor: '#f1f5f9',
  },
  accountButtonSelected: {
    backgroundColor: '#000000',
  },
  accountButtonDisabled: {
    opacity: 0.4,
  },
  accountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  accountTextSelected: {
    color: '#ffffff',
  },
  balanceText: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  balanceTextOverdraft: {
    color: '#f43f5e',
  },
  projectedBalanceText: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '600',
    color: '#bfdbfe',
  },
});

