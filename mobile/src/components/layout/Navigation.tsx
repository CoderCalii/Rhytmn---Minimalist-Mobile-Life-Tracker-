import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';

type NavigationProps = ViewProps & {
  children: ReactNode;
};

export function Navigation({ children, ...props }: NavigationProps) {
  return <View {...props}>{children}</View>;
}
