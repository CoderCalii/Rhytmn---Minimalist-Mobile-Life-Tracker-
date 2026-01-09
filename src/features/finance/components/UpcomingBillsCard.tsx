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
}

const formatCurrency = (value: number, currencyCode: 'USD' | 'PHP') => (
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value)
);

const UpcomingBillsCard = ({
  bills,
  currencyCode = 'USD',
  loading,
  isSignedIn,
  error,
  onClick
}: UpcomingBillsCardProps) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      className={`rounded-3xl border border-rose-200/70 bg-white/90 p-5 shadow-[0_12px_32px_-24px_rgba(244,63,94,0.35)] backdrop-blur ${
        isInteractive ? 'cursor-pointer transition hover:border-rose-300 hover:shadow-md' : ''
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
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Upcoming Bills</p>
        {!loading && !error && isSignedIn && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
            {bills.length} due
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
      ) : bills.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No upcoming bills.</p>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-slate-700">
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
        </div>
      )}
    </div>
  );
};

export default UpcomingBillsCard;
