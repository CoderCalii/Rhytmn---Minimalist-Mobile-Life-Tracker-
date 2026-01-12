import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}

const AppHeader = ({ title, subtitle, rightAction }: AppHeaderProps) => (
  <View className="overflow-hidden">
    <BlurView intensity={60} tint="light" className="absolute inset-0" pointerEvents="none" />
    <View className="px-6 pt-12 pb-4 flex-row justify-between items-end bg-white/70">
      <View>
        <Text className="text-3xl font-bold tracking-tight text-black" style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-gray-400 text-sm mt-1 font-medium tracking-wide"
            style={{ fontFamily: 'SpaceGrotesk_500Medium' }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction ? <View>{rightAction}</View> : null}
    </View>
  </View>
);

export default AppHeader;
