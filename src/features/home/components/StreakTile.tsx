import { Flame } from 'lucide-react';

interface StreakTileProps {
  streakDays: number;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
}

const StreakTile = ({ streakDays, loading, isSignedIn, error }: StreakTileProps) => {
  const label = `${streakDays} ${streakDays === 1 ? 'Day' : 'Days'} Streak`;

  return (
    <div className="rounded-2xl bg-black p-5 text-white shadow-sm">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/60">
        <span>Streak</span>
        <Flame size={16} className="text-white" />
      </div>
      {loading ? (
        <div className="mt-6 text-2xl font-bold text-white/50">Loading...</div>
      ) : error ? (
        <div className="mt-6 text-sm font-semibold text-white/70">Unable to load streak.</div>
      ) : !isSignedIn ? (
        <div className="mt-6 text-sm font-semibold text-white/70">Sign in to start a streak.</div>
      ) : streakDays === 0 ? (
        <div className="mt-6 text-sm font-semibold text-white/70">No streak yet.</div>
      ) : (
        <div className="mt-6 text-2xl font-bold">{label}</div>
      )}
    </div>
  );
};

export default StreakTile;
