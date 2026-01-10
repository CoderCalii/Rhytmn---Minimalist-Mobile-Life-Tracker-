import { useEffect, useRef, useState } from 'react';
import { 
  Activity, 
  CheckSquare, 
  CreditCard, 
  Home, 
  Plus
} from 'lucide-react';
import CaptureModal from './features/tasks/components/CaptureModal';
import FinanceCaptureModal from './features/finance/FinanceCaptureModal';
import HabitCaptureModal from './features/habits/HabitCaptureModal';
import FinanceView from './features/finance/FinanceView';
import HabitsView from './features/habits/HabitsView';
import HomeView from './features/home/view/HomeView';
import PageDetailView from './features/page_detail/PageDetailView';
import SettingsView from './features/settings/SettingsView';
import TasksView from './features/tasks/views/TasksView';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { INITIAL_PAGES } from './mockData';
import type { Block, Page } from './types';
import { getTodoCompleted } from './utils/todo';
import { sanitizeText } from './utils/sanitize';

// --- Types ---

type ViewState = 'home' | 'tasks' | 'habits' | 'finance' | 'page_detail' | 'settings';
type CurrencyCode = 'USD' | 'PHP';

// --- Main App ---

export default function App() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewState>('home');
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [activePageId] = useState<string | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [showHabitCapture, setShowHabitCapture] = useState(false);
  const [showFinanceCapture, setShowFinanceCapture] = useState(false);
  const [financeInitialGoalId, setFinanceInitialGoalId] = useState<string | null>(null);
  const [financeCaptureType, setFinanceCaptureType] = useState<'income' | 'expense' | 'transfer' | 'goal' | null>(null);
  const [financeFabIntent, setFinanceFabIntent] = useState<{ type: 'subscription' } | null>(null);
  const [financeFabContext, setFinanceFabContext] = useState<'portfolio' | 'activity' | 'subscriptions'>('portfolio');
  const [showFabActions, setShowFabActions] = useState(false);
  const fabPressTimeoutRef = useRef<number | null>(null);
  const fabLongPressTriggeredRef = useRef(false);
  const [habitsRefreshToken, setHabitsRefreshToken] = useState(0);
  const [financeRefreshToken, setFinanceRefreshToken] = useState(0);
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD');
  const [currencyLoaded, setCurrencyLoaded] = useState(false);

  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineValue, setInlineValue] = useState('');
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isAddingInline && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [isAddingInline]);

  useEffect(() => {
    if (!user) {
      setCurrencyCode('USD');
      setCurrencyLoaded(false);
      return;
    }

    let isMounted = true;
    setCurrencyLoaded(false);

    supabase
      .from('user_settings')
      .select('currency_code')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setCurrencyCode('USD');
        } else {
          setCurrencyCode(data?.currency_code === 'PHP' ? 'PHP' : 'USD');
        }
        setCurrencyLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !currencyLoaded) return;
    supabase
      .from('user_settings')
      .upsert({ user_id: user.id, currency_code: currencyCode }, { onConflict: 'user_id' });
  }, [user, currencyCode, currencyLoaded]);

  
  const activePage = activePageId ? pages.find(p => p.id === activePageId) : null;

  const handleQuickNote = (title: string, body: string, category: string) => {
    const safeTitle = sanitizeText(title).trim();
    const safeBody = sanitizeText(body).trim();
    const safeCategory = sanitizeText(category).trim();
    const newPage: Page = {
      id: Date.now().toString(),
      title: safeTitle,
      icon: '??',
      category: safeCategory || 'note',
      updatedAt: 'Just now',
      blocks: [
        { id: 'b-title', type: 'heading', content: safeTitle },
        { id: 'b-text', type: 'text', content: safeBody }
      ]
    };
    setPages(prev => [newPage, ...prev]);
  };

  const handleInlineTaskFile = (title: string) => {
    const trimmed = sanitizeText(title).trim();
    if (!trimmed) return;

    const targetPage = pages.find(page => page.id === 'daily')
      || pages.find(page => page.category?.toLowerCase() === 'daily')
      || pages.find(page => page.category?.toLowerCase() === 'system')
      || pages[0];

    if (!targetPage) return;

    const newBlock: Block = {
      id: Date.now().toString(),
      type: 'todo',
      content: { text: trimmed, completed: false, done: false }
    };

    setPages(prev => prev.map(page => {
      if (page.id !== targetPage.id) return page;
      return { ...page, blocks: [...page.blocks, newBlock] };
    }));
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

  const openFinanceAdd = (options?: { goalId?: string; type?: 'income' | 'expense' | 'transfer' | 'goal' }) => {
    setFinanceInitialGoalId(options?.goalId ?? null);
    setFinanceCaptureType(options?.type ?? null);
    setShowFinanceCapture(true);
  };

  const handleMainPlusClick = () => {
    if (view === 'finance') {
      if (financeFabContext === 'subscriptions') {
        setFinanceFabIntent({ type: 'subscription' });
        return;
      }
      const initialType = financeFabContext === 'activity' ? 'expense' : undefined;
      openFinanceAdd({ type: initialType });
      return;
    }
    if (view === 'habits') {
      setShowHabitCapture(true);
      return;
    }
    if (view === 'tasks') {
      setIsAddingInline(true);
      return;
    }
    setShowCapture(true);
  };

  const handleFabPointerDown = () => {
    if (fabPressTimeoutRef.current) {
      window.clearTimeout(fabPressTimeoutRef.current);
    }
    fabLongPressTriggeredRef.current = false;
    if (view !== 'finance') return;
    fabPressTimeoutRef.current = window.setTimeout(() => {
      fabLongPressTriggeredRef.current = true;
      setShowFabActions(true);
    }, 420);
  };

  const handleFabPointerUp = () => {
    if (fabPressTimeoutRef.current) {
      window.clearTimeout(fabPressTimeoutRef.current);
    }
  };

  const handleFabPointerLeave = () => {
    if (fabPressTimeoutRef.current) {
      window.clearTimeout(fabPressTimeoutRef.current);
    }
  };

  const handleFabClick = () => {
    if (fabLongPressTriggeredRef.current) {
      fabLongPressTriggeredRef.current = false;
      return;
    }
    handleMainPlusClick();
  };

  useEffect(() => {
    setShowFabActions(false);
  }, [view]);

  const handleGoTasks = () => {
    setView('tasks');
  };

  const handleGoHabits = () => {
    setView('habits');
  };

  const handleGoAlerts = () => {
    setView('tasks');
  };

  const handleOpenSettings = () => {
    setView('settings');
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
            onGoTasks={handleGoTasks}
            onGoHabits={handleGoHabits}
            onGoAlerts={handleGoAlerts}
            onOpenSettings={handleOpenSettings}
          />
        );
      case 'home':
        return (
          <HomeView
            onGoTasks={handleGoTasks}
            onGoHabits={handleGoHabits}
            onGoAlerts={handleGoAlerts}
            onOpenSettings={handleOpenSettings}
          />
        );
      case 'tasks':
        return (
          <TasksView
            isAddingInline={isAddingInline}
            inlineValue={inlineValue}
            inlineInputRef={inlineInputRef}
            onInlineChange={(value) => setInlineValue(sanitizeText(value))}
            onStartInline={() => setIsAddingInline(true)}
            onCancelInline={() => {
              setIsAddingInline(false);
              setInlineValue('');
            }}
            onInlineAdded={handleInlineTaskFile}
          />
        );
      case 'habits':
        return <HabitsView refreshToken={habitsRefreshToken} />;
      case 'finance':
        return (
          <FinanceView
            refreshToken={financeRefreshToken}
            currencyCode={currencyCode}
            fabIntent={financeFabIntent}
            onFabIntentHandled={() => setFinanceFabIntent(null)}
            onFabContextChange={setFinanceFabContext}
          />
        );
      case 'settings':
        return (
          <SettingsView
            currencyCode={currencyCode}
            onCurrencyChange={setCurrencyCode}
            onBack={() => setView('home')}
          />
        );
      default:
        return (
          <HomeView
            onGoTasks={handleGoTasks}
            onGoHabits={handleGoHabits}
            onGoAlerts={handleGoAlerts}
            onOpenSettings={handleOpenSettings}
          />
        );
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 p-4">
      <div className="w-[390px] h-[844px] bg-white rounded-[60px] shadow-2xl overflow-hidden border-[12px] border-black relative flex flex-col">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-40 bg-black rounded-b-3xl z-[110]" />
        
        {renderContent()}

        {view !== 'page_detail' && view !== 'home' && view !== 'settings' && (
          <>
            <button 
              onPointerDown={handleFabPointerDown}
              onPointerUp={handleFabPointerUp}
              onPointerLeave={handleFabPointerLeave}
              onPointerCancel={handleFabPointerLeave}
              onClick={handleFabClick}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-xl z-[100] active:scale-95 transition-transform"
            >
              <Plus size={32} strokeWidth={2.5} />
            </button>
            {showFabActions && view === 'finance' && (
              <div className="absolute inset-0 z-[105]">
                <div
                  className="absolute inset-0"
                  onClick={() => setShowFabActions(false)}
                />
                <div className="absolute bottom-40 left-1/2 w-48 -translate-x-1/2 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFabActions(false);
                      openFinanceAdd({ type: 'income' });
                    }}
                    className="w-full rounded-2xl px-3 py-2 text-left text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Add income
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFabActions(false);
                      openFinanceAdd({ type: 'transfer' });
                    }}
                    className="w-full rounded-2xl px-3 py-2 text-left text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Add transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFabActions(false);
                      openFinanceAdd({ type: 'goal' });
                    }}
                    className="w-full rounded-2xl px-3 py-2 text-left text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Add goal
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {view !== 'page_detail' && (
          <div className="absolute bottom-6 left-6 right-6 h-16 bg-white border border-gray-100 rounded-full shadow-lg flex items-center justify-around px-4 z-[90]">
            <button onClick={() => setView('home')} className={view === 'home' || view === 'settings' ? 'text-black' : 'text-gray-300'}><Home size={24} /></button>
            <button onClick={() => setView('tasks')} className={view === 'tasks' ? 'text-black' : 'text-gray-300'}><CheckSquare size={24} /></button>
            <div className="w-12" />
            <button onClick={() => setView('habits')} className={view === 'habits' ? 'text-black' : 'text-gray-300'}><Activity size={24} /></button>
            <button onClick={() => setView('finance')} className={view === 'finance' ? 'text-black' : 'text-gray-300'}><CreditCard size={24} /></button>
          </div>
        )}

        {showCapture && <CaptureModal onClose={() => setShowCapture(false)} onSave={handleQuickNote} />}
        {showHabitCapture && (
          <HabitCaptureModal
            onClose={() => setShowHabitCapture(false)}
            onSaved={() => setHabitsRefreshToken((token) => token + 1)}
          />
        )}
        {showFinanceCapture && (
          <FinanceCaptureModal
            onClose={() => {
              setShowFinanceCapture(false);
              setFinanceCaptureType(null);
            }}
            initialGoalId={financeInitialGoalId}
            initialType={financeCaptureType}
            currencyCode={currencyCode}
            onSaved={() => {
              setFinanceRefreshToken((token) => token + 1);
              setFinanceCaptureType(null);
            }}
          />
        )}
        
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-200 rounded-full z-[110]" />
      </div>
    </div>
  );
}
