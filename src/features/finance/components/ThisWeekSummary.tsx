interface ThisWeekSummaryProps {
  spent: number;
  income: number;
  net: number;
  currencyCode?: 'USD' | 'PHP';
  helperText?: string | null;
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onClick?: () => void;
}

const formatCurrency = (value: number, currencyCode: 'USD' | 'PHP') => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value)
);

const ThisWeekSummary = ({
  spent,
  income,
  net,
  currencyCode = 'USD',
  helperText,
  loading,
  isSignedIn,
  error,
  onClick
}: ThisWeekSummaryProps) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      className={`rounded-3xl border border-emerald-200/70 bg-white/90 p-5 shadow-[0_12px_32px_-24px_rgba(16,185,129,0.35)] backdrop-blur ${
        isInteractive ? 'cursor-pointer transition hover:border-emerald-300 hover:shadow-md' : ''
      }`}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(event) => {
        if (!isInteractive) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">This Week</p>
        {helperText && !loading && !error && isSignedIn && (
          <span
            className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
              net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {net >= 0 ? 'On track' : 'Watch spend'}
          </span>
        )}
      </div>
      <div className="mt-3 h-[3px] w-12 rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-300" />
      {loading ? (
        <p className="mt-3 text-sm text-slate-400">Loading summary...</p>
      ) : error ? (
        <p className="mt-3 text-sm text-rose-500">Unable to load summary.</p>
      ) : !isSignedIn ? (
        <p className="mt-3 text-sm text-slate-400">Sign in to see weekly summary.</p>
      ) : (
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>Spent so far</span>
            <span className="font-semibold text-slate-900">{formatCurrency(spent, currencyCode)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Income</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(income, currencyCode)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Net</span>
            <span className={`font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {formatCurrency(net, currencyCode)}
            </span>
          </div>
          {helperText && (
            <p className="pt-2 text-xs text-slate-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ThisWeekSummary;
