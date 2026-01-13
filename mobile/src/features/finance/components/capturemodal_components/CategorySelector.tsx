import { useEffect } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { sanitizeText } from '../../../../utils/sanitize';

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
  newCategory: string;
  onNewCategoryChange: (value: string) => void;
  type: 'income' | 'expense';
}

export const CategorySelector = ({
  categories,
  selectedCategory,
  onCategorySelect,
  isEditing,
  onToggleEdit,
  onAddCategory,
  onRemoveCategory,
  newCategory,
  onNewCategoryChange,
  type
}: CategorySelectorProps) => {
  useEffect(() => {
    console.log('[CategorySelector] Mounted/Rendered', {
      type,
      categoriesCount: categories.length,
      selectedCategory,
      isEditing
    });
  });

  if (type !== 'income' && type !== 'expense') return null;

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Category</Text>
        <Pressable onPress={onToggleEdit}>
          <Text className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
            {isEditing ? 'Done' : 'Edit'}
          </Text>
        </Pressable>
      </View>
      <View className="flex-row flex-wrap">
        {categories.map((cat) =>
          isEditing ? (
            <View
              key={cat}
              className={`flex-row items-center rounded-2xl px-3 py-2 mr-2 mb-2 ${
                selectedCategory.toLowerCase() === cat.toLowerCase() ? 'bg-slate-900' : 'bg-slate-50'
              }`}
            >
              <Pressable onPress={() => onCategorySelect(cat)}>
                <Text className={`text-[10px] font-bold ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'text-white' : 'text-slate-400'}`}>
                  {cat}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onRemoveCategory(cat)}
                className={`ml-2 h-5 w-5 items-center justify-center rounded-full ${
                  selectedCategory.toLowerCase() === cat.toLowerCase() ? 'bg-white/20' : 'bg-white'
                }`}
                accessibilityLabel={`Remove ${cat}`}
              >
                <X size={10} color={selectedCategory.toLowerCase() === cat.toLowerCase() ? '#ffffff' : '#94a3b8'} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              key={cat}
              onPress={() => onCategorySelect(cat)}
              className={`px-4 py-2 rounded-2xl mr-2 mb-2 ${
                selectedCategory === cat ? 'bg-slate-900' : 'bg-slate-50'
              }`}
            >
              <Text className={`text-[10px] font-bold ${selectedCategory === cat ? 'text-white' : 'text-slate-400'}`}>
                {cat}
              </Text>
            </Pressable>
          )
        )}
        {!isEditing && categories.length === 0 && (
          <Text className="text-[10px] font-bold text-slate-400">No categories yet.</Text>
        )}
      </View>
      {isEditing && (
        <View className="mt-3 flex-row items-center">
          <TextInput
            placeholder="Add category"
            value={newCategory}
            onChangeText={(value) => onNewCategoryChange(sanitizeText(value))}
            onSubmitEditing={() => onAddCategory(newCategory)}
            className="flex-1 rounded-2xl bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-700"
            placeholderTextColor="#cbd5f5"
          />
          <Pressable
            onPress={() => onAddCategory(newCategory)}
            className="ml-2 rounded-2xl bg-black px-4 py-2"
          >
            <Text className="text-[10px] font-bold uppercase tracking-widest text-white">Add</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
