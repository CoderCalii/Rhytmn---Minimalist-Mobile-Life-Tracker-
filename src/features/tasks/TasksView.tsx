import type { RefObject } from 'react';
import { CheckCircle2, Circle, Clock, Plus, Search } from 'lucide-react';
import { INITIAL_PAGES } from '../../mockData';
import type { Page } from '../../types';
import { getTodoCompleted } from '../../utils/todo';

interface TasksViewProps {
  pages: Page[];
  isAddingInline: boolean;
  inlineValue: string;
  inlineInputRef: RefObject<HTMLInputElement | null>;
  onInlineChange: (value: string) => void;
  onStartInline: () => void;
  onCancelInline: () => void;
  onSubmitInline: () => void;
  onToggleTodo: (pageId: string, blockId: string) => void;
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
  onSubmitInline,
  onToggleTodo,
  onSelectPage
}: TasksViewProps) => {
  const allTodos = pages.flatMap(page => page.blocks
    .filter(block => block.type === 'todo')
    .map(block => ({
      ...block,
      pageId: page.id,
      completed: getTodoCompleted(block.content)
    }))
  );

  const allNotes = pages.filter(page => {
    const category = page.category?.toLowerCase();
    return category === 'note' || page.blocks.some(block => block.type === 'text');
  });

  return (
    <div className="p-6 pb-32 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight">To-Do</h1>
        <button className="p-2 bg-gray-100 rounded-full text-gray-500">
          <Search size={20} />
        </button>
      </div>
      
      <div className="space-y-3 mb-10">
        <div className="flex items-center justify-between px-1 mb-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Current List</h2>
          <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
            {allTodos.filter(todo => !todo.completed).length} items
          </span>
        </div>

        {allTodos.map((todo) => (
          <div 
            key={todo.id}
            onClick={() => onToggleTodo(todo.pageId, todo.id)}
            className="flex items-center p-5 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className={`mr-4 ${todo.completed ? 'text-green-500' : 'text-gray-300'}`}>
              {todo.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </div>
            <span className={`text-lg font-medium ${todo.completed ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
              {todo.content.text}
            </span>
          </div>
        ))}
        
        <div className="mt-2">
          {isAddingInline ? (
            <div className="flex items-center p-5 bg-white rounded-2xl border-2 border-black/10 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="mr-4 text-gray-300"><Circle size={24} /></div>
              <input
                ref={inlineInputRef}
                className="flex-1 text-lg font-medium outline-none border-none p-0 focus:ring-0"
                placeholder="What needs to be done?"
                value={inlineValue}
                onChange={(event) => onInlineChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSubmitInline();
                  if (event.key === 'Escape') onCancelInline();
                }}
                onBlur={() => { if (!inlineValue.trim()) onCancelInline(); }}
              />
            </div>
          ) : (
            <button 
              onClick={onStartInline}
              className="w-full flex items-center p-5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 transition-all active:scale-[0.99]"
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
