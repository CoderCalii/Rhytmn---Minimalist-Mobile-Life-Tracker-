import { useContext } from 'react';
import { NavigationContext } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import HomeView from '../features/home/view/HomeView';
import type { TabParamList } from '../navigation/types';
import FloatingLayout from '../components/layout/FloatingLayout';

const HomeScreen = () => {
  const navigation = useContext(NavigationContext) as BottomTabNavigationProp<TabParamList> | null;

  return (
    <FloatingLayout showFAB={false}>
      <HomeView
        onGoTasks={() => navigation?.navigate?.('Tasks')}
        onGoHabits={() => navigation?.navigate?.('Habits')}
        onGoAlerts={() => navigation?.navigate?.('Tasks')}
        onOpenSettings={() => navigation?.navigate?.('Settings')}
      />
    </FloatingLayout>
  );
};

export default HomeScreen;
