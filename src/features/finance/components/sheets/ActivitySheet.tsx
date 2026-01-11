import type { ActivityTransaction } from '../../types';
import SwipeableActivityRow from '../SwipeableActivityRow';

type ActivitySheetProps = {
  filteredTransactions: ActivityTransaction[];
  currencyCode: 'USD' | 'PHP';
  unknownDateLabel: string;
  onDeleteTransaction: (transaction: ActivityTransaction) => void;
  onCategorizeTransaction: (transaction: ActivityTransaction) => void;
  formatEntryTime: (value?: string | null) => string | null;
};

const ActivitySheet = ({
  filteredTransactions,
  currencyCode,
  unknownDateLabel,
  onDeleteTransaction,
  onCategorizeTransaction,
  formatEntryTime
}: ActivitySheetProps) => {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Swipe to categorize or delete
      </p>
      {filteredTransactions.length === 0 ? (
        <p className="text-sm text-slate-400">No activity for this period.</p>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <SwipeableActivityRow
              key={transaction.id}
              transaction={transaction}
              currencyCode={currencyCode}
              onDelete={onDeleteTransaction}
              onCategorize={onCategorizeTransaction}
              timeLabel={
                transaction.date !== unknownDateLabel && transaction.hasValidDate
                  ? formatEntryTime(transaction.createdAt)
                  : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivitySheet;
