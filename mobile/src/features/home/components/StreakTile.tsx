import { Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';

interface StreakTileProps {
  streakDays: number;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
}

const StreakTile = ({ streakDays, loading, isSignedIn, error }: StreakTileProps) => {
  const label = `${streakDays} ${streakDays === 1 ? 'Day' : 'Days'} Streak`;

  return (
    <View className="rounded-2xl bg-black p-5 text-white shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs uppercase tracking-widest text-white/60">Streak</Text>
        <Flame size={16} color="#ffffff" />
      </View>
      {loading ? (
        <Text className="mt-6 text-2xl font-bold text-white/50">Loading...</Text>
      ) : error ? (
        <Text className="mt-6 text-sm font-semibold text-white/70">Unable to load streak.</Text>
      ) : !isSignedIn ? (
        <Text className="mt-6 text-sm font-semibold text-white/70">Sign in to start a streak.</Text>
      ) : streakDays === 0 ? (
        <Text className="mt-6 text-sm font-semibold text-white/70">No streak yet.</Text>
      ) : (
        <Text className="mt-6 text-2xl font-bold">{label}</Text>
      )}
    </View>
  );
};

export default StreakTile;
