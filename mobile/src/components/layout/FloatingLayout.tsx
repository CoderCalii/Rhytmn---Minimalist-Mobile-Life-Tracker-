import type { ReactNode } from 'react';
import { cloneElement, isValidElement, useRef } from 'react';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingBottomNav from './FloatingBottomNav';
import { getFabBottomOffset, getNavBottomOffset } from './layoutConstants';

interface FloatingLayoutProps {
  children: ReactNode;
  showFAB?: boolean;
  fabAction?: () => void;
  fabLongPressAction?: () => void;
  fabIcon?: ReactNode;
}

const FloatingLayout = ({
  children,
  showFAB = false,
  fabAction,
  fabLongPressAction,
  fabIcon
}: FloatingLayoutProps) => {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const navBottom = getNavBottomOffset(insets);
  const fabBottom = getFabBottomOffset(insets);
  const shouldShowFab = showFAB && !keyboardVisible;
  const resolvedFabIcon = isValidElement(fabIcon)
    ? cloneElement(fabIcon, { size: 32, color: '#ffffff' })
    : fabIcon ?? <Plus size={32} color="#ffffff" />;

  return (
    <View className="flex-1">
      {children}
      <FloatingBottomNav bottomOffset={navBottom} />
      {shouldShowFab ? (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: fabBottom, zIndex: 100 }}
        >
          <Pressable
            onPress={() => {
              if (longPressTriggeredRef.current) {
                longPressTriggeredRef.current = false;
                return;
              }
              fabAction?.();
            }}
            onLongPress={() => {
              longPressTriggeredRef.current = true;
              fabLongPressAction?.();
            }}
            delayLongPress={420}
            className="mx-auto h-16 w-16 items-center justify-center rounded-full bg-black shadow-2xl"
            style={({ pressed }) => ({
              transform: [
                { scale: pressed ? 0.95 : 1 },
                { translateY: pressed ? 1 : 0 }
              ]
            })}
          >
            {resolvedFabIcon}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

export default FloatingLayout;
