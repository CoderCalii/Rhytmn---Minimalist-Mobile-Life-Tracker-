import { useState } from 'react';
import { View } from 'react-native';
import { Plus } from 'lucide-react-native';
import HabitsView from '../features/habits/HabitsView';
import HabitCaptureModal from '../features/habits/HabitCaptureModal';
import FloatingLayout from '../components/layout/FloatingLayout';

const HabitsScreen = () => {
  const [showCapture, setShowCapture] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <FloatingLayout
      showFAB
      fabAction={() => setShowCapture(true)}
      fabIcon={<Plus size={24} color="#ffffff" />}
    >
      <View className="flex-1">
        <HabitsView refreshToken={refreshToken} />
        {showCapture && (
          <HabitCaptureModal
            onClose={() => setShowCapture(false)}
            onSaved={() => {
              setRefreshToken((token) => token + 1);
              setShowCapture(false);
            }}
          />
        )}
      </View>
    </FloatingLayout>
  );
};

export default HabitsScreen;
