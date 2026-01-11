type ActionMenuSheetProps = {
  isPinned: boolean;
  onEdit: () => void;
  onPinToggle: () => void;
  onHide: () => void;
  onInsights: () => void;
};

const ActionMenuSheet = ({ isPinned, onEdit, onPinToggle, onHide, onInsights }: ActionMenuSheetProps) => {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onEdit}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-slate-300"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onPinToggle}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-slate-300"
      >
        {isPinned ? 'Unpin' : 'Pin'}
      </button>
      <button
        type="button"
        onClick={onHide}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-slate-300"
      >
        Hide from dashboard
      </button>
      <button
        type="button"
        onClick={onInsights}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-slate-300"
      >
        Insights
      </button>
    </div>
  );
};

export default ActionMenuSheet;
