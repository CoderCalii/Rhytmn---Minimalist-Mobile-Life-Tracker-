import { Pressable, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import type { FinanceGoal } from '../../../types';

type GoalTrackerProps = {
  goal: FinanceGoal;
  onDelete?: (goalId: string) => void;
  showDelete?: boolean;
};

export function GoalTracker({ goal, onDelete, showDelete = false }: GoalTrackerProps) {
  const progress = Math.round((goal.current / goal.target) * 100);

  return (
    <View className={`${goal.color} p-5 rounded-[2.5rem] border border-white/50 shadow-sm relative overflow-hidden`}>
      <View className="relative z-10">
        <View className="flex-row items-center justify-between mb-6">
          <View className="px-3 py-1.5 rounded-full bg-white">
            <Text className="text-[11px] font-black text-slate-900">{progress}%</Text>
          </View>
          {onDelete && showDelete ? (
            <Pressable onPress={() => onDelete(goal.id)} className="w-8 h-8 rounded-full bg-white/80 items-center justify-center">
              <Trash2 size={14} color="#64748b" />
            </Pressable>
          ) : null}
        </View>

        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{goal.name}</Text>
        <Text className="text-2xl font-black text-slate-900 tracking-tighter">${(goal.current / 1000).toFixed(1)}k</Text>
      </View>

      <View className="absolute bottom-0 left-0 h-1.5 bg-black/5 w-full">
        <View className="h-full bg-black/10" style={{ width: `${progress}%` }} />
      </View>
    </View>
  );
}
