import { Text, View } from 'react-native';
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
    <View>
      <Text className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
        Swipe to categorize or delete
      </Text>
      {filteredTransactions.length === 0 ? (
        <Text className="text-sm text-slate-400">No activity for this period.</Text>
      ) : (
        <View>
          {filteredTransactions.map((transaction) => (
            <View key={transaction.id} className="mb-4">
              <SwipeableActivityRow
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
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default ActivitySheet;
