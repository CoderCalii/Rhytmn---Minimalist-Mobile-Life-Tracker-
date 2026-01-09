import { Plus, Zap } from 'lucide-react';

interface ZapCaptureInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const ZapCaptureInput = ({ value, onChange, onSubmit }: ZapCaptureInputProps) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
      <Zap size={16} className="text-gray-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Zap Capture"
        className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
      />
      <button
        onClick={onSubmit}
        className="rounded-full bg-black p-2 text-white hover:bg-gray-800 transition-colors"
        aria-label="Add capture"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

export default ZapCaptureInput;
