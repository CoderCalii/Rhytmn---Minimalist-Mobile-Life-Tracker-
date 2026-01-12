import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type HeaderProps = {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
};

export function Header({ title, subtitle, rightAction }: HeaderProps) {
  return (
    <View>
      <View>
        <Text>{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View>{rightAction}</View> : null}
    </View>
  );
}
