interface FinanceSnapshotCardProps {
  balance: number;
  weeklySpend: number;
  budget: number | null;
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

const FinanceSnapshotCard = ({
  balance,
  weeklySpend,
  budget,
  loading,
  isSignedIn,
  error
}: FinanceSnapshotCardProps) => {
  const hasBudget = budget !== null && Number.isFinite(budget);
  const spendRatio = hasBudget && budget ? Math.min(weeklySpend / budget, 1) : 0;

  return (
    <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.45)] backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">Finance</p>
      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading finance snapshot...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-rose-500">Unable to load finance data.</p>
      ) : !isSignedIn ? (
        <p className="mt-4 text-sm text-slate-400">Sign in to see finance details.</p>
      ) : (
        <>
          <h4 className="mt-3 text-2xl font-semibold text-[var(--home-ink)]">{formatCurrency(balance)}</h4>
          <p className="mt-1 text-xs text-slate-500">Current balance</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>This week spend</span>
              <span>{formatCurrency(weeklySpend)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${Math.round(spendRatio * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {hasBudget ? `Budget: ${formatCurrency(budget)}` : 'Budget not set'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceSnapshotCard;
