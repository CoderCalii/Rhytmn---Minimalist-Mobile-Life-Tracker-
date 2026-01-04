import { Trash2 } from 'lucide-react';
import type { FinanceGoal } from '../../../types';

type GoalTrackerProps = {
  goal: FinanceGoal;
  onDelete?: (goalId: string) => void;
  showDelete?: boolean;
};

export function GoalTracker({ goal, onDelete, showDelete = false }: GoalTrackerProps) {
  const progress = Math.round((goal.current / goal.target) * 100);

  return (
    <div className={`${goal.color} p-5 rounded-[2.5rem] border border-white/50 shadow-sm relative overflow-hidden group active:scale-95 transition-all`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex px-3 py-1.5 rounded-full bg-white text-[11px] font-black shadow-sm text-slate-900">
            {progress}%
          </div>
          {onDelete && showDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(goal.id);
              }}
              className="w-8 h-8 rounded-full bg-white/80 text-slate-500 hover:text-slate-900 flex items-center justify-center"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{goal.name}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter">${(goal.current / 1000).toFixed(1)}k</p>
      </div>
      
      <div className="absolute bottom-0 left-0 h-1.5 bg-black/5 w-full">
        <div className="h-full bg-black/10 transition-all duration-1000" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
