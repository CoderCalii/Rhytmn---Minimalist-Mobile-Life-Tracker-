import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

type CurrencyCode = 'USD' | 'PHP';

interface SettingsViewProps {
  currencyCode: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onBack: () => void;
}

const SettingsView = ({ currencyCode, onCurrencyChange, onBack }: SettingsViewProps) => {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 120 }}>
      <View className="px-6 pt-12 pb-4 bg-white">
        <View className="flex-row items-center">
          <Pressable
            onPress={onBack}
            className="h-10 w-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <ArrowLeft size={18} color="#6b7280" />
          </Pressable>
          <View className="ml-3">
            <Text className="text-2xl font-bold tracking-tight text-black">Settings</Text>
            <Text className="text-gray-400 text-sm font-medium tracking-wide">Preferences</Text>
          </View>
        </View>
      </View>

      <View className="px-6">
        <View className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <Text className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">Finance</Text>
          <Text className="mt-2 text-lg font-semibold text-black">Currency</Text>
          <View className="mt-4 flex-row">
            {(['USD', 'PHP'] as CurrencyCode[]).map((currency, index) => (
              <Pressable
                key={currency}
                onPress={() => onCurrencyChange(currency)}
                className={`flex-1 rounded-2xl px-4 py-4 ${
                  currencyCode === currency ? 'bg-black' : 'bg-gray-50'
                } ${index === 0 ? 'mr-3' : ''}`}
              >
                <Text className={`text-xs uppercase tracking-widest ${currencyCode === currency ? 'text-white/70' : 'text-gray-400'}`}>
                  {currency === 'USD' ? 'United States' : 'Philippines'}
                </Text>
                <Text className={`mt-1 text-lg font-bold ${currencyCode === currency ? 'text-white' : 'text-gray-600'}`}>
                  {currency}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="mt-3 text-xs text-gray-400">
            This changes how Finance amounts are displayed.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingsView;
