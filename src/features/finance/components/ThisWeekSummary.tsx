import AnimatedNumber from './AnimatedNumber';

type DeltaIndicator = {
  direction: 'up' | 'down' | 'flat';
  label: string;
};

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
  rangeLabel?: string;
  progress?: number;
  budgetAmount?: number;
  incomeDelta?: DeltaIndicator | null;
  netDelta?: DeltaIndicator | null;
  insight?: string | null;
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
  onClick,
  rangeLabel = 'This Week',
  progress,
  budgetAmount,
  incomeDelta,
  netDelta,
  insight
}: ThisWeekSummaryProps) => {
  const isInteractive = Boolean(onClick);
  const progressValue = progress ? Math.min(Math.max(progress, 0), 1) : 0;

  const renderDelta = (delta?: DeltaIndicator | null) => {
    if (!delta) return null;
    const tone =
      delta.direction === 'up'
        ? 'text-emerald-600 bg-emerald-50'
        : delta.direction === 'down'
          ? 'text-rose-600 bg-rose-50'
          : 'text-slate-400 bg-slate-100';
    return (
      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${tone}`}>
        {delta.label}
      </span>
    );
  };

  return (
    <div
      className={`rounded-3xl border border-emerald-200/70 bg-white/90 p-5 shadow-[0_12px_32px_-24px_rgba(16,185,129,0.35)] backdrop-blur ${
        isInteractive ? 'cursor-pointer transition hover:border-emerald-300 hover:shadow-md active:scale-[0.99] active:shadow-lg' : ''
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
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{rangeLabel}</p>
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Spent so far</span>
              {budgetAmount !== undefined && budgetAmount > 0 && (
                <span className="text-[10px] font-semibold text-slate-400">
                  of {formatCurrency(budgetAmount, currencyCode)}
                </span>
              )}
            </div>
            <AnimatedNumber
              value={spent}
              format={(value) => formatCurrency(value, currencyCode)}
              className="font-semibold text-slate-900"
            />
          </div>
          {budgetAmount !== undefined && budgetAmount > 0 && (
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-200"
                style={{ width: `${progressValue * 100}%` }}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Income</span>
              {renderDelta(incomeDelta)}
            </div>
            <AnimatedNumber
              value={income}
              format={(value) => formatCurrency(value, currencyCode)}
              className="font-semibold text-emerald-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Net</span>
              {renderDelta(netDelta)}
            </div>
            <AnimatedNumber
              value={net}
              format={(value) => formatCurrency(value, currencyCode)}
              className={`font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}
            />
          </div>
          {insight && <p className="pt-2 text-xs text-slate-500">{insight}</p>}
        </div>
      )}
    </div>
  );
};

export default ThisWeekSummary;
