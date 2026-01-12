import { Pressable, Text, View } from 'react-native';

interface NoteFiltersProps {
  filters: string[];
  activeFilter: string;
  onChange: (value: string) => void;
}

export function NoteFilters({ filters, activeFilter, onChange }: NoteFiltersProps) {
  return (
    <View className="flex-row flex-wrap">
      {filters.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => onChange(filter)}
          className={`px-3 py-1 rounded-full mr-2 mb-2 ${
            activeFilter === filter ? 'bg-black' : 'bg-gray-50'
          }`}
        >
          <Text
            className={`text-[10px] font-bold uppercase tracking-wider ${
              activeFilter === filter ? 'text-white' : 'text-gray-400'
            }`}
          >
            {filter}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
