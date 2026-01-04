import type { CSSProperties } from 'react';
import { Pencil, Wallet } from 'lucide-react';
import type { FinanceAccount } from '../../../types';

type AccountCardProps = {
  account: FinanceAccount;
  textClassName: string;
  style?: CSSProperties;
  isActive?: boolean;
  onEdit?: (account: FinanceAccount) => void;
};

export function AccountCard({ account, textClassName, style, isActive = false, onEdit }: AccountCardProps) {
  return (
    <div
      style={style}
      className={`absolute inset-0 p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 ${account.color} ${textClassName} flex flex-col justify-between`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] opacity-60 font-black uppercase tracking-[0.2em]">{account.name}</p>
          <h2 className="text-3xl font-black mt-2 tracking-tighter">
            ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && isActive && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(account);
              }}
              className="p-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors"
            >
              <Pencil size={16} />
            </button>
          )}
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
            <Wallet size={20} />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-end">
        <p className="font-mono tracking-[0.3em] text-[10px] opacity-50 underline decoration-2 underline-offset-4 decoration-white/20">**** {account.lastFour}</p>
        <div className="h-8 w-12 bg-white/10 rounded-lg border border-white/20"></div>
      </div>
    </div>
  );
}
