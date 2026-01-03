import { useState } from 'react';
import { FileText, Tag, X } from 'lucide-react';

interface CaptureModalProps {
  onClose: () => void;
  onSave: (title: string, body: string, category: string) => void;
}

const CaptureModal = ({ onClose, onSave }: CaptureModalProps) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Idea');

  const categories = ['Idea', 'Meeting', 'Personal', 'Urgent'];

  return (
    <div className="absolute inset-0 bg-white z-[120] flex flex-col">
      <div className="p-6 flex justify-between items-center border-b border-gray-50">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Note</span>
        <button 
          onClick={() => { onSave(title || 'Untitled Note', body, category); onClose(); }} 
          disabled={!body}
          className="text-xs font-bold text-black disabled:opacity-20 uppercase tracking-widest px-4 py-2"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8">
        <input 
          autoFocus 
          placeholder="Title" 
          className="w-full text-3xl font-bold border-none outline-none mb-4 placeholder:text-gray-200" 
          value={title} 
          onChange={(event) => setTitle(event.target.value)} 
        />
        
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar py-1">
          <Tag size={14} className="text-gray-300 shrink-0" />
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap
                ${category === cat ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        <textarea 
          placeholder="Start writing..." 
          className="w-full h-full text-lg font-medium border-none outline-none resize-none bg-transparent leading-relaxed" 
          value={body} 
          onChange={(event) => setBody(event.target.value)} 
        />
      </div>

      <div className="p-6 bg-gray-50 flex items-center gap-4">
        <div className="p-2 bg-white rounded-lg border border-gray-100">
          <FileText size={18} className="text-gray-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saved to</p>
          <p className="text-xs font-bold text-black">My System / Notes</p>
        </div>
      </div>
    </div>
  );
};

export default CaptureModal;
