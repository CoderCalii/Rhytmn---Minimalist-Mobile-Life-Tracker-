import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  CheckSquare, 
  Activity, 
  CreditCard, 
  Plus, 
  MoreHorizontal, 
  ChevronLeft, 
  CheckCircle2,
  X,
  Circle,
  FileText,
  Clock,
  Search,
  Flame,
  Check
} from 'lucide-react';

// --- Types ---

type ViewState = 'home' | 'tasks' | 'habits' | 'finance' | 'page_detail';

interface Block {
  id: string;
  type: 'text' | 'heading' | 'todo' | 'habit_widget' | 'finance_widget';
  content: any;
}

interface Page {
  id: string;
  title: string;
  icon: string;
  category?: string;
  blocks: Block[];
  updatedAt: string;
}

interface FinanceGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
}

interface Habit {
  id: string;
  name: string;
  meta: string;
  color: string;
  data: number[];
}

// --- Mock Data ---

const INITIAL_PAGES: Page[] = [
  {
    id: 'p1',
    title: 'Daily Focus',
    icon: '⚡',
    category: 'Daily',
    updatedAt: '2m ago',
    blocks: [
      { id: 'b1', type: 'heading', content: "Today's Priorities" },
      { id: 'b2', type: 'todo', content: { text: 'Complete quarterly report', completed: true } },
      { id: 'b3', type: 'todo', content: { text: 'Design review with Sarah', completed: false } },
    ]
  },
  {
    id: 'p2',
    title: 'Weekly Review',
    icon: '📅',
    category: 'Review',
    updatedAt: '1h ago',
    blocks: [
      { id: 'b4', type: 'todo', content: { text: 'Review team goals', completed: false } },
    ]
  },
  {
    id: 'p3',
    title: 'Quick Brainstorm',
    icon: '💡',
    category: 'Note',
    updatedAt: '3h ago',
    blocks: [
      { id: 'b-n1', type: 'text', content: 'Need to look into the new API documentation for the project. Also check if the team is free on Friday.' }
    ]
  },
  {
    id: 'p4',
    title: 'Healthy Habits',
    icon: '🥗',
    category: 'Personal',
    updatedAt: 'Yesterday',
    blocks: [
      { id: 'b5', type: 'habit_widget', content: {} }
    ]
  }
];

const INITIAL_HABITS: Habit[] = [
  { id: 'h1', name: 'Morning Meditation', meta: '10 mins', color: 'bg-orange-400', data: [1, 1, 0, 1, 1, 1, 1] },
  { id: 'h2', name: 'Reading', meta: '20 pages', color: 'bg-blue-400', data: [1, 0, 1, 1, 0, 0, 1] },
];

const INITIAL_FINANCE_GOALS: FinanceGoal[] = [
  { id: 'f1', title: 'Japan Trip 2024', target: 5000, current: 3250, deadline: 'Oct 2024' },
];

// --- Components ---

const CaptureModal = ({ onClose, onSave }: { onClose: () => void, onSave: (text: string) => void }) => {
  const [text, setText] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Quick Note</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <textarea 
          autoFocus
          className="w-full h-32 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black resize-none mb-4 text-lg"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button 
          onClick={() => { if(text) { onSave(text); onClose(); } }}
          className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg"
        >
          Save Note
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [habits] = useState<Habit[]>(INITIAL_HABITS);
  const [goals] = useState<FinanceGoal[]>(INITIAL_FINANCE_GOALS);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  
  const [showCapture, setShowCapture] = useState(false);

  // Inline Task State
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineValue, setInlineValue] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingInline && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [isAddingInline]);

  const handleQuickNote = (text: string) => {
    const newPage: Page = {
      id: Date.now().toString(),
      title: text.length > 20 ? text.slice(0, 20) + '...' : text,
      icon: '📝',
      category: 'Note',
      updatedAt: 'Just now',
      blocks: [{ id: Math.random().toString(), type: 'text', content: text }]
    };
    setPages([newPage, ...pages]);
  };

  const toggleTodo = (pageId: string, blockId: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        blocks: p.blocks.map(b => {
          if (b.id !== blockId) return b;
          return { ...b, content: { ...b.content, completed: !b.content.completed } };
        })
      };
    }));
  };

  const handleAddInlineTodo = () => {
    if (!inlineValue.trim()) {
      setIsAddingInline(false);
      return;
    }

    const firstDailyPage = pages.find(p => p.category === 'Daily') || pages[0];
    
    const newBlock: Block = {
      id: Math.random().toString(),
      type: 'todo',
      content: { text: inlineValue, completed: false }
    };

    setPages(prev => prev.map(p => {
      if (p.id !== firstDailyPage.id) return p;
      return { ...p, blocks: [...p.blocks, newBlock] };
    }));

    setInlineValue('');
  };

  const renderTasks = () => {
    // 1. Get all Todos
    const allTodos = pages.flatMap(p => p.blocks.filter(b => b.type === 'todo').map(b => ({ ...b, pageId: p.id })));
    
    // 2. Get all "Notes" (Pages that aren't primarily checklists)
    const allNotes = pages.filter(p => p.category === 'Note' || p.blocks.some(b => b.type === 'text'));

    return (
      <div className="p-6 pb-32 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black tracking-tight">To-Do</h1>
          <button className="p-2 bg-gray-100 rounded-full text-gray-500">
            <Search size={20} />
          </button>
        </div>
        
        {/* ACTIVE TASKS SECTION */}
        <div className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Current List</h2>
            <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
              {allTodos.filter(t => !t.content.completed).length} items
            </span>
          </div>

          {allTodos.map((todo) => (
            <div 
              key={todo.id}
              onClick={() => toggleTodo(todo.pageId, todo.id)}
              className="flex items-center p-5 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className={`mr-4 ${todo.content.completed ? 'text-green-500' : 'text-gray-300'}`}>
                {todo.content.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <span className={`text-lg font-medium ${todo.content.completed ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
                {todo.content.text}
              </span>
            </div>
          ))}
          
          {/* SEAMLESS INLINE ADDITION */}
          <div className="mt-2">
            {isAddingInline ? (
              <div className="flex items-center p-5 bg-white rounded-2xl border-2 border-black/10 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="mr-4 text-gray-300"><Circle size={24} /></div>
                <input
                  ref={inlineInputRef}
                  className="flex-1 text-lg font-medium outline-none border-none p-0 focus:ring-0"
                  placeholder="What needs to be done?"
                  value={inlineValue}
                  onChange={(e) => setInlineValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddInlineTodo();
                    if (e.key === 'Escape') setIsAddingInline(false);
                  }}
                  onBlur={() => { if (!inlineValue.trim()) setIsAddingInline(false); }}
                />
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingInline(true)}
                className="w-full flex items-center p-5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 transition-all active:scale-[0.99]"
              >
                <Plus size={20} className="mr-3" />
                <span className="font-bold">Add something new to do here</span>
              </button>
            )}
          </div>
        </div>

        {/* PAST NOTES / CAPTURES SECTION */}
        <div className="mt-12">
          <div className="flex items-center justify-between px-1 mb-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Past Notes & Brainstorms</h2>
            <button className="text-[10px] font-bold text-gray-400">View All</button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {allNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => { setSelectedPage(note); setView('page_detail'); }}
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
                {note.blocks.filter(b => b.type === 'text').map(b => (
                  <p key={b.id} className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {b.content}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="p-6 pb-32">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Focus</h1>
          <p className="text-gray-400 font-medium italic">Your creative hub</p>
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        {pages.filter(p => p.category === 'Daily' || p.category === 'Review').map(page => (
          <div 
            key={page.id} 
            onClick={() => { setSelectedPage(page); setView('page_detail'); }}
            className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <div className="text-3xl mb-3">{page.icon}</div>
            <h3 className="font-bold text-lg mb-1 leading-tight">{page.title}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{page.category}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Workspace</h2>
        <div className="space-y-3">
          {pages.filter(p => p.category !== 'Daily' && p.category !== 'Review').map(page => (
            <div 
              key={page.id} 
              onClick={() => { setSelectedPage(page); setView('page_detail'); }}
              className="flex items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl mr-4">{page.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold">{page.title}</h4>
                <p className="text-xs text-gray-400">{page.updatedAt}</p>
              </div>
              <ChevronLeft size={18} className="rotate-180 text-gray-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPageDetail = () => {
    if (!selectedPage) return null;
    return (
      <div className="min-h-screen bg-white">
        <div className="p-6 flex items-center gap-4">
          <button onClick={() => setView('home')} className="p-2 bg-gray-50 rounded-full"><ChevronLeft size={24} /></button>
          <div className="text-3xl">{selectedPage.icon}</div>
          <h1 className="text-2xl font-black">{selectedPage.title}</h1>
        </div>
        <div className="p-6 space-y-6">
          {selectedPage.blocks.map(block => (
            <div key={block.id}>
              {block.type === 'heading' && <h2 className="text-xl font-bold mt-4">{block.content}</h2>}
              {block.type === 'text' && <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">{block.content}</p>}
              {block.type === 'todo' && (
                <div 
                  onClick={() => toggleTodo(selectedPage.id, block.id)}
                  className="flex items-center py-3 border-b border-gray-50 cursor-pointer"
                >
                  <div className={`mr-4 ${block.content.completed ? 'text-green-500' : 'text-gray-300'}`}>
                    {block.content.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                  <span className={block.content.completed ? 'text-gray-300 line-through text-lg' : 'text-gray-800 text-lg'}>{block.content.text}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#FDFDFD] font-sans text-black relative flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {view === 'home' && renderHome()}
        {view === 'tasks' && renderTasks()}
        {view === 'page_detail' && renderPageDetail()}
        {view === 'habits' && <div className="p-6">Habits View (Mock)</div>}
        {view === 'finance' && <div className="p-6">Finance View (Mock)</div>}
      </div>

      {/* Navigation & Controls */}
      {view !== 'page_detail' && (
        <>
          <button 
            onClick={() => {
              if (view === 'tasks') setIsAddingInline(true);
              else setShowCapture(true);
            }}
            className="fixed bottom-28 right-6 w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl z-[90] active:scale-95 transition-transform"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>

          <div className="fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-md border border-gray-100 rounded-full shadow-lg flex items-center justify-around px-4 z-[90]">
            <button onClick={() => setView('home')} className={view === 'home' ? 'text-black' : 'text-gray-300'}><Home size={24} /></button>
            <button onClick={() => setView('tasks')} className={view === 'tasks' ? 'text-black' : 'text-gray-300'}><CheckSquare size={24} /></button>
            <div className="w-12" />
            <button onClick={() => setView('habits')} className={view === 'habits' ? 'text-black' : 'text-gray-300'}><Activity size={24} /></button>
            <button onClick={() => setView('finance')} className={view === 'finance' ? 'text-black' : 'text-gray-300'}><CreditCard size={24} /></button>
          </div>
        </>
      )}

      {showCapture && <CaptureModal onClose={() => setShowCapture(false)} onSave={handleQuickNote} />}
    </div>
  );
}