import { useRef } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import type { ReactNode } from 'react';
import type { DashboardCardId } from '../types';
import { triggerHaptic } from '../utils/financeUi';

type DashboardCardShellProps = {
  id: DashboardCardId;
  children: ReactNode;
  onLongPress?: (id: DashboardCardId) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDragStart?: (id: DashboardCardId) => void;
  onDrop?: (id: DashboardCardId) => void;
  onDragEnd?: () => void;
};

const DashboardCardShell = ({
  id,
  children,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onDragStart,
  onDrop,
  onDragEnd
}: DashboardCardShellProps) => {
  const startPointRef = useRef<{ x: number; y: number; swiped: boolean } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: (_, gestureState) => {
        startPointRef.current = { x: gestureState.x0, y: gestureState.y0, swiped: false };
      },
      onPanResponderMove: (_, gestureState) => {
        if (!startPointRef.current) return;
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        if (startPointRef.current.swiped) return;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          startPointRef.current.swiped = true;
          triggerHaptic();
          if (dx < 0) {
            onSwipeLeft?.();
          } else {
            onSwipeRight?.();
          }
        }
      },
      onPanResponderRelease: () => {
        startPointRef.current = null;
      },
      onPanResponderTerminate: () => {
        startPointRef.current = null;
      }
    })
  ).current;

  return (
    <Pressable
      onLongPress={() => onLongPress?.(id)}
      delayLongPress={420}
      onPressIn={() => onDragStart?.(id)}
      onPressOut={() => onDragEnd?.()}
      {...panResponder.panHandlers}
    >
      <View>{children}</View>
    </Pressable>
  );
};

export default DashboardCardShell;
