import { useContext } from 'react';
import { NavigationContext } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import SettingsView from '../features/settings/SettingsView';
import type { TabParamList } from '../navigation/types';
import { useSettings } from '../hooks/useSettings';

const SettingsScreen = () => {
  const navigation = useContext(NavigationContext) as BottomTabNavigationProp<TabParamList> | null;
  const { currencyCode, setCurrencyCode } = useSettings();

  return (
    <SettingsView
      currencyCode={currencyCode}
      onCurrencyChange={setCurrencyCode}
      onBack={() => navigation?.navigate?.('Home')}
    />
  );
};

export default SettingsScreen;
