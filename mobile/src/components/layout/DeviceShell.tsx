import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';

type DeviceShellProps = ViewProps & {
  children: ReactNode;
};

export function DeviceShell({ children, ...props }: DeviceShellProps) {
  return <View {...props}>{children}</View>;
}
