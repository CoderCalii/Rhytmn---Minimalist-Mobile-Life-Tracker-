import { useState } from 'react';
import { ArrowRight, Clock, X } from 'lucide-react';
import { sanitizeText } from '../../utils/sanitize';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface HabitCaptureModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

const HabitCaptureModal = ({ onClose, onSaved }: HabitCaptureModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Daily');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 bg-white z-[150] flex flex-col">
      <div className="p-6 flex justify-between items-center">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Rhythm</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-8 pt-8">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">What do you want to build?</label>
        <input 
          autoFocus
          type="text" 
          placeholder="Exercise, Meditation, etc."
          className="w-full text-4xl font-bold outline-none border-b-2 border-gray-100 pb-4 placeholder:text-gray-100"
          value={name}
          onChange={(event) => setName(sanitizeText(event.target.value))}
        />

        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-4 text-gray-400">
            <Clock size={20} />
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest block mb-2">Frequency</span>
              <div className="flex gap-2">
                {['Daily', '3x Week', 'Weekly'].map((frequency) => (
                  <button 
                    key={frequency}
                    onClick={() => setGoal(frequency)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${goal === frequency ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}
                  >
                    {frequency}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <button 
          onClick={async () => {
            if (!user) {
              setError('Sign in to create a habit.');
              return;
            }
            const safeName = sanitizeText(name).trim();
            if (!safeName) return;
            const safeGoal = sanitizeText(goal).trim();

            setIsSaving(true);
            setError(null);

            const { error: insertError } = await supabase
              .from('habits')
              .insert({ user_id: user.id, title: safeName, frequency: safeGoal });

            if (insertError) {
              setIsSaving(false);
              setError('Failed to save habit.');
              return;
            }

            setIsSaving(false);
            onSaved?.();
            onClose();
          }}
          disabled={!name || isSaving || !user}
          className="w-full bg-black text-white py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-20"
        >
          {isSaving ? 'Saving...' : 'Create Habit'} <ArrowRight size={20} />
        </button>
        {error && <p className="mt-3 text-xs font-semibold text-rose-500 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default HabitCaptureModal;
