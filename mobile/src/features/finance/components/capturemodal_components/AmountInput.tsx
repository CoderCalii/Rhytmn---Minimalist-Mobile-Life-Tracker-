import { StyleSheet, Text, TextInput, View } from 'react-native';

interface AmountInputProps {
  amount: number | null;
  onAmountChange: (amount: number | null) => void;
  currencySymbol: string;
  accentColor: string;
}

export const AmountInput = ({ amount, onAmountChange, currencySymbol, accentColor }: AmountInputProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Text style={[styles.currencySymbol, { color: accentColor }]}>
          {currencySymbol}
        </Text>
        <TextInput
          placeholder="0"
          value={amount === null ? '' : String(amount)}
          onChangeText={(next) => onAmountChange(next === '' ? null : Number(next))}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#e2e8f0"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 30,
    marginRight: 4,
    alignSelf: 'flex-start',
    marginTop: 16,
    opacity: 0.4,
  },
  input: {
    width: 192,
    textAlign: 'center',
    fontSize: 48,
    fontWeight: '900',
    color: '#0f172a',
  },
});


