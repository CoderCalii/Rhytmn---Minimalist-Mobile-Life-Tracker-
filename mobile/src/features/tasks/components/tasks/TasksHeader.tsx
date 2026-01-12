import { Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

type FocusMode = 'tasks' | 'notes';

interface TasksHeaderProps {
  focusMode: FocusMode;
  onFocusChange: (mode: FocusMode) => void;
}

export function TasksHeader({ focusMode, onFocusChange }: TasksHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const tasksActive = focusMode === 'tasks';
  const notesActive = focusMode === 'notes';

  const handleToggle = (mode: FocusMode) => {
    if (mode === focusMode) return;
    onFocusChange(mode);
  };

  return (
    <View className="overflow-hidden">
      <BlurView intensity={60} tint="light" className="absolute inset-0" pointerEvents="none" />
      <View className="px-6 pt-12 pb-6 bg-white/70">
        <View className="flex-row items-end justify-between gap-4">
          <View>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => handleToggle('tasks')} disabled={tasksActive}>
                <Text
                  className={`text-4xl font-black tracking-tight ${tasksActive ? 'text-black' : 'text-black/40'}`}
                  style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
                >
                  To-Do
                </Text>
              </Pressable>
              <Pressable onPress={() => handleToggle('notes')} disabled={notesActive}>
                <Text
                  className={`text-4xl font-black tracking-tight ${notesActive ? 'text-black' : 'text-black/40'}`}
                  style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
                >
                  Notes
                </Text>
              </Pressable>
            </View>
            <Text
              className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest"
              style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
            >
              {today}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
