interface CategorySummary {
  name: string;
  amount: number;
}

interface TopCategoriesSummaryProps {
  categories: CategorySummary[];
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

const TopCategoriesSummary = ({
  categories,
  currencyCode = 'USD',
  loading,
  isSignedIn,
  error,
  onClick
}: TopCategoriesSummaryProps) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      className={`rounded-3xl border border-sky-200/70 bg-white/90 p-5 shadow-[0_12px_32px_-24px_rgba(14,165,233,0.35)] backdrop-blur ${
        isInteractive ? 'cursor-pointer transition hover:border-sky-300 hover:shadow-md' : ''
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
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Top Categories</p>
        {!loading && !error && isSignedIn && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
            This week
          </span>
        )}
      </div>
      <div className="mt-3 h-[3px] w-12 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-300" />
      {loading ? (
        <p className="mt-3 text-sm text-slate-400">Loading categories...</p>
      ) : error ? (
        <p className="mt-3 text-sm text-rose-500">Unable to load categories.</p>
      ) : !isSignedIn ? (
        <p className="mt-3 text-sm text-slate-400">Sign in to see categories.</p>
      ) : categories.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No spending yet.</p>
      ) : (
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-sky-100/70"
            >
              <span className="font-semibold text-slate-900">{category.name}</span>
              <span className="font-semibold text-slate-900">{formatCurrency(category.amount, currencyCode)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopCategoriesSummary;
