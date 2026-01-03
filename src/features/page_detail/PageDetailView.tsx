import { CheckCircle2, ChevronLeft, Circle } from 'lucide-react';
import { INITIAL_PAGES } from '../../mockData';
import type { Page } from '../../types';
import { getTodoCompleted } from '../../utils/todo';

interface PageDetailViewProps {
  page: Page;
  onBack: () => void;
  onToggleTodo: (pageId: string, blockId: string) => void;
}

const PageDetailView = ({ page = INITIAL_PAGES[0], onBack, onToggleTodo }: PageDetailViewProps) => (
  <div className="flex-1 overflow-y-auto pb-32">
    <div className="p-4 flex items-center gap-4 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
      <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
    </div>
    <div className="px-6">
      <h1 className="text-5xl mb-6">{page.icon}</h1>
      <h2 className="text-3xl font-bold mb-8 leading-tight">{page.title}</h2>
      <div className="space-y-6">
        {page.blocks.map(block => {
          if (block.type === 'heading') {
            return <h3 key={block.id} className="text-xl font-bold mt-4 mb-2">{block.content}</h3>;
          }
          if (block.type === 'todo') {
            const completed = getTodoCompleted(block.content);
            return (
              <div 
                key={block.id}
                onClick={() => onToggleTodo(page.id, block.id)}
                className="flex items-center py-3 border-b border-gray-50 cursor-pointer"
              >
                <div className={`mr-4 ${completed ? 'text-green-500' : 'text-gray-300'}`}>
                  {completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </div>
                <span className={completed ? 'text-gray-300 line-through text-lg' : 'text-gray-800 text-lg'}>{block.content.text}</span>
              </div>
            );
          }
          if (block.type === 'text') {
            return <p key={block.id} className="text-lg text-gray-800 leading-relaxed">{block.content}</p>;
          }
          return null;
        })}
      </div>
    </div>
  </div>
);

export default PageDetailView;
