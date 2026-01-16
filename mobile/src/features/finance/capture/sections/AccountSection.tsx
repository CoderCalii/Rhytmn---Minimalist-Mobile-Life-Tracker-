import { StyleSheet, Text, View } from 'react-native';
import { AccountSelector } from '../components/AccountSelector';
import type { FinanceAccount } from '../../../types';

interface AccountSectionProps {
  accounts: FinanceAccount[];
  selectedAccountId: string | null;
  onAccountSelect: (accountId: string) => void;
  loading: boolean;
  formatMoney: (value: number) => string;
  showBalance?: boolean;
  showProjectedBalance?: boolean;
  projectedBalance?: number;
  isOverdraft?: boolean;
  label?: string;
}

export const AccountSection = ({
  accounts,
  selectedAccountId,
  onAccountSelect,
  loading,
  formatMoney,
  showBalance = false,
  showProjectedBalance = false,
  projectedBalance,
  isOverdraft = false,
  label = 'Account'
}: AccountSectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <AccountSelector
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountSelect={onAccountSelect}
        loading={loading}
        formatMoney={formatMoney}
        showBalance={showBalance}
        showProjectedBalance={showProjectedBalance}
        projectedBalance={projectedBalance}
        isOverdraft={isOverdraft}
      />
    </View>
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
});

