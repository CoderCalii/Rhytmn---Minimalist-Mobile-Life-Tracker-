import type { ActivityTransaction } from '../../types';

type CategorizeSheetProps = {
  categorizeTarget: ActivityTransaction | null;
  categorySuggestions: string[];
  customCategory: string;
  onCustomCategoryChange: (value: string) => void;
  onSelectCategory: (category: string) => void;
  onSaveCustom: () => void;
};

const CategorizeSheet = ({
  categorizeTarget,
  categorySuggestions,
  customCategory,
  onCustomCategoryChange,
  onSelectCategory,
  onSaveCustom
}: CategorizeSheetProps) => {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        {categorizeTarget ? categorizeTarget.title : 'Select a category.'}
      </p>
      <div className="flex flex-wrap gap-2">
        {categorySuggestions.length === 0 && <span className="text-xs text-slate-400">No recent categories.</span>}
        {categorySuggestions.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200"
          >
            {category}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={customCategory}
          onChange={(event) => onCustomCategoryChange(event.target.value)}
          placeholder="Custom category"
          className="flex-1 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
        />
        <button
          type="button"
          onClick={onSaveCustom}
          className="rounded-2xl bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default CategorizeSheet;
