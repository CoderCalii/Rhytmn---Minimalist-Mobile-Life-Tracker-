import { useState } from 'react';
import { Check, X, ArrowUpRight, ArrowDownLeft, Target, Calendar, Tag, MessageSquare } from 'lucide-react';
import type { FinanceGoal } from '../../types';

interface FinanceCaptureModalProps {
  onClose: () => void;
  goals?: FinanceGoal[];
  initialGoalId: string | null;
}
const FinanceCaptureModal = ({ onClose, goals = [], initialGoalId }: FinanceCaptureModalProps) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // 'income' | 'expense' | 'goal'
  const [selectedGoal, setSelectedGoal] = useState(initialGoalId);
  const [category, setCategory] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const transactionTypes = [
    { id: 'income', label: 'Income', icon: <ArrowDownLeft size={14} />, color: 'text-emerald-500', categories: ['Salary', 'Gift', 'Investment', 'Refund'] },
    { id: 'expense', label: 'Expense', icon: <ArrowUpRight size={14} />, color: 'text-rose-500', categories: ['Food', 'Transport', 'Shopping', 'Bills'] },
    { id: 'goal', label: 'Goal', icon: <Target size={14} />, color: 'text-purple-600', categories: [] },
  ];

  const currentTypeData = transactionTypes.find(t => t.id === type);

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-10 sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Today, 12:45 PM</span>
            </div>
            <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Type Selector */}
          <div className="mb-8 p-1 bg-slate-100 rounded-[2rem] flex items-center">
            {transactionTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setType(t.id);
                  setCategory('');
                }}
                className={`flex-1 py-3.5 rounded-[1.7rem] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                  type === t.id ? 'bg-white shadow-sm text-black scale-[1.02]' : 'text-slate-400'
                }`}
              >
                <span className={type === t.id ? t.color : ''}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          
          {/* Amount Display */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center text-7xl font-black tracking-tighter">
              <span className={`text-3xl mr-1 self-start mt-4 opacity-20 ${currentTypeData.color}`}>$</span>
              <input 
                type="number" 
                autoFocus 
                placeholder="0" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-48 bg-transparent outline-none border-none text-center placeholder:text-slate-100" 
              />
            </div>
          </div>

          {/* Contextual Sections */}
          <div className="space-y-6 mb-8">
            {/* Category Chips - Only for Income/Expense */}
            {type !== 'goal' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Tag size={10} /> Category
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentTypeData.categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-[10px] font-bold transition-all ${
                        category === cat 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Goal Selector - Only for Goal (Purple Themed) */}
            {type === 'goal' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black text-slate-300 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Target size={10} className="text-purple-600" /> Destination
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {goals.length > 0 ? goals.map((goal) => (
                    <button 
                      key={goal.id} 
                      onClick={() => setSelectedGoal(goal.id)} 
                      className={`p-4 rounded-2xl border-2 text-[10px] font-black transition-all flex items-center justify-between ${
                        selectedGoal === goal.id ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-50 bg-slate-50 text-slate-400'
                      }`}
                    >
                      <span className="truncate">{goal.name}</span>
                      {selectedGoal === goal.id && <Check size={12} />}
                    </button>
                  )) : (
                    <div className="col-span-2 py-4 px-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-400 text-center italic">
                      No active goals found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Note Toggle */}
            <div>
              <button 
                onClick={() => setShowNotes(!showNotes)}
                className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-slate-500"
              >
                <MessageSquare size={10} /> {showNotes ? 'Remove Note' : 'Add Note'}
              </button>
              {showNotes && (
                <textarea 
                  placeholder="What was this for?"
                  className="w-full mt-3 p-4 bg-slate-50 rounded-3xl text-sm outline-none border-none placeholder:text-slate-300 min-h-[80px] animate-in zoom-in-95 duration-200"
                />
              )}
            </div>
          </div>

          <button 
            onClick={onClose} 
            className={`w-full py-5 rounded-[2rem] font-black text-base active:scale-95 transition-all shadow-xl ${
              type === 'income' ? 'bg-emerald-500 text-white shadow-emerald-200/50' :
              type === 'expense' ? 'bg-black text-white shadow-slate-200/50' :
              'bg-purple-600 text-white shadow-purple-200/50'
            }`}
          >
            Confirm Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceCaptureModal;
