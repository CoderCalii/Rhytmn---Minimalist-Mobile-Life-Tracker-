import { Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import BrandLogo from '../../../components/BrandLogo';

const FinanceHeader = () => {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <View className="overflow-hidden">
      <BlurView intensity={60} tint="light" className="absolute inset-0" pointerEvents="none" />
      <View className="px-6 pt-12 pb-6 bg-white/70">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-4xl font-black tracking-tight text-slate-900" style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
              Portfolio
            </Text>
            <Text
              className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-widest"
              style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
            >
              {today}
            </Text>
          </View>
          <BrandLogo className="h-9 w-9" />
        </View>
      </View>
    </View>
  );
};

export default FinanceHeader;
