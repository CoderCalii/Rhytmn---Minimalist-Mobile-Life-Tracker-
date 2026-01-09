import { ArrowLeft } from 'lucide-react';

type CurrencyCode = 'USD' | 'PHP';

interface SettingsViewProps {
  currencyCode: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onBack: () => void;
}

const SettingsView = ({ currencyCode, onCurrencyChange, onBack }: SettingsViewProps) => {
  return (
    <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-white">
      <div className="px-6 pt-12 pb-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-10 w-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">Settings</h1>
            <p className="text-gray-400 text-sm font-medium tracking-wide">Preferences</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">Finance</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Currency</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(['USD', 'PHP'] as CurrencyCode[]).map((currency) => (
              <button
                key={currency}
                type="button"
                onClick={() => onCurrencyChange(currency)}
                className={`rounded-2xl px-4 py-4 text-left text-sm font-semibold transition ${
                  currencyCode === currency
                    ? 'bg-black text-white shadow-md'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <div className="text-xs uppercase tracking-widest opacity-70">
                  {currency === 'USD' ? 'United States' : 'Philippines'}
                </div>
                <div className="mt-1 text-lg font-bold">{currency}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            This changes how Finance amounts are displayed.
          </p>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
