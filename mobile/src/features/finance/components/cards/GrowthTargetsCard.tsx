import { Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import type { FinanceGoal } from '../../../../types';
import { GoalTracker } from '../GoalTracker';
import { Card } from '../../../../components/ui/Card';

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
    <Card
      blurIntensity={24}
      shadowColor="#0f172a"
      shadowOpacity={0.35}
      shadowRadius={20}
      shadowOffsetY={14}
      elevation={10}
      className="rounded-3xl border border-slate-200/80"
    >
      <Pressable onPress={onOpenSheet} className="bg-white/85 p-6">
        <View className="gap-6">
          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-xl font-black tracking-tight text-slate-900">Growth Targets</Text>
              <Text className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">{rangeLabel}</Text>
            </View>
            <Pressable
              onPress={(event) => {
                event.stopPropagation?.();
                onToggleShowAllGoals();
              }}
              className="flex-row items-center"
            >
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {showAllGoals ? 'Hide Goals' : 'View All Goals'}
              </Text>
              <Text className="text-slate-400 ml-1">({goals.length})</Text>
              {showAllGoals ? <ChevronUp size={12} color="#94a3b8" /> : <ChevronDown size={12} color="#94a3b8" />}
            </Pressable>
          </View>

          {authLoading || goalsLoading ? (
            <View className="rounded-2xl bg-slate-50 p-4">
              <Text className="text-sm text-slate-400">Loading goals...</Text>
            </View>
          ) : !isSignedIn ? (
            <View className="rounded-2xl bg-slate-50 p-4">
              <Text className="text-sm text-slate-400">Sign in to view goals.</Text>
            </View>
          ) : goalsError ? (
            <View className="rounded-2xl bg-rose-50 p-4">
              <Text className="text-sm text-rose-500">{goalsError}</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {displayedGoals.map((goal) => (
                <View key={goal.id} className="w-[48%]">
                  <GoalTracker
                    goal={goal}
                    onDelete={onDeleteGoal}
                    showDelete={showAllGoals}
                  />
                </View>
              ))}
              {showAllGoals ? (
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation?.();
                    onOpenGoalModal();
                  }}
                  className="w-full flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400"
                >
                  <View className="w-12 h-12 rounded-full border border-dashed border-slate-300 items-center justify-center">
                    <Plus size={20} color="#94a3b8" />
                  </View>
                  <Text className="text-[10px] font-black uppercase tracking-widest">Add New Goal</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </Pressable>
    </Card>
  );
};

export default GrowthTargetsCard;
