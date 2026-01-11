import { formatCurrency } from '../../../../utils/formatters';
import AnimatedNumber from '../AnimatedNumber';

type ChartPoint = { label: string; spend: number; budget: number };
type ChartData = { points: ChartPoint[]; maxValue: number };
type Summary = { spent: number; income: number; net: number };

type ThisWeekSheetProps = {
  summary: Summary;
  weeklyBudget: number;
  weeklyInsight: string | null;
  chart: ChartData;
  currencyCode: 'USD' | 'PHP';
};

const ThisWeekSheet = ({ summary, weeklyBudget, weeklyInsight, chart, currencyCode }: ThisWeekSheetProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Spent</p>
          <AnimatedNumber
            value={summary.spent}
            format={(value) => formatCurrency(value, currencyCode)}
            className="text-xl font-black text-slate-900"
          />
          {weeklyBudget > 0 && (
            <p className="mt-1 text-[10px] font-semibold text-slate-400">
              Budget {formatCurrency(weeklyBudget, currencyCode)}
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Income</p>
          <AnimatedNumber
            value={summary.income}
            format={(value) => formatCurrency(value, currencyCode)}
            className="text-xl font-black text-emerald-600"
          />
        </div>
      </div>
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net</p>
        <AnimatedNumber
          value={summary.net}
          format={(value) => formatCurrency(value, currencyCode)}
          className={`text-xl font-black ${summary.net >= 0 ? 'text-emerald-600' : 'text-slate-900'}`}
        />
        {weeklyInsight && <p className="mt-2 text-xs text-slate-500">{weeklyInsight}</p>}
      </div>
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
          Spend vs budget
        </p>
        <div className="flex items-end gap-2 h-24">
          {chart.points.map((point, index) => (
            <div key={`${point.label}-${index}`} className="flex-1 flex flex-col items-center justify-end">
              <div className="w-full rounded-full bg-slate-200/70 relative h-full overflow-hidden">
                {point.budget > 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-emerald-200/70"
                    style={{ height: `${(point.budget / chart.maxValue) * 100}%` }}
                  />
                )}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-full bg-emerald-400 transition-all duration-200"
                  style={{ height: `${(point.spend / chart.maxValue) * 100}%` }}
                />
              </div>
              <span className="mt-2 text-[9px] font-semibold text-slate-400">{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThisWeekSheet;
