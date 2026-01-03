import { useEffect, useRef, useState } from 'react';
import { 
  Activity, 
  CheckSquare, 
  CreditCard, 
  Home, 
  Plus
} from 'lucide-react';
import CaptureModal from './features/tasks/CaptureModal';
import FinanceCaptureModal from './features/finance/FinanceCaptureModal';
import HabitCaptureModal from './features/habits/HabitCaptureModal';
import FinanceView from './features/finance/FinanceView';
import HabitsView from './features/habits/HabitsView';
import HomeView from './features/home/HomeView';
import PageDetailView from './features/page_detail/PageDetailView';
import TasksView from './features/tasks/TasksView';
import { INITIAL_ACCOUNTS, INITIAL_GOALS, INITIAL_HABITS, INITIAL_PAGES, INITIAL_TRANSACTIONS } from './mockData';
import type { Block, FinanceGoal, Habit, Page } from './types';
import { getTodoCompleted } from './utils/todo';

// --- Types ---

type ViewState = 'home' | 'tasks' | 'habits' | 'finance' | 'page_detail';

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [goals] = useState<FinanceGoal[]>(INITIAL_GOALS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [zapInput, setZapInput] = useState('');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [showHabitCapture, setShowHabitCapture] = useState(false);
  const [showFinanceCapture, setShowFinanceCapture] = useState(false);
  const [financeInitialGoalId, setFinanceInitialGoalId] = useState<string | null>(null);

  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineValue, setInlineValue] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingInline && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [isAddingInline]);

  
  const activePage = activePageId ? pages.find(p => p.id === activePageId) : null;

  const handleQuickNote = (title: string, body: string, category: string) => {
    const newPage: Page = {
      id: Date.now().toString(),
      title,
      icon: 'ðŸ““',
      category: 'note',
      updatedAt: 'Just now',
      blocks: [
        { id: 'b-title', type: 'heading', content: title },
        { id: 'b-text', type: 'text', content: body }
      ]
    };
    setPages(prev => [newPage, ...prev]);
  };

  const toggleTodo = (pageId: string, blockId: string) => {
    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page;
      return {
        ...page,
        blocks: page.blocks.map(block => {
          if (block.id !== blockId || block.type !== 'todo') return block;
          const completed = getTodoCompleted(block.content);
          return {
            ...block,
            content: {
              ...block.content,
              completed: !completed,
              done: !completed
            }
          };
        })
      };
    }));
  };

  const handleAddInlineTodo = () => {
    const trimmed = inlineValue.trim();
    if (!trimmed) {
      setIsAddingInline(false);
      return;
    }

    const targetPage = pages.find(page => page.id === 'daily')
      || pages.find(page => page.category?.toLowerCase() === 'daily')
      || pages.find(page => page.category?.toLowerCase() === 'system')
      || pages[0];

    if (!targetPage) {
      setInlineValue('');
      setIsAddingInline(false);
      return;
    }

    const newBlock: Block = {
      id: Date.now().toString(),
      type: 'todo',
      content: { text: trimmed, completed: false, done: false }
    };

    setPages(prev => prev.map(page => {
      if (page.id !== targetPage.id) return page;
      return { ...page, blocks: [...page.blocks, newBlock] };
    }));

    setInlineValue('');
  };

  const handleHabitCapture = (h: Partial<Habit>) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: h.name || 'Untitled Habit',
      meta: h.meta || 'Daily',
      color: 'bg-black',
      data: [0,0,0,0,0,0,0],
      monthly: 0,
      yearly: 0
    };
    setHabits(prev => [newHabit, ...prev]);
  };

  const openFinanceAdd = (goalId?: string) => {
    setFinanceInitialGoalId(goalId || null);
    setShowFinanceCapture(true);
  };

  const handleMainPlusClick = () => {
    if (view === 'finance') openFinanceAdd();
    else if (view === 'habits') setShowHabitCapture(true);
    else if (view === 'tasks') setIsAddingInline(true);
    else setShowCapture(true);
  };

  const handleZapCapture = () => {
    const trimmed = zapInput.trim();
    if (!trimmed) return;
    const newPage: Page = {
      id: Date.now().toString(),
      title: trimmed,
      icon: 'âš¡',
      category: 'unprocessed',
      updatedAt: 'Just now',
      blocks: [
        { id: 'b-title', type: 'heading', content: trimmed },
        { id: 'b-text', type: 'text', content: '' }
      ]
    };
    setPages(prev => [newPage, ...prev]);
    setZapInput('');
  };

  const handleSelectPage = (pageId: string) => {
    setActivePageId(pageId);
    setView('page_detail');
  };

  const renderContent = () => {
    switch (view) {
      case 'page_detail':
        return activePage ? (
          <PageDetailView
            page={activePage}
            onBack={() => setView('home')}
            onToggleTodo={toggleTodo}
          />
        ) : (
          <HomeView
            pages={pages}
            zapInput={zapInput}
            onZapInputChange={setZapInput}
            onZapSubmit={handleZapCapture}
            onSelectPage={handleSelectPage}
          />
        );
      case 'home':
        return (
          <HomeView
            pages={pages}
            zapInput={zapInput}
            onZapInputChange={setZapInput}
            onZapSubmit={handleZapCapture}
            onSelectPage={handleSelectPage}
          />
        );
      case 'tasks':
        return (
          <TasksView
            pages={pages}
            isAddingInline={isAddingInline}
            inlineValue={inlineValue}
            inlineInputRef={inlineInputRef}
            onInlineChange={setInlineValue}
            onStartInline={() => setIsAddingInline(true)}
            onCancelInline={() => setIsAddingInline(false)}
            onSubmitInline={handleAddInlineTodo}
            onToggleTodo={toggleTodo}
            onSelectPage={handleSelectPage}
          />
        );
      case 'habits':
        return <HabitsView habits={habits} />;
      case 'finance':
        return (
          <FinanceView
            accounts={INITIAL_ACCOUNTS}
            goals={goals}
            transactions={INITIAL_TRANSACTIONS}
            onAddGoal={() => openFinanceAdd()}
          />
        );
      default:
        return (
          <HomeView
            pages={pages}
            zapInput={zapInput}
            onZapInputChange={setZapInput}
            onZapSubmit={handleZapCapture}
            onSelectPage={handleSelectPage}
          />
        );
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 p-4">
      <div className="w-[390px] h-[844px] bg-white rounded-[60px] shadow-2xl overflow-hidden border-[12px] border-black relative flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-40 bg-black rounded-b-3xl z-[110]" />
        
        {renderContent()}

        {view !== 'page_detail' && (
          <>
            <button 
              onClick={handleMainPlusClick}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-xl z-[100] active:scale-95 transition-transform"
            >
              <Plus size={32} strokeWidth={2.5} />
            </button>

            <div className="absolute bottom-6 left-6 right-6 h-16 bg-white border border-gray-100 rounded-full shadow-lg flex items-center justify-around px-4 z-[90]">
              <button onClick={() => setView('home')} className={view === 'home' ? 'text-black' : 'text-gray-300'}><Home size={24} /></button>
              <button onClick={() => setView('tasks')} className={view === 'tasks' ? 'text-black' : 'text-gray-300'}><CheckSquare size={24} /></button>
              <div className="w-12" />
              <button onClick={() => setView('habits')} className={view === 'habits' ? 'text-black' : 'text-gray-300'}><Activity size={24} /></button>
              <button onClick={() => setView('finance')} className={view === 'finance' ? 'text-black' : 'text-gray-300'}><CreditCard size={24} /></button>
            </div>
          </>
        )}

        {showCapture && <CaptureModal onClose={() => setShowCapture(false)} onSave={handleQuickNote} />}
        {showHabitCapture && <HabitCaptureModal onClose={() => setShowHabitCapture(false)} onSave={handleHabitCapture} />}
        {showFinanceCapture && <FinanceCaptureModal onClose={() => setShowFinanceCapture(false)} goals={goals} initialGoalId={financeInitialGoalId} />}
        
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-200 rounded-full z-[110]" />
      </div>
    </div>
  );
}
