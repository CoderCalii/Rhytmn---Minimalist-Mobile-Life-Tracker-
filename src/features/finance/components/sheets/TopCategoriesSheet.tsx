import { formatCurrency } from '../../../../utils/formatters';

type CategoryTotal = { name: string; amount: number };

type TopCategoriesSheetProps = {
  categories: CategoryTotal[];
  total: number;
  insight: string | null;
  currencyCode: 'USD' | 'PHP';
};

const TopCategoriesSheet = ({ categories, total, insight, currencyCode }: TopCategoriesSheetProps) => {
  return (
    <div className="space-y-3">
      {categories.length === 0 ? (
        <p className="text-sm text-slate-400">No spend captured yet.</p>
      ) : (
        categories.map((category) => {
          const share = total > 0 ? Math.round((category.amount / total) * 100) : 0;
          return (
            <div key={category.name} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{category.name}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(category.amount, currencyCode)}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200/70">
                <div className="h-full rounded-full bg-sky-400" style={{ width: `${share}%` }} />
              </div>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {share}% of spend
              </p>
            </div>
          );
        })
      )}
      {insight && <p className="text-xs text-slate-500">{insight}</p>}
    </div>
  );
};

export default TopCategoriesSheet;
