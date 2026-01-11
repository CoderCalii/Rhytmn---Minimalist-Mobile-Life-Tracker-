import { Plus } from 'lucide-react';
import type { FinanceAccount } from '../../../../types';
import { AccountCard } from '../AccountCard';
import { getAccountTextClass } from '../../utils/financeUi';

type AccountStackProps = {
  isSignedIn: boolean;
  authLoading: boolean;
  accountsLoading: boolean;
  accountsError: string | null;
  accounts: FinanceAccount[];
  activeAccountIndex: number;
  currencyCode: 'USD' | 'PHP';
  onCycleAccount: () => void;
  onAddAccount: () => void;
  onEditAccount: (account: FinanceAccount) => void;
};

const AccountStack = ({
  isSignedIn,
  authLoading,
  accountsLoading,
  accountsError,
  accounts,
  activeAccountIndex,
  currencyCode,
  onCycleAccount,
  onAddAccount,
  onEditAccount
}: AccountStackProps) => {
  const getCardStyle = (index: number) => {
    const diff = (index - activeAccountIndex + accounts.length) % accounts.length;
    if (diff === 0) return { transform: 'translateY(0) scale(1)', zIndex: 30, opacity: 1 };
    if (diff === 1) return { transform: 'translateY(16px) scale(0.95)', zIndex: 20, opacity: 0.6 };
    return { transform: 'translateY(32px) scale(0.90)', zIndex: 10, opacity: 0.3 };
  };

  return (
    <>
      <section className="relative h-60 cursor-pointer mb-4" onClick={onCycleAccount}>
        {authLoading || accountsLoading ? (
          <div className="absolute inset-0 rounded-[2.5rem] bg-gray-50 animate-pulse" />
        ) : !isSignedIn ? (
          <div className="absolute inset-0 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-sm text-gray-400">
            Sign in to view accounts.
          </div>
        ) : accountsError ? (
          <div className="absolute inset-0 rounded-[2.5rem] bg-rose-50 flex items-center justify-center text-sm text-rose-500">
            {accountsError}
          </div>
        ) : accounts.length === 0 ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddAccount();
            }}
            className="absolute inset-0 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-gray-400 flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Add Account</span>
          </button>
        ) : (
          accounts.map((account, index) => (
            <AccountCard
              key={account.id}
              account={account}
              style={getCardStyle(index)}
              textClassName={getAccountTextClass(account.color)}
              isActive={index === activeAccountIndex}
              onEdit={onEditAccount}
              currencyCode={currencyCode}
            />
          ))
        )}
      </section>

      {isSignedIn && accounts.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAddAccount}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-black"
          >
            Add Account
          </button>
        </div>
      )}
    </>
  );
};

export default AccountStack;
