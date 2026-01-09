interface TodayStatusCardProps {
  tasksOpen: number;
  habitsLeft: number;
  alertsCount: number;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onTasksClick?: () => void;
  onHabitsClick?: () => void;
  onAlertsClick?: () => void;
}

const TodayStatusCard = ({
  tasksOpen,
  habitsLeft,
  alertsCount,
  loading,
  isSignedIn,
  error,
  onTasksClick,
  onHabitsClick,
  onAlertsClick
}: TodayStatusCardProps) => {
  const alertsLabel = alertsCount === 0 ? 'None' : `${alertsCount} attention`;
  const alertsTone = alertsCount === 0 ? 'text-slate-400' : 'text-rose-500';

  return (
    <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Today</p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--home-ink)]">Status</h3>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {loading ? (
          <p className="text-slate-400">Loading today status...</p>
        ) : error ? (
          <p className="text-rose-500">Unable to load today status.</p>
        ) : !isSignedIn ? (
          <p className="text-slate-400">Sign in to see today status.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={onTasksClick}
              className="w-full flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5"
            >
              <span className="text-slate-500">Tasks open</span>
              <span className={`font-semibold ${tasksOpen === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                {tasksOpen}
              </span>
            </button>
            <button
              type="button"
              onClick={onHabitsClick}
              className="w-full flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5"
            >
              <span className="text-slate-500">Habits left</span>
              <span className={`font-semibold ${habitsLeft === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                {habitsLeft}
              </span>
            </button>
            <button
              type="button"
              onClick={onAlertsClick}
              className="w-full flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5"
            >
              <span className="text-slate-500">Alerts</span>
              <span className={`font-semibold ${alertsTone}`}>{alertsLabel}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TodayStatusCard;
