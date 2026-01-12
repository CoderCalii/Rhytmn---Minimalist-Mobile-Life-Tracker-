import { Text, View } from 'react-native';

interface ActivityDot {
  dateKey: string;
  count: number;
}

interface ActivityDotsProps {
  dots: ActivityDot[];
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
}

const resolveDotColor = (count: number) => {
  if (count >= 3) return 'bg-gray-700';
  if (count >= 2) return 'bg-gray-600';
  if (count >= 1) return 'bg-gray-500';
  return 'bg-gray-300/60';
};

const ActivityDots = ({ dots, loading, isSignedIn, error }: ActivityDotsProps) => {
  return (
    <View className="rounded-2xl bg-gray-100 p-5 shadow-sm">
      <Text className="text-xs uppercase tracking-widest text-gray-400">System Activity</Text>
      {loading ? (
        <Text className="mt-6 text-xs text-gray-400">Loading activity...</Text>
      ) : error ? (
        <Text className="mt-6 text-xs text-rose-500">Unable to load activity.</Text>
      ) : !isSignedIn ? (
        <Text className="mt-6 text-xs text-gray-400">Sign in to see activity.</Text>
      ) : (
        <View className="mt-4 flex-row flex-wrap">
          {dots.map((dot) => (
            <View
              key={dot.dateKey}
              className={`h-2 w-2 rounded-full ${resolveDotColor(dot.count)}`}
              style={{ marginRight: 4, marginBottom: 4 }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ActivityDots;
