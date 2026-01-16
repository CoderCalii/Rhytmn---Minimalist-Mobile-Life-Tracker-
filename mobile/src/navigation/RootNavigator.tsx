import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import PageDetailScreen from '../screens/PageDetailScreen';
import ArchivedTasksScreen from '../screens/ArchivedTasksScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Tabs"
      component={TabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="PageDetail"
      component={PageDetailScreen}
      options={{ title: 'Details' }}
    />
    <Stack.Screen
      name="ArchivedTasks"
      component={ArchivedTasksScreen}
      options={{ title: 'Archived Tasks' }}
    />
  </Stack.Navigator>
);

export default RootNavigator;
