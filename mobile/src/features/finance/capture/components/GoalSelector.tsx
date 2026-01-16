import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { FinanceGoal } from '../../../../types';
import type { GoalFlow } from '../capture.types';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          Destination
        </Text>
        <View style={styles.flowToggle}>
          <Pressable
            onPress={() => onGoalFlowChange('contribution')}
            style={[styles.flowButton, goalFlow === 'contribution' && styles.flowButtonActive]}
          >
            <Text style={[styles.flowButtonText, goalFlow === 'contribution' && styles.flowButtonTextActive]}>
              Add
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onGoalFlowChange('withdrawal')}
            style={[styles.flowButton, goalFlow === 'withdrawal' && styles.flowButtonActive]}
          >
            <Text style={[styles.flowButtonText, goalFlow === 'withdrawal' && styles.flowButtonTextActive]}>
              Withdraw
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.goalsContainer}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading goals...</Text>
          </View>
        ) : goals.length > 0 ? (
          goals.map((goal) => (
            <Pressable
              key={goal.id}
              onPress={() => onGoalSelect(goal.id)}
              style={[styles.goalButton, selectedGoalId === goal.id && styles.goalButtonSelected]}
            >
              <Text style={[styles.goalText, selectedGoalId === goal.id && styles.goalTextSelected]}>
                {goal.name}
              </Text>
              {selectedGoalId === goal.id && <Check size={12} color="#7c3aed" />}
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active goals found</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  flowToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: '#faf5ff',
    padding: 4,
  },
  flowButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  flowButtonActive: {
    backgroundColor: '#ffffff',
  },
  flowButtonText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.1,
    color: '#c4b5fd',
  },
  flowButtonTextActive: {
    color: '#6d28d9',
  },
  goalsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  goalButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    marginBottom: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
  },
  goalButtonSelected: {
    borderColor: '#9333ea',
    backgroundColor: '#faf5ff',
  },
  goalText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
  },
  goalTextSelected: {
    color: '#6d28d9',
  },
  emptyState: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

