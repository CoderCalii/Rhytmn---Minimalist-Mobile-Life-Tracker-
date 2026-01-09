import type { Page } from '../../../types';

interface QueueListProps {
  pages: Page[];
  onSelectPage: (pageId: string) => void;
}

const QueueList = ({ pages, onSelectPage }: QueueListProps) => {
  const queuePages = pages.filter((page) => page.id !== 'daily');

  return (
    <div>
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">The Queue</h3>
      <div className="space-y-3">
        {queuePages.length === 0 ? (
          <div className="p-5 text-sm text-gray-400">No pages in the queue yet.</div>
        ) : (
          queuePages.map((page) => (
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
                <p className="text-xs text-gray-400 mt-0.5">
                  {page.blocks.length} blocks | {page.category || 'General'} | {page.updatedAt}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default QueueList;
