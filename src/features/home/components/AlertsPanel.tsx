interface AlertsPanelProps {
  overdueTasks: number;
  billsDue: number;
  habitsMissed: number;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
}

const AlertsPanel = ({
  overdueTasks,
  billsDue,
  habitsMissed,
  loading,
  isSignedIn,
  error
}: AlertsPanelProps) => {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.45)] backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Alerts</p>
      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading alerts...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-rose-500">Unable to load alerts.</p>
      ) : !isSignedIn ? (
        <p className="mt-4 text-sm text-slate-400">Sign in to see alerts.</p>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Overdue tasks</span>
            <span className="font-semibold text-slate-900">{overdueTasks}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Bills due (7 days)</span>
            <span className="font-semibold text-slate-900">{billsDue}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Habits missed 2 days</span>
            <span className="font-semibold text-slate-900">{habitsMissed}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
