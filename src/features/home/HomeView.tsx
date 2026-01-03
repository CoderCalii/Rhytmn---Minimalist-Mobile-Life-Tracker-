import { Flame, Plus, Sparkles, Sun, Zap } from 'lucide-react';
import AppHeader from '../../components/AppHeader';
import { INITIAL_PAGES } from '../../mockData';
import type { Page } from '../../types';

interface HomeViewProps {
  pages: Page[];
  zapInput: string;
  onZapInputChange: (value: string) => void;
  onZapSubmit: () => void;
  onSelectPage: (pageId: string) => void;
}

const HomeView = ({ pages = INITIAL_PAGES, zapInput, onZapInputChange, onZapSubmit, onSelectPage }: HomeViewProps) => {
  const activityDots = [
    1, 1, 0, 1, 0, 1, 1,
    0, 1, 1, 0, 1, 0, 1,
    1, 0, 1, 1, 0, 1, 0,
    1, 1, 0, 1, 1, 0, 1
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
      <AppHeader
        title="Home"
        subtitle="Tuesday, Oct 24"
        rightAction={<div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><Sun size={18} /></div>}
      />

      <div className="px-6 mt-2 space-y-8">
        <div className="mt-4">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <Zap size={16} className="text-gray-500" />
            <input
              value={zapInput}
              onChange={(event) => onZapInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onZapSubmit();
                }
              }}
              placeholder="Zap Capture"
              className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
            />
            <button
              onClick={onZapSubmit}
              className="rounded-full bg-black p-2 text-white hover:bg-gray-800 transition-colors"
              aria-label="Add capture"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black p-5 text-white shadow-sm">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/60">
              <span>Streak</span>
              <Flame size={16} className="text-white" />
            </div>
            <div className="mt-6 text-2xl font-bold">14 Day Streak</div>
          </div>
          <div className="rounded-2xl bg-gray-100 p-5 shadow-sm">
            <div className="text-xs uppercase tracking-widest text-gray-400">System Activity</div>
            <div className="mt-4 grid grid-cols-7 gap-1">
              {activityDots.map((active, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${active ? 'bg-gray-500' : 'bg-gray-300/60'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
            <Sparkles size={14} />
            Resurfacing
          </div>
          <div className="mt-3 text-lg font-semibold">
            Core Principle: Simplicity is the ultimate sophistication.
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Queue</h3>
          <div className="space-y-3">
            {pages.filter(page => page.id !== 'daily').map(page => (
              <button
                key={page.id}
                onClick={() => onSelectPage(page.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-left border border-transparent hover:border-gray-100 transition-all"
              >
                <span className="text-2xl">{page.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {page.category === 'unprocessed' && (
                      <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                    )}
                    <h4 className="font-semibold text-black text-[15px]">{page.title}</h4>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{page.blocks.length} blocks | {page.category || 'General'} | {page.updatedAt}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
