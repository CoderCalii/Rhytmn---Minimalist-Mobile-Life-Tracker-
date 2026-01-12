import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import type { PressableProps } from 'react-native';

type ButtonProps = PressableProps & {
  children: ReactNode;
};

export function Button({ children, ...props }: ButtonProps) {
  return <Pressable {...props}>{children}</Pressable>;
}
