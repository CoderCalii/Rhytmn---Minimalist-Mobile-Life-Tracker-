import { ScrollView, StyleSheet, View } from 'react-native';
import type { FinanceAccount, FinanceGoal } from '../../../types';
import { ModalHeader } from './components/ModalHeader';
import { TransactionTypeSection } from './sections/TransactionTypeSection';
import { AmountSection } from './sections/AmountSection';
import { CategorySection } from './sections/CategorySection';
import { AccountSection } from './sections/AccountSection';
import { TransferSection } from './sections/TransferSection';
import { GoalSection } from './sections/GoalSection';
import { NotesSection } from './sections/NotesSection';
import { ConfirmSection } from './sections/ConfirmSection';
import type { TransactionType, GoalFlow } from './capture.types';

interface TransactionTypeData {
  id: TransactionType;
  label: string;
  accent: string;
}

interface FinanceCaptureViewProps {
  date: Date;
  type: TransactionType;
  amount: number | null;
  category: string;
  selectedAccountId: string | null;
  selectedDestinationAccountId: string | null;
  selectedGoal: string | null;
  goalFlow: GoalFlow;
  accounts: FinanceAccount[];
  goals: FinanceGoal[];
  accountsLoading: boolean;
  goalsLoading: boolean;
  categories: string[];
  isEditingCategories: boolean;
  newCategory: string;
  showNotes: boolean;
  note: string;
  isSaving: boolean;
  error: string | null;
  toast: { type: 'success' | 'error'; message: string } | null;
  isConfirmDisabled: boolean;
  currentTypeData: TransactionTypeData;
  transferAmount: number;
  currencySymbol: string;
  onClose: () => void;
  onTypeChange: (type: TransactionType) => void;
  onAmountChange: (amount: number | null) => void;
  onCategorySelect: (category: string) => void;
  onAccountSelect: (accountId: string) => void;
  onDestinationAccountSelect: (accountId: string) => void;
  onGoalSelect: (goalId: string) => void;
  onGoalFlowChange: (flow: GoalFlow) => void;
  onToggleEditCategories: () => void;
  onAddCategory: () => void;
  onRemoveCategory: (tag: string) => void;
  onNewCategoryChange: (value: string) => void;
  onToggleNotes: () => void;
  onNoteChange: (value: string) => void;
  onConfirm: () => void;
  formatMoney: (value: number) => string;
  goalAccountIsOverdraft: boolean;
}

export const FinanceCaptureView = ({
  date,
  type,
  amount,
  category,
  selectedAccountId,
  selectedDestinationAccountId,
  selectedGoal,
  goalFlow,
  accounts,
  goals,
  accountsLoading,
  goalsLoading,
  categories,
  isEditingCategories,
  newCategory,
  showNotes,
  note,
  isSaving,
  error,
  toast,
  isConfirmDisabled,
  currentTypeData,
  transferAmount,
  currencySymbol,
  onClose,
  onTypeChange,
  onAmountChange,
  onCategorySelect,
  onAccountSelect,
  onDestinationAccountSelect,
  onGoalSelect,
  onGoalFlowChange,
  onToggleEditCategories,
  onAddCategory,
  onRemoveCategory,
  onNewCategoryChange,
  onToggleNotes,
  onNoteChange,
  onConfirm,
  formatMoney,
  goalAccountIsOverdraft
}: FinanceCaptureViewProps) => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ModalHeader date={date} onClose={onClose} />
        
        <TransactionTypeSection type={type} onTypeChange={onTypeChange} />
        
        <AmountSection
          amount={amount}
          onAmountChange={onAmountChange}
          currencySymbol={currencySymbol}
          accentColor={currentTypeData.accent}
        />

        <View style={styles.contentSection}>
          {type === 'transfer' && (
            <TransferSection
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              selectedDestinationAccountId={selectedDestinationAccountId}
              onAccountSelect={onAccountSelect}
              onDestinationAccountSelect={onDestinationAccountSelect}
              loading={accountsLoading}
              formatMoney={formatMoney}
              transferAmount={transferAmount}
            />
          )}

          {type !== 'transfer' && type !== 'goal' && (
            <CategorySection
              categories={categories}
              selectedCategory={category}
              onCategorySelect={onCategorySelect}
              isEditing={isEditingCategories}
              onToggleEdit={onToggleEditCategories}
              onAddCategory={onAddCategory}
              onRemoveCategory={onRemoveCategory}
              newCategory={newCategory}
              onNewCategoryChange={onNewCategoryChange}
              type={type}
            />
          )}

          {type !== 'transfer' && type !== 'goal' && (
            <AccountSection
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onAccountSelect={onAccountSelect}
              loading={accountsLoading}
              formatMoney={formatMoney}
            />
          )}

          {type === 'goal' && (
            <GoalSection
              goals={goals}
              selectedGoalId={selectedGoal}
              onGoalSelect={onGoalSelect}
              goalFlow={goalFlow}
              onGoalFlowChange={onGoalFlowChange}
              loading={goalsLoading}
            />
          )}

          {type === 'goal' && (
            <AccountSection
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onAccountSelect={onAccountSelect}
              loading={accountsLoading}
              formatMoney={formatMoney}
              showBalance
              showProjectedBalance
              projectedBalance={selectedAccountId
                ? goalFlow === 'contribution'
                  ? (accounts.find(a => a.id === selectedAccountId)?.balance ?? 0) - transferAmount
                  : (accounts.find(a => a.id === selectedAccountId)?.balance ?? 0) + transferAmount
                : undefined}
              isOverdraft={goalAccountIsOverdraft}
              label={goalFlow === 'contribution' ? 'Fund from' : 'Withdraw to'}
            />
          )}

          <NotesSection
            showNotes={showNotes}
            note={note}
            onToggleNotes={onToggleNotes}
            onNoteChange={onNoteChange}
          />
        </View>

        <ConfirmSection
          type={type}
          isSaving={isSaving}
          isDisabled={isConfirmDisabled}
          onPress={onConfirm}
          error={error}
          toast={toast}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 384,
    borderRadius: 56,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 25,
  },
  scrollContent: {
    padding: 28,
  },
  contentSection: {
    marginBottom: 32,
  },
});

