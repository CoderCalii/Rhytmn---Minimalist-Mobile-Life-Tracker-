import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FileText, Plus, Tag, X } from 'lucide-react-native';

interface TaskNoteComposerProps {
  isAdding: boolean;
  title: string;
  body: string;
  category: string;
  categories: string[];
  isSaving: boolean;
  disabled?: boolean;
  onStart: () => void;
  onCancel: () => void;
  onSave: () => void;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function TaskNoteComposer({
  isAdding,
  title,
  body,
  category,
  categories,
  isSaving,
  disabled,
  onStart,
  onCancel,
  onSave,
  onTitleChange,
  onBodyChange,
  onCategoryChange
}: TaskNoteComposerProps) {
  if (!isAdding) {
    return (
      <Pressable
        onPress={onStart}
        disabled={disabled}
        className="w-full flex-row items-center p-4 rounded-2xl border border-dashed border-gray-100"
      >
        <Plus size={18} color="#9ca3af" />
        <Text className="ml-3 text-xs font-bold uppercase tracking-widest text-gray-400">Add a quick note</Text>
      </Pressable>
    );
  }

  return (
    <View className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <FileText size={14} color="#9ca3af" />
          <Text className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Quick Note
          </Text>
        </View>
        <Pressable onPress={onCancel} className="p-2 rounded-full">
          <X size={14} color="#9ca3af" />
        </Pressable>
      </View>

      <TextInput
        placeholder="Title (optional)"
        value={title}
        onChangeText={onTitleChange}
        editable={!disabled}
        className="w-full text-lg font-semibold mb-4"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row items-center">
          <Tag size={14} color="#d1d5db" />
          {categories.map((item) => (
            <Pressable
              key={item}
              onPress={() => onCategoryChange(item)}
              disabled={disabled}
              className={`ml-2 px-3 py-1 rounded-full ${category === item ? 'bg-black' : 'bg-gray-50'}`}
            >
              <Text
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  category === item ? 'text-white' : 'text-gray-400'
                }`}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <TextInput
        placeholder="Write a note..."
        value={body}
        onChangeText={onBodyChange}
        editable={!disabled}
        multiline
        className="w-full min-h-[120px] text-sm font-medium"
      />

      <View className="mt-4 flex-row justify-end">
        <Pressable
          onPress={onSave}
          disabled={disabled || isSaving || !body.trim()}
          className="px-4 py-2 rounded-full bg-black"
        >
          <Text className="text-[10px] font-bold uppercase tracking-widest text-white">
            {isSaving ? 'Saving...' : 'Save Note'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
