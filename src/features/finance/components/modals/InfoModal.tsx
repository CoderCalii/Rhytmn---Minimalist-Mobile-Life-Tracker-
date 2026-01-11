type InfoModalState = {
  title: string;
  description: string;
};

type InfoModalProps = {
  isOpen: boolean;
  info: InfoModalState | null;
  onClose: () => void;
};

const InfoModal = ({ isOpen, info, onClose }: InfoModalProps) => {
  if (!isOpen || !info) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-10 sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-[3rem] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">{info.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center"
          >
            X
          </button>
        </div>
        <p className="text-sm text-slate-500">{info.description}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-black py-3 text-xs font-bold uppercase tracking-widest text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default InfoModal;
