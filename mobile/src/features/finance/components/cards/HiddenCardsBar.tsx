import { Pressable, Text, View } from 'react-native';
import type { DashboardCardId } from '../../types';
import { CARD_TITLES } from '../../constants';

type HiddenCardsBarProps = {
  hiddenCards: DashboardCardId[];
  onShowCard: (cardId: DashboardCardId) => void;
};

const HiddenCardsBar = ({ hiddenCards, onShowCard }: HiddenCardsBarProps) => {
  if (hiddenCards.length === 0) return null;

  return (
    <View className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-4">
      <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
        Hidden sections
      </Text>
      <View className="flex-row flex-wrap">
        {hiddenCards.map((cardId) => (
          <Pressable
            key={cardId}
            onPress={() => onShowCard(cardId)}
            className="rounded-full border border-slate-200 px-3 py-1 mr-2 mb-2"
          >
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Show {CARD_TITLES[cardId]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default HiddenCardsBar;
