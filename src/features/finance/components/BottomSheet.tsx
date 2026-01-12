import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type BottomSheetProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const BottomSheet = ({ isOpen, title, onClose, children }: BottomSheetProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center px-4 pb-10 sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-[3rem] bg-white p-7 shadow-2xl animate-in slide-in-from-bottom-12 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
