import { goalColors } from '../constants';
import AccountModal from '../components/modals/AccountModal';
import GoalModal from '../components/modals/GoalModal';
import InfoModal from '../components/modals/InfoModal';
import BillsManagerModal from '../components/BillsManagerModal';
import SubscriptionsManagerModal from '../components/SubscriptionsManagerModal';
import type { FinanceDashboardViewProps } from './dashboard.types';

export const FinanceModals = (props: FinanceDashboardViewProps) => {
  const {
    showAccountModal,
    showGoalModal,
    showBillsModal,
    showSubscriptionsModal,
    infoModal,
    editingAccount,
    accountForm,
    accountSaveError,
    accountSaving,
    goalForm,
    goalSaveError,
    goalSaving,
    accounts,
    bills,
    subscriptions,
    currencyCode,
    billsLoading,
    billsError,
    subscriptionsLoading,
    subscriptionsError,
    onCloseAccountModal,
    onCloseGoalModal,
    onCloseBillsModal,
    onCloseSubscriptionsModal,
    onCloseInfoModal,
    onAccountFormChange,
    onAccountColorChange,
    onGoalFormChange,
    onGoalColorChange,
    onSaveAccount,
    onDeleteAccount,
    onSaveGoal,
    createBill,
    updateBill,
    deleteBill,
    createSubscription,
    updateSubscription,
    deleteSubscription
  } = props;

  return (
    <>
      <AccountModal
        isOpen={showAccountModal}
        editingAccount={editingAccount}
        accountForm={accountForm}
        accountSaveError={accountSaveError}
        accountSaving={accountSaving}
        onClose={onCloseAccountModal}
        onNameChange={(value) => onAccountFormChange('name', value)}
        onBalanceChange={(value) => onAccountFormChange('balance', value)}
        onLastFourChange={(value) => onAccountFormChange('lastFour', value)}
        onColorChange={onAccountColorChange}
        onSave={onSaveAccount}
        onDelete={onDeleteAccount}
      />

      <GoalModal
        isOpen={showGoalModal}
        goalForm={goalForm}
        goalColors={goalColors}
        goalSaveError={goalSaveError}
        goalSaving={goalSaving}
        onClose={onCloseGoalModal}
        onNameChange={(value) => onGoalFormChange('name', value)}
        onTargetChange={(value) => onGoalFormChange('target', value)}
        onCurrentChange={(value) => onGoalFormChange('current', value)}
        onColorChange={onGoalColorChange}
        onSave={onSaveGoal}
      />

      <InfoModal isOpen={Boolean(infoModal)} info={infoModal} onClose={onCloseInfoModal} />

      <BillsManagerModal
        isOpen={showBillsModal}
        onClose={onCloseBillsModal}
        bills={bills}
        accounts={accounts}
        currencyCode={currencyCode}
        loading={billsLoading}
        error={billsError ?? undefined}
        onCreate={createBill}
        onUpdate={updateBill}
        onDelete={deleteBill}
      />

      <SubscriptionsManagerModal
        isOpen={showSubscriptionsModal}
        onClose={onCloseSubscriptionsModal}
        subscriptions={subscriptions}
        accounts={accounts}
        currencyCode={currencyCode}
        loading={subscriptionsLoading}
        error={subscriptionsError ?? undefined}
        onCreate={createSubscription}
        onUpdate={updateSubscription}
        onDelete={deleteSubscription}
      />
    </>
  );
};

