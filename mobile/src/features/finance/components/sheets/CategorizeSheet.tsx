import { Pressable, Text, TextInput, View } from 'react-native';
import type { ActivityTransaction } from '../../types';

type CategorizeSheetProps = {
  categorizeTarget: ActivityTransaction | null;
  categorySuggestions: string[];
  customCategory: string;
  onCustomCategoryChange: (value: string) => void;
  onSelectCategory: (category: string) => void;
  onSaveCustom: () => void;
};

const CategorizeSheet = ({
  categorizeTarget,
  categorySuggestions,
  customCategory,
  onCustomCategoryChange,
  onSelectCategory,
  onSaveCustom
}: CategorizeSheetProps) => {
  return (
    <View>
      <Text className="text-xs text-slate-500 mb-4">
        {categorizeTarget ? categorizeTarget.title : 'Select a category.'}
      </Text>
      <View className="flex-row flex-wrap mb-4">
        {categorySuggestions.length === 0 ? (
          <Text className="text-xs text-slate-400">No recent categories.</Text>
        ) : null}
        {categorySuggestions.map((category) => (
          <Pressable
            key={category}
            onPress={() => onSelectCategory(category)}
            className="rounded-full bg-slate-100 px-3 py-1 mr-2 mb-2"
          >
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {category}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row items-center">
        <TextInput
          value={customCategory}
          onChangeText={onCustomCategoryChange}
          placeholder="Custom category"
          className="flex-1 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
        />
        <Pressable onPress={onSaveCustom} className="ml-2 rounded-2xl bg-black px-4 py-2">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-white">Save</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default CategorizeSheet;
