import type { ReactNode } from 'react';
import { View } from 'react-native';

type HabitModalProps = {
  open: boolean;
  children: ReactNode;
};

export function HabitModal({ open, children }: HabitModalProps) {
  if (!open) return null;
  return <View>{children}</View>;
}
