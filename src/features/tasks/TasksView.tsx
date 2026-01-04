import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { CheckCircle2, Circle, Clock, Plus, Search } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { INITIAL_PAGES } from '../../mockData';
import type { Page } from '../../types';
import { sanitizeText } from '../../utils/sanitize';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface TaskRow {
  id: string;
  title: string;
  completed: boolean;
  created_at?: string | null;
}

interface TasksViewProps {
  pages: Page[];
  isAddingInline: boolean;
  inlineValue: string;
  inlineInputRef: RefObject<HTMLInputElement | null>;
  onInlineChange: (value: string) => void;
  onStartInline: () => void;
  onCancelInline: () => void;
  onInlineAdded?: (title: string) => void;
  onSelectPage: (pageId: string) => void;
}

const TasksView = ({
  pages = INITIAL_PAGES,
  isAddingInline,
  inlineValue,
  inlineInputRef,
  onInlineChange,
  onStartInline,
  onCancelInline,
  onInlineAdded,
  onSelectPage
}: TasksViewProps) => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    supabase
      .from('tasks')
      .select('id, title, completed, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (!isMounted) return;
        if (fetchError) {
          setError('Failed to load tasks.');
          setTasks([]);
        } else {
          setTasks((data ?? []) as TaskRow[]);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const remainingCount = tasks.filter((task) => !task.completed).length;

  const allNotes = pages.filter(page => {
    const category = page.category?.toLowerCase();
    return category === 'note' || page.blocks.some(block => block.type === 'text');
  });

  const handleAddInline = async () => {
    if (!user) return;
    const trimmed = sanitizeText(inlineValue).trim();
    if (!trimmed) {
      onCancelInline();
      return;
    }

    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, title: trimmed, completed: false })
      .select('id, title, completed, created_at')
      .single();

    if (!insertError && data) {
      setTasks((prev) => [data as TaskRow, ...prev]);
      onInlineChange('');
      onInlineAdded?.(trimmed);
    }
  };

  const handleToggleTask = async (task: TaskRow) => {
    if (!user) return;
    const nextCompleted = !task.completed;
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ completed: nextCompleted })
      .eq('id', task.id);

    if (!updateError) {
      setTasks((prev) => prev.map((item) => (
        item.id === task.id ? { ...item, completed: nextCompleted } : item
      )));
    }
  };

  return (
    <div className="p-6 pb-32 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight">To-Do</h1>
        <div className="flex items-center gap-3">
          <BrandLogo className="h-8 w-8" />
          <button className="p-2 bg-gray-100 rounded-full text-gray-500">
            <Search size={20} />
          </button>
        </div>
      </div>
      
      <div className="space-y-3 mb-10">
        <div className="flex items-center justify-between px-1 mb-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Current List</h2>
          <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
            {remainingCount} items
          </span>
        </div>

        {authLoading || loading ? (
          <div className="p-5 text-sm text-gray-400">Loading tasks...</div>
        ) : !user ? (
          <div className="p-5 text-sm text-gray-400">Sign in to view your tasks.</div>
        ) : error ? (
          <div className="p-5 text-sm text-rose-500">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="p-5 text-sm text-gray-400">No tasks yet.</div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => handleToggleTask(task)}
              className="flex items-center p-5 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className={`mr-4 ${task.completed ? 'text-green-500' : 'text-gray-300'}`}>
                {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <span className={`text-lg font-medium ${task.completed ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
                {task.title}
              </span>
            </div>
          ))
        )}
        
        <div className="mt-2">
          {isAddingInline ? (
            <div className="flex items-center p-5 bg-white rounded-2xl border-2 border-black/10 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="mr-4 text-gray-300"><Circle size={24} /></div>
              <input
                ref={inlineInputRef}
                className="flex-1 text-lg font-medium outline-none border-none p-0 focus:ring-0"
                placeholder={user ? 'What needs to be done?' : 'Sign in to add tasks'}
                value={inlineValue}
                onChange={(event) => onInlineChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleAddInline();
                  if (event.key === 'Escape') onCancelInline();
                }}
                onBlur={() => { if (!inlineValue.trim()) onCancelInline(); }}
                disabled={!user}
              />
            </div>
          ) : (
            <button 
              onClick={onStartInline}
              className="w-full flex items-center p-5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 transition-all active:scale-[0.99]"
              disabled={!user}
            >
              <Plus size={20} className="mr-3" />
              <span className="font-bold">Add something new to do here</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between px-1 mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Past Notes & Brainstorms</h2>
          <button className="text-[10px] font-bold text-gray-400">View All</button>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {allNotes.map(note => (
            <div 
              key={note.id}
              onClick={() => onSelectPage(note.id)}
              className="p-5 bg-gray-50 rounded-2xl border border-gray-100/50 hover:bg-gray-100 transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{note.icon}</span>
                  <h3 className="font-bold text-gray-800">{note.title}</h3>
                </div>
                <span className="text-[10px] text-gray-400 font-medium flex items-center">
                  <Clock size={10} className="mr-1" /> {note.updatedAt}
                </span>
              </div>
              {note.blocks.filter(block => block.type === 'text').map(block => (
                <p key={block.id} className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {block.content}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TasksView;
