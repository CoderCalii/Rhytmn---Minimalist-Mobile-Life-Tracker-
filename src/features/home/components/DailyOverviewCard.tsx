interface DailyOverviewCardProps {
  tasksDue: number;
  habitsRemaining: number;
  spendToday: number;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
}

const formatCurrency = (value: number) => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
);

const DailyOverviewCard = ({
  tasksDue,
  habitsRemaining,
  spendToday,
  loading,
  isSignedIn,
  error
}: DailyOverviewCardProps) => {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Daily Overview</p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--home-ink)]">Today at a glance</h3>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Today</span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {loading ? (
          <div className="col-span-3 text-xs text-slate-400">Loading overview...</div>
        ) : error ? (
          <div className="col-span-3 text-xs text-rose-500">Unable to load overview.</div>
        ) : !isSignedIn ? (
          <div className="col-span-3 text-xs text-slate-400">Sign in to see your day.</div>
        ) : (
          <>
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
              <p className="text-xs font-semibold text-slate-400">Tasks Due</p>
              <p className="mt-2 text-xl font-semibold text-[var(--home-ink)]">{tasksDue}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
              <p className="text-xs font-semibold text-slate-400">Habits Left</p>
              <p className="mt-2 text-xl font-semibold text-[var(--home-ink)]">{habitsRemaining}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
              <p className="text-xs font-semibold text-slate-400">Spend</p>
              <p className="mt-2 text-xl font-semibold text-[var(--home-ink)]">
                {formatCurrency(spendToday)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyOverviewCard;
