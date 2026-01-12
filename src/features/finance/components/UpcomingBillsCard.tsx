import AnimatedNumber from './AnimatedNumber';

interface UpcomingBillItem {
  name: string;
  dateLabel: string;
  amount: number;
}

interface UpcomingBillsCardProps {
  bills: UpcomingBillItem[];
  currencyCode?: 'USD' | 'PHP';
  loading: boolean;
  isSignedIn: boolean;
  error?: string | null;
  onClick?: () => void;
  rangeLabel?: string;
  insight?: string | null;
  monthTotal?: number | null;
}

const formatCurrency = (value: number, currencyCode: 'USD' | 'PHP') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value);

const UpcomingBillsCard = ({
  bills,
  currencyCode = 'USD',
  loading,
  isSignedIn,
  error,
  onClick,
  rangeLabel = 'This period',
  insight,
  monthTotal
}: UpcomingBillsCardProps) => {
  const isInteractive = Boolean(onClick);
  const showMonthTotal = isSignedIn && !loading && !error && monthTotal != null;

  return (
    <div
      className={`rounded-3xl border border-rose-200/70 bg-white/90 p-5 shadow-[0_12px_32px_-24px_rgba(244,63,94,0.35)] backdrop-blur ${
        isInteractive ? 'cursor-pointer transition hover:border-rose-300 hover:shadow-md active:scale-[0.99] active:shadow-lg' : ''
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
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Upcoming Bills</p>
        {!loading && !error && isSignedIn && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
            {bills.length} due {rangeLabel}
          </span>
        )}
      </div>
      <div className="mt-3 h-[3px] w-12 rounded-full bg-gradient-to-r from-rose-400 via-orange-300 to-amber-300" />
      {loading ? (
        <p className="mt-3 text-sm text-slate-400">Loading bills...</p>
      ) : error ? (
        <p className="mt-3 text-sm text-rose-500">Unable to load bills.</p>
      ) : !isSignedIn ? (
        <p className="mt-3 text-sm text-slate-400">Sign in to see bills.</p>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          {showMonthTotal && (
            <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-rose-100/70">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                This month total
              </span>
              <AnimatedNumber
                value={monthTotal ?? 0}
                format={(value) => formatCurrency(value, currencyCode)}
                className="font-semibold text-slate-900"
              />
            </div>
          )}
          {bills.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming bills.</p>
          ) : (
            <>
              {bills.map((bill) => (
                <div
                  key={`${bill.name}-${bill.dateLabel}`}
                  className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-rose-100/70"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{bill.name}</p>
                    <p className="text-xs text-slate-400">{bill.dateLabel}</p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatCurrency(bill.amount, currencyCode)}</span>
                </div>
              ))}
              {insight && <p className="pt-1 text-xs text-slate-500">{insight}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UpcomingBillsCard;
