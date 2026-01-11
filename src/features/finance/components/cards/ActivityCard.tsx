import type { ActivityTransaction } from '../../types';
import SwipeableActivityRow from '../SwipeableActivityRow';

type ActivityCardProps = {
  isSignedIn: boolean;
  authLoading: boolean;
  entriesLoading: boolean;
  entriesError: string | null;
  recentTransactions: ActivityTransaction[];
  orderedActivityGroups: Array<[string, ActivityTransaction[]]>;
  hasMoreActivity: boolean;
  activityInsight: string | null;
  activityRangeLabel: string;
  currencyCode: 'USD' | 'PHP';
  animatedTransactionIds: string[];
  unknownDateLabel: string;
  onOpenSheet: () => void;
  onDeleteTransaction: (transaction: ActivityTransaction) => void;
  onCategorizeTransaction: (transaction: ActivityTransaction) => void;
  formatEntryTime: (value?: string | null) => string | null;
};

const ActivityCard = ({
  isSignedIn,
  authLoading,
  entriesLoading,
  entriesError,
  recentTransactions,
  orderedActivityGroups,
  hasMoreActivity,
  activityInsight,
  activityRangeLabel,
  currencyCode,
  animatedTransactionIds,
  unknownDateLabel,
  onOpenSheet,
  onDeleteTransaction,
  onCategorizeTransaction,
  formatEntryTime
}: ActivityCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] backdrop-blur transition hover:border-slate-300 hover:shadow-md active:scale-[0.99] active:shadow-lg">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-900">Activity</h3>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">
            {activityRangeLabel}
          </p>
        </div>
        <button
          onClick={onOpenSheet}
          className="text-[11px] font-black text-slate-500 uppercase tracking-widest"
        >
          {hasMoreActivity ? 'See more' : 'History'}
        </button>
      </div>

      {authLoading || entriesLoading ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Loading entries...</div>
      ) : !isSignedIn ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Sign in to view your activity.</div>
      ) : entriesError ? (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-500">{entriesError}</div>
      ) : recentTransactions.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">No activity yet.</div>
      ) : (
        <div className="space-y-8">
          {orderedActivityGroups.map(([date, items]) => (
            <div key={date}>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-5">{date}</p>
              <div className="space-y-4">
                {items.map((transaction) => (
                  <SwipeableActivityRow
                    key={transaction.id}
                    transaction={transaction}
                    currencyCode={currencyCode}
                    onDelete={onDeleteTransaction}
                    onCategorize={onCategorizeTransaction}
                    timeLabel={
                      date !== unknownDateLabel && transaction.hasValidDate
                        ? formatEntryTime(transaction.createdAt)
                        : null
                    }
                    isNew={animatedTransactionIds.includes(transaction.id)}
                  />
                ))}
              </div>
            </div>
          ))}
          {activityInsight && <p className="pt-2 text-xs text-slate-500">{activityInsight}</p>}
        </div>
      )}
    </div>
  );
};

export default ActivityCard;
