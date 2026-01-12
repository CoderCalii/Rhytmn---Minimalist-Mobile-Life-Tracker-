import { Pressable, Text, View } from 'react-native';

type ActionMenuSheetProps = {
  isPinned: boolean;
  onEdit: () => void;
  onPinToggle: () => void;
  onHide: () => void;
  onInsights: () => void;
};

const ActionMenuSheet = ({ isPinned, onEdit, onPinToggle, onHide, onInsights }: ActionMenuSheetProps) => {
  return (
    <View>
      <Pressable onPress={onEdit} className="w-full rounded-2xl border border-slate-200 px-4 py-3 mb-3">
        <Text className="text-sm font-semibold text-slate-700">Edit</Text>
      </Pressable>
      <Pressable onPress={onPinToggle} className="w-full rounded-2xl border border-slate-200 px-4 py-3 mb-3">
        <Text className="text-sm font-semibold text-slate-700">{isPinned ? 'Unpin' : 'Pin'}</Text>
      </Pressable>
      <Pressable onPress={onHide} className="w-full rounded-2xl border border-slate-200 px-4 py-3 mb-3">
        <Text className="text-sm font-semibold text-slate-700">Hide from dashboard</Text>
      </Pressable>
      <Pressable onPress={onInsights} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
        <Text className="text-sm font-semibold text-slate-700">Insights</Text>
      </Pressable>
    </View>
  );
};

export default ActionMenuSheet;
