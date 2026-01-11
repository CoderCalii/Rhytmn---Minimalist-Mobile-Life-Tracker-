import type { DashboardCardId } from '../../types';
import { CARD_TITLES } from '../../constants';

type HiddenCardsBarProps = {
  hiddenCards: DashboardCardId[];
  onShowCard: (cardId: DashboardCardId) => void;
};

const HiddenCardsBar = ({ hiddenCards, onShowCard }: HiddenCardsBarProps) => {
  if (hiddenCards.length === 0) return null;

  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-4 text-xs text-slate-500">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Hidden sections</p>
      <div className="flex flex-wrap gap-2">
        {hiddenCards.map((cardId) => (
          <button
            key={cardId}
            type="button"
            onClick={() => onShowCard(cardId)}
            className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            Show {CARD_TITLES[cardId]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HiddenCardsBar;
