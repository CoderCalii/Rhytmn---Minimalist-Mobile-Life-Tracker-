import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { FinanceGoal } from '../../../../types';
import { GoalTracker } from '../GoalTracker';

type GrowthTargetsCardProps = {
  isSignedIn: boolean;
  authLoading: boolean;
  goalsLoading: boolean;
  goalsError: string | null;
  goals: FinanceGoal[];
  displayedGoals: FinanceGoal[];
  showAllGoals: boolean;
  rangeLabel: string;
  onToggleShowAllGoals: () => void;
  onOpenGoalModal: () => void;
  onOpenSheet: () => void;
  onDeleteGoal: (goalId: string) => void;
};

const GrowthTargetsCard = ({
  isSignedIn,
  authLoading,
  goalsLoading,
  goalsError,
  goals,
  displayedGoals,
  showAllGoals,
  rangeLabel,
  onToggleShowAllGoals,
  onOpenGoalModal,
  onOpenSheet,
  onDeleteGoal
}: GrowthTargetsCardProps) => {
  return (
    <div
      className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] backdrop-blur transition hover:border-slate-300 hover:shadow-md active:scale-[0.99] active:shadow-lg cursor-pointer"
      onClick={onOpenSheet}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenSheet();
        }
      }}
    >
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-900">Growth Targets</h3>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">{rangeLabel}</p>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleShowAllGoals();
          }}
          className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"
        >
          {showAllGoals ? 'Hide Goals' : 'View All Goals'}
          <span className="text-slate-400">({goals.length})</span>
          {showAllGoals ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {authLoading || goalsLoading ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Loading goals...</div>
      ) : !isSignedIn ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Sign in to view goals.</div>
      ) : goalsError ? (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-500">{goalsError}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 transition-all duration-300">
          {displayedGoals.map((goal) => (
            <GoalTracker
              key={goal.id}
              goal={goal}
              onDelete={onDeleteGoal}
              showDelete={showAllGoals}
            />
          ))}
          {showAllGoals && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onOpenGoalModal();
              }}
              className="col-span-2 flex flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all active:scale-95"
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                <Plus size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Add New Goal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GrowthTargetsCard;
