type AnomalyCategory = { name: string; amount: number; delta: number };
type CategoryTrend = { name: string; amount: number; previous: number; delta: number | null };

type InsightsSheetProps = {
  anomalyCategories: AnomalyCategory[];
  subscriptionShare: number | null;
  categoryTrends: CategoryTrend[];
};

const InsightsSheet = ({ anomalyCategories, subscriptionShare, categoryTrends }: InsightsSheetProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          Spending anomalies
        </p>
        {anomalyCategories.length === 0 ? (
          <p className="text-xs text-slate-500">No unusual spikes detected.</p>
        ) : (
          <div className="space-y-2 text-xs text-slate-600">
            {anomalyCategories.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span>{item.name}</span>
                <span className="font-semibold text-rose-500">+{Math.round(item.delta * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          Subscription creep
        </p>
        {subscriptionShare ? (
          <p className="text-xs text-slate-600">Subscriptions are {subscriptionShare}% of monthly income.</p>
        ) : (
          <p className="text-xs text-slate-500">No income data to compare yet.</p>
        )}
      </div>
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          Category trends
        </p>
        {categoryTrends.length === 0 ? (
          <p className="text-xs text-slate-500">No category trends yet.</p>
        ) : (
          <div className="space-y-2 text-xs text-slate-600">
            {categoryTrends.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span>{item.name}</span>
                {item.delta === null ? (
                  <span className="text-slate-400">New</span>
                ) : (
                  <span className={item.delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                    {item.delta >= 0 ? '↑' : '↓'} {Math.round(Math.abs(item.delta) * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsSheet;
