import type { FinanceAccount } from '../../../../types';

type AccountFormState = {
  name: string;
  balance: string;
  color: string;
  lastFour: string;
};

type AccountModalProps = {
  isOpen: boolean;
  editingAccount: FinanceAccount | null;
  accountForm: AccountFormState;
  accountColors: string[];
  accountSaveError: string | null;
  accountSaving: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onBalanceChange: (value: string) => void;
  onLastFourChange: (value: string) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
};

const AccountModal = ({
  isOpen,
  editingAccount,
  accountForm,
  accountColors,
  accountSaveError,
  accountSaving,
  onClose,
  onNameChange,
  onBalanceChange,
  onLastFourChange,
  onColorChange,
  onSave
}: AccountModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center px-4 pb-10 sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black">{editingAccount ? 'Rename Account' : 'New Account'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center"
          >
            X
          </button>
        </div>
        <div className="space-y-4">
          <input
            placeholder="Account name"
            value={accountForm.name}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
          />
          {!editingAccount && (
            <input
              placeholder="Starting balance"
              type="number"
              value={accountForm.balance}
              onChange={(event) => onBalanceChange(event.target.value)}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
            />
          )}
          {!editingAccount ? (
            <input
              placeholder="Last 4 digits"
              value={accountForm.lastFour}
              onChange={(event) => onLastFourChange(event.target.value)}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
            />
          ) : (
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Last four: {accountForm.lastFour}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {accountColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`h-8 w-8 rounded-full ${color} ${accountForm.color === color ? 'ring-2 ring-black' : ''}`}
              />
            ))}
          </div>
          {accountSaveError && <p className="text-xs font-semibold text-rose-500">{accountSaveError}</p>}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={accountSaving}
          className="mt-6 w-full rounded-2xl bg-black py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
        >
          {accountSaving ? 'Saving...' : (editingAccount ? 'Save Account' : 'Create Account')}
        </button>
      </div>
    </div>
  );
};

export default AccountModal;
