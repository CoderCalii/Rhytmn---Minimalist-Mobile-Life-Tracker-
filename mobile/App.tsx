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
  // CRITICAL FIX: Add error handling for font loading to prevent crashes
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold
  });

  // Wait for fonts to load if no error
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // If font loading failed, log warning but continue with system fonts
  if (fontError) {
    console.warn('[App] Font loading failed, continuing with system fonts:', fontError);
    // Continue rendering - fonts will fall back to system fonts automatically
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
