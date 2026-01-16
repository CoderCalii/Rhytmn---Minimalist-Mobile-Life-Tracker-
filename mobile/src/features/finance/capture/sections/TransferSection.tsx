import { StyleSheet, Text, View } from 'react-native';
import { AccountSelector } from '../components/AccountSelector';
import type { FinanceAccount } from '../../../types';

interface TransferSectionProps {
  accounts: FinanceAccount[];
  selectedAccountId: string | null;
  selectedDestinationAccountId: string | null;
  onAccountSelect: (accountId: string) => void;
  onDestinationAccountSelect: (accountId: string) => void;
  loading: boolean;
  formatMoney: (value: number) => string;
  transferAmount: number;
}

export const TransferSection = ({
  accounts,
  selectedAccountId,
  selectedDestinationAccountId,
  onAccountSelect,
  onDestinationAccountSelect,
  loading,
  formatMoney,
  transferAmount
}: TransferSectionProps) => {
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>From account</Text>
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onAccountSelect={onAccountSelect}
          loading={loading}
          formatMoney={formatMoney}
          disabledAccountId={selectedDestinationAccountId}
          showBalance
          isOverdraft={selectedAccountId ? (accounts.find(a => a.id === selectedAccountId)?.balance ?? 0) < transferAmount : false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>To account</Text>
        {accounts.length < 2 ? (
          <Text style={styles.emptyText}>Add another account to transfer.</Text>
        ) : (
          <AccountSelector
            accounts={accounts}
            selectedAccountId={selectedDestinationAccountId}
            onAccountSelect={onDestinationAccountSelect}
            loading={loading}
            formatMoney={formatMoney}
            disabledAccountId={selectedAccountId}
            showProjectedBalance
            projectedBalance={selectedDestinationAccountId ? accounts.find(a => a.id === selectedDestinationAccountId)?.balance ? (accounts.find(a => a.id === selectedDestinationAccountId)!.balance + transferAmount) : undefined : undefined}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#cbd5e1',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  emptyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
});

