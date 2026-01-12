import { Text, View } from 'react-native';

interface FocusTileProps {
  title: string;
  subtitle: string;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
}

const FocusTile = ({ title, subtitle, loading, isSignedIn, error }: FocusTileProps) => {
  return (
    <View className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-lg">
      <Text className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
        Focus
      </Text>
      {loading ? (
        <Text className="mt-4 text-sm text-slate-400">Finding your next focus...</Text>
      ) : error ? (
        <Text className="mt-4 text-sm text-rose-500">Unable to load focus.</Text>
      ) : !isSignedIn ? (
        <Text className="mt-4 text-sm text-slate-400">Sign in to see a focus item.</Text>
      ) : (
        <>
          <Text className="mt-3 text-lg font-semibold text-slate-900">{title}</Text>
          <Text className="mt-1 text-xs text-slate-500">{subtitle}</Text>
        </>
      )}
    </View>
  );
};

export default FocusTile;
