import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { FinanceGoal } from '../../../../types';

type GoalFlow = 'contribution' | 'withdrawal';

interface GoalSelectorProps {
  goals: FinanceGoal[];
  selectedGoalId: string | null;
  onGoalSelect: (goalId: string) => void;
  goalFlow: GoalFlow;
  onGoalFlowChange: (flow: GoalFlow) => void;
  loading: boolean;
}

export const GoalSelector = ({
  goals,
  selectedGoalId,
  onGoalSelect,
  goalFlow,
  onGoalFlowChange,
  loading
}: GoalSelectorProps) => {
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Destination
        </Text>
        <View className="flex-row items-center rounded-full bg-purple-50 p-1">
          <Pressable
            onPress={() => onGoalFlowChange('contribution')}
            className={`px-3 py-1 rounded-full ${goalFlow === 'contribution' ? 'bg-white' : ''}`}
          >
            <Text className={`text-[9px] font-bold uppercase tracking-widest ${goalFlow === 'contribution' ? 'text-purple-700' : 'text-purple-300'}`}>
              Add
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onGoalFlowChange('withdrawal')}
            className={`px-3 py-1 rounded-full ${goalFlow === 'withdrawal' ? 'bg-white' : ''}`}
          >
            <Text className={`text-[9px] font-bold uppercase tracking-widest ${goalFlow === 'withdrawal' ? 'text-purple-700' : 'text-purple-300'}`}>
              Withdraw
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap">
        {loading ? (
          <View className="w-full py-4 px-4 bg-slate-50 rounded-2xl">
            <Text className="text-[10px] font-bold text-slate-400 text-center italic">Loading goals...</Text>
          </View>
        ) : goals.length > 0 ? (
          goals.map((goal) => (
            <Pressable
              key={goal.id}
              onPress={() => onGoalSelect(goal.id)}
              className={`p-4 rounded-2xl border-2 mb-2 mr-2 flex-row items-center justify-between ${
                selectedGoalId === goal.id ? 'border-purple-600 bg-purple-50' : 'border-slate-50 bg-slate-50'
              }`}
            >
              <Text className={`text-[10px] font-black ${selectedGoalId === goal.id ? 'text-purple-700' : 'text-slate-400'}`}>
                {goal.name}
              </Text>
              {selectedGoalId === goal.id && <Check size={12} color="#7c3aed" />}
            </Pressable>
          ))
        ) : (
          <View className="w-full py-4 px-4 bg-slate-50 rounded-2xl">
            <Text className="text-[10px] font-bold text-slate-400 text-center italic">No active goals found</Text>
          </View>
        )}
      </View>
    </View>
  );
};

