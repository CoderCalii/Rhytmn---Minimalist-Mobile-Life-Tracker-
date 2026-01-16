import 'react-native-gesture-handler';
import './global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import RootNavigator from './src/navigation/RootNavigator';
import { SettingsProvider } from './src/store/settingsContext';
import { TasksProvider } from './src/store/tasksProvider';
import { HabitsProvider } from './src/store/habitsProvider';

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <TasksProvider>
          <HabitsProvider>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </HabitsProvider>
        </TasksProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
