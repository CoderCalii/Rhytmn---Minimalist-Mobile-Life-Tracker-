import { Text, TextInput, View } from 'react-native';

interface AmountInputProps {
  amount: number | null;
  onAmountChange: (amount: number | null) => void;
  currencySymbol: string;
  accentColor: string;
}

export const AmountInput = ({ amount, onAmountChange, currencySymbol, accentColor }: AmountInputProps) => {
  return (
    <View className="items-center mb-8">
      <View className="flex-row items-center justify-center">
        <Text className="text-3xl mr-1 self-start mt-4 opacity-40" style={{ color: accentColor }}>
          {currencySymbol}
        </Text>
        <TextInput
          placeholder="0"
          value={amount === null ? '' : String(amount)}
          onChangeText={(next) => onAmountChange(next === '' ? null : Number(next))}
          keyboardType="numeric"
          className="w-48 text-center text-5xl font-black text-slate-900"
          placeholderTextColor="#e2e8f0"
        />
      </View>
    </View>
  );
};

