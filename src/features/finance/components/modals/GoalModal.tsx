type GoalFormState = {
  name: string;
  target: string;
  current: string;
  color: string;
};

type GoalModalProps = {
  isOpen: boolean;
  goalForm: GoalFormState;
  goalColors: string[];
  goalSaveError: string | null;
  goalSaving: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onCurrentChange: (value: string) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
};

const GoalModal = ({
  isOpen,
  goalForm,
  goalColors,
  goalSaveError,
  goalSaving,
  onClose,
  onNameChange,
  onTargetChange,
  onCurrentChange,
  onColorChange,
  onSave
}: GoalModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center px-4 pb-10 sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black">New Goal</h2>
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
            placeholder="Goal name"
            value={goalForm.name}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
          />
          <input
            placeholder="Target amount"
            type="number"
            value={goalForm.target}
            onChange={(event) => onTargetChange(event.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
          />
          <input
            placeholder="Current amount (optional)"
            type="number"
            value={goalForm.current}
            onChange={(event) => onCurrentChange(event.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {goalColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onColorChange(color)}
                className={`h-8 w-8 rounded-full ${color} ${goalForm.color === color ? 'ring-2 ring-black' : ''}`}
              />
            ))}
          </div>
          {goalSaveError && <p className="text-xs font-semibold text-rose-500">{goalSaveError}</p>}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={goalSaving}
          className="mt-6 w-full rounded-2xl bg-black py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
        >
          {goalSaving ? 'Saving...' : 'Create Goal'}
        </button>
      </div>
    </div>
  );
};

export default GoalModal;
