import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ResurfacingCardProps {
  title: string;
  description: string;
  highlight?: string | null;
  items?: string[];
  dateLabel?: string | null;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onPress?: () => void;
}

const ResurfacingCard = ({
  title,
  description,
  highlight,
  items,
  dateLabel,
  loading,
  isSignedIn,
  error,
  onPress
}: ResurfacingCardProps) => {
  const isInteractive = Boolean(onPress);
  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      style={{
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#f97316',
        shadowOpacity: 0.45,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 18 },
        elevation: 12
      }}
    >
      <LinearGradient
        colors={['#fbbf24', '#fb923c', '#fb7185']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 20 }}
      >
        <Text className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/80">
          Resurfacing
        </Text>
        {loading ? (
          <Text className="mt-4 text-sm text-white/80">Loading resurfacing...</Text>
        ) : error ? (
          <Text className="mt-4 text-sm text-white/80">Unable to load resurfacing.</Text>
        ) : !isSignedIn ? (
          <Text className="mt-4 text-sm text-white/80">Sign in to see your highlights.</Text>
        ) : (
          <>
            <View className="mt-3 flex-row items-start justify-between gap-3">
              <Text className="text-lg font-semibold text-white">{title}</Text>
              {dateLabel ? (
                <Text className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                  {dateLabel}
                </Text>
              ) : null}
            </View>
            <Text className="mt-1 text-xs text-white/80">{description}</Text>
            {highlight ? (
              <Text className="mt-3 text-sm font-semibold text-white">{highlight}</Text>
            ) : null}
            {items && items.length > 0 ? (
              <View className="mt-3 gap-1">
                {items.map((item) => (
                  <Text key={item} className="text-xs text-white/90">
                    - {item}
                  </Text>
                ))}
              </View>
            ) : null}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
};

export default ResurfacingCard;
