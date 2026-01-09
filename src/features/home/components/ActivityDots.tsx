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
    <div className="rounded-2xl bg-gray-100 p-5 shadow-sm">
      <div className="text-xs uppercase tracking-widest text-gray-400">System Activity</div>
      {loading ? (
        <div className="mt-6 text-xs text-gray-400">Loading activity...</div>
      ) : error ? (
        <div className="mt-6 text-xs text-rose-500">Unable to load activity.</div>
      ) : !isSignedIn ? (
        <div className="mt-6 text-xs text-gray-400">Sign in to see activity.</div>
      ) : (
        <div className="mt-4 grid grid-cols-7 gap-1">
          {dots.map((dot) => (
            <div
              key={dot.dateKey}
              className={`h-2 w-2 rounded-full ${resolveDotColor(dot.count)}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityDots;
