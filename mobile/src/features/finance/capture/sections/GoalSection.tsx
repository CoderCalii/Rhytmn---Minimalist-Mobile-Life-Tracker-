import { GoalSelector } from '../components/GoalSelector';
import type { FinanceGoal } from '../../../types';
import type { GoalFlow } from '../capture.types';

interface GoalSectionProps {
  goals: FinanceGoal[];
  selectedGoalId: string | null;
  onGoalSelect: (goalId: string) => void;
  goalFlow: GoalFlow;
  onGoalFlowChange: (flow: GoalFlow) => void;
  loading: boolean;
}

export const GoalSection = ({
  goals,
  selectedGoalId,
  onGoalSelect,
  goalFlow,
  onGoalFlowChange,
  loading
}: GoalSectionProps) => {
  return (
    <GoalSelector
      goals={goals}
      selectedGoalId={selectedGoalId}
      onGoalSelect={onGoalSelect}
      goalFlow={goalFlow}
      onGoalFlowChange={onGoalFlowChange}
      loading={loading}
    />
  );
};

