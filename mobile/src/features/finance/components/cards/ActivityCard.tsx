import { Pressable, Text, View } from 'react-native';
import type { ActivityTransaction } from '../../types';
import SwipeableActivityRow from '../SwipeableActivityRow';
import { Card } from '../../../../components/ui/Card';

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
    <Card
      blurIntensity={24}
      shadowColor="#0f172a"
      shadowOpacity={0.35}
      shadowRadius={20}
      shadowOffsetY={14}
      elevation={10}
      className="rounded-3xl border border-slate-200/80"
    >
      <View className="bg-white/85 p-6">
        <View className="gap-6">
          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-xl font-black tracking-tight text-slate-900">Activity</Text>
              <Text className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">
                {activityRangeLabel}
              </Text>
            </View>
            <Pressable onPress={onOpenSheet}>
              <Text className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                {hasMoreActivity ? 'See more' : 'History'}
              </Text>
            </Pressable>
          </View>

          {authLoading || entriesLoading ? (
            <View className="rounded-2xl bg-slate-50 p-4">
              <Text className="text-sm text-slate-400">Loading entries...</Text>
            </View>
          ) : !isSignedIn ? (
            <View className="rounded-2xl bg-slate-50 p-4">
              <Text className="text-sm text-slate-400">Sign in to view your activity.</Text>
            </View>
          ) : entriesError ? (
            <View className="rounded-2xl bg-rose-50 p-4">
              <Text className="text-sm text-rose-500">{entriesError}</Text>
            </View>
          ) : recentTransactions.length === 0 ? (
            <View className="rounded-2xl bg-slate-50 p-4">
              <Text className="text-sm text-slate-400">No activity yet.</Text>
            </View>
          ) : (
            <View className="gap-8">
              {orderedActivityGroups.map(([date, items]) => (
                <View key={date} className="gap-5">
                  <Text className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em]">
                    {date}
                  </Text>
                  <View className="gap-4">
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
                  </View>
                </View>
              ))}
              {activityInsight ? (
                <Text className="pt-2 text-xs text-slate-500">{activityInsight}</Text>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

export default ActivityCard;
