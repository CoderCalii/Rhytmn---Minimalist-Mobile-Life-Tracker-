import { useContext } from 'react';
import type { ComponentType } from 'react';
import { Pressable, View } from 'react-native';
import { Activity, CreditCard, House, SquareCheckBig } from 'lucide-react-native';
import { NavigationContext, NavigationRouteContext } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../../navigation/types';

type NavItem = {
  key: keyof TabParamList;
  label: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
};

const navItems: NavItem[] = [
  { key: 'Home', label: 'Home', Icon: House },
  { key: 'Tasks', label: 'Tasks', Icon: SquareCheckBig },
  { key: 'Habits', label: 'Habits', Icon: Activity },
  { key: 'Finance', label: 'Finance', Icon: CreditCard }
];

interface FloatingBottomNavProps {
  bottomOffset: number;
}

const FloatingBottomNav = ({ bottomOffset }: FloatingBottomNavProps) => {
  const navigation = useContext(NavigationContext) as BottomTabNavigationProp<TabParamList> | null;
  const route = useContext(NavigationRouteContext);
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);
  const currentRouteName = route?.name as keyof TabParamList | undefined;

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-6 left-6 right-6 h-16 bg-white border border-gray-100 rounded-full shadow-lg flex items-center justify-around px-4 z-[90]"
      style={{ bottom: bottomOffset }}
    >
      <View className="flex-1 flex-row items-center justify-between">
        <View className="flex-row items-center gap-8">
          {leftItems.map(({ key, label, Icon }) => {
              const isActive = currentRouteName === key;
              const tone = isActive ? '#0f172a' : '#94a3b8';
              return (
                <Pressable
                  key={key}
                  onPress={() => navigation?.navigate?.(key)}
                  className="items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Icon size={24} color={tone} />
              </Pressable>
            );
          })}
        </View>
        <View className="w-12" />
        <View className="flex-row items-center gap-8">
          {rightItems.map(({ key, label, Icon }) => {
              const isActive = currentRouteName === key;
              const tone = isActive ? '#0f172a' : '#94a3b8';
              return (
                <Pressable
                  key={key}
                  onPress={() => navigation?.navigate?.(key)}
                  className="items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Icon size={24} color={tone} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default FloatingBottomNav;
