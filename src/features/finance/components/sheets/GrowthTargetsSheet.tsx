import type { FinanceGoal } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';

type GrowthTargetsSheetProps = {
  goals: FinanceGoal[];
  currencyCode: 'USD' | 'PHP';
  isActive?: boolean;
};

const GrowthTargetsSheet = ({ goals, currencyCode, isActive = true }: GrowthTargetsSheetProps) => {
  return (
    <div className="space-y-4">
      {goals.length === 0 ? (
        <p className="text-sm text-slate-400">No goals created yet.</p>
      ) : (
        goals.map((goal) => {
          const progress = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
          const ringSize = 64;
          const stroke = 6;
          const radius = (ringSize - stroke) / 2;
          const circumference = 2 * Math.PI * radius;
          const dashOffset = isActive ? circumference * (1 - progress) : circumference;
          const pastProgress = Math.max(progress - 0.12, 0);
          const projectedProgress = Math.min(progress + (1 - progress) * 0.35, 1);

          return (
            <div key={goal.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div className="relative" style={{ width: ringSize, height: ringSize }}>
                  <svg width={ringSize} height={ringSize} className="rotate-[-90deg]">
                    <circle
                      stroke="#e2e8f0"
                      fill="transparent"
                      strokeWidth={stroke}
                      r={radius}
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                    />
                    <circle
                      stroke="#111827"
                      fill="transparent"
                      strokeWidth={stroke}
                      strokeLinecap="round"
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={dashOffset}
                      r={radius}
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      className="transition-[stroke-dashoffset] duration-200"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900">
                    {Math.round(progress * 100)}%
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{goal.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatCurrency(goal.current, currencyCode)} of {formatCurrency(goal.target, currencyCode)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="relative h-2 w-full rounded-full bg-slate-200/70">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-slate-900"
                    style={{ width: `${progress * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-slate-400/70"
                    style={{ width: `${projectedProgress * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-900"
                    style={{ left: `${pastProgress * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-emerald-500"
                    style={{ left: `${progress * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-slate-400"
                    style={{ left: `${projectedProgress * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <span>Past</span>
                  <span>Now</span>
                  <span>Projected</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default GrowthTargetsSheet;
