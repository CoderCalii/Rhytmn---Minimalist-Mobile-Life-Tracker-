import BrandLogo from '../../../components/BrandLogo';

const FinanceHeader = () => {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="px-6 pt-12 pb-6 sticky top-0 bg-white/90 backdrop-blur-md z-[60]">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--finance-ink)]">Portfolio</h1>
          <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-widest">{today}</p>
        </div>
        <BrandLogo className="h-9 w-9" />
      </div>
    </div>
  );
};

export default FinanceHeader;
