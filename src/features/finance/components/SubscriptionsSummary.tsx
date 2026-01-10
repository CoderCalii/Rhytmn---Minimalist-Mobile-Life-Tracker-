import AnimatedNumber from './AnimatedNumber';

interface SubscriptionsSummaryProps {
  total: number;
  names: string[];
  count: number;
  currencyCode?: 'USD' | 'PHP';
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onClick?: () => void;
  rangeLabel?: string;
  insight?: string | null;
}

const formatCurrency = (value: number, currencyCode: 'USD' | 'PHP') => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value)
);

const SubscriptionsSummary = ({
  total,
  names,
  count,
  currencyCode = 'USD',
  loading,
  isSignedIn,
  error,
  onClick,
  rangeLabel = 'This month',
  insight
}: SubscriptionsSummaryProps) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      className={`rounded-3xl border border-indigo-200/70 bg-white/90 p-5 shadow-[0_12px_32px_-24px_rgba(99,102,241,0.35)] backdrop-blur ${
        isInteractive ? 'cursor-pointer transition hover:border-indigo-300 hover:shadow-md active:scale-[0.99] active:shadow-lg' : ''
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
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Subscriptions</p>
        {!loading && !error && isSignedIn && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
            {count} active
          </span>
        )}
      </div>
      <div className="mt-3 h-[3px] w-12 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400" />
      {loading ? (
        <p className="mt-3 text-sm text-slate-400">Loading subscriptions...</p>
      ) : error ? (
        <p className="mt-3 text-sm text-rose-500">Unable to load subscriptions.</p>
      ) : !isSignedIn ? (
        <p className="mt-3 text-sm text-slate-400">Sign in to see subscriptions.</p>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-indigo-100/70">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{rangeLabel} total</span>
            <AnimatedNumber
              value={total}
              format={(value) => formatCurrency(value, currencyCode)}
              className="font-semibold text-slate-900"
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-indigo-100/70">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Active</span>
            <span className="font-semibold text-slate-900">{count}</span>
          </div>
          {names.length > 0 && (
            <div className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-500 shadow-sm ring-1 ring-indigo-100/70">
              {names.join(' \u2022 ')}
            </div>
          )}
          {insight && <p className="pt-1 text-xs text-slate-500">{insight}</p>}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsSummary;
