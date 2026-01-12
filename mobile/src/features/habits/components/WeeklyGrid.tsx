import { Text, View } from 'react-native';

type WeeklyGridProps = {
  days: string[];
  values: number[];
};

export function WeeklyGrid({ days, values }: WeeklyGridProps) {
  return (
    <View>
      <View className="flex-row">
        {days.map((day) => (
          <Text key={day} className="mr-2">{day}</Text>
        ))}
      </View>
      <View className="flex-row">
        {values.map((value, index) => (
          <View key={index} className={`h-2 w-2 rounded-full mr-1 ${value > 0 ? 'bg-black' : 'bg-gray-200'}`} />
        ))}
      </View>
    </View>
  );
}
