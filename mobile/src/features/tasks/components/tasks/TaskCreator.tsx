import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, Check, Circle, Plus } from 'lucide-react-native';
import { format } from 'date-fns';

interface TaskCreatorProps {
  isAdding: boolean;
  value: string;
  dueDate: string;
  hasDeadline: boolean;
  inputRef: RefObject<TextInput | null>;
  onChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onToggleDeadline: (nextValue: boolean) => void;
  onStart: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder: string;
}

export function TaskCreator({
  isAdding,
  value,
  dueDate,
  hasDeadline,
  inputRef,
  onChange,
  onDueDateChange,
  onToggleDeadline,
  onStart,
  onCancel,
  onSubmit,
  disabled,
  placeholder
}: TaskCreatorProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!hasDeadline) {
      // Use setTimeout to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setShowDatePicker(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hasDeadline]);

  const parsedDeadline = dueDate ? new Date(`${dueDate}T00:00:00`) : new Date();
  const hasValidDeadline = !Number.isNaN(parsedDeadline.getTime());
  const deadlineLabel = dueDate && hasValidDeadline
    ? format(parsedDeadline, 'MMM d, yyyy')
    : 'Pick a date';

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed') return;
    }
    if (selectedDate) {
      onDueDateChange(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  if (!isAdding) {
    return (
      <Pressable
        onPress={onStart}
        disabled={disabled}
        className="w-full flex-row items-center p-5 rounded-2xl border-2 border-dashed border-gray-100"
      >
        <Plus size={20} color="#9ca3af" />
        <Text className="ml-3 font-bold text-gray-400">Add something new to do here</Text>
      </Pressable>
    );
  }

  return (
    <View className="p-5 bg-white rounded-2xl border-2 border-black/10 shadow-sm">
      <View className="flex-row items-center">
        <Circle size={24} color="#d1d5db" />
        <TextInput
          ref={inputRef}
          className="flex-1 text-lg font-medium ml-4"
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          onBlur={() => {
            if (!value.trim()) {
              onCancel();
            }
          }}
          editable={!disabled}
        />
      </View>
      <View className="mt-4">
        <Pressable
          onPress={() => onToggleDeadline(!hasDeadline)}
          disabled={disabled}
          className="mt-4 flex-row items-center"
        >
          <View
            className={`h-4 w-4 items-center justify-center rounded border ${
              hasDeadline ? 'border-black bg-black' : 'border-gray-300'
            }`}
          >
            {hasDeadline ? <Check size={12} color="#ffffff" /> : null}
          </View>
          <Text className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Add deadline
          </Text>
        </Pressable>
        {hasDeadline ? (
          <View className="mt-3">
            <Pressable
              onPress={() => setShowDatePicker(true)}
              disabled={disabled}
              className="flex-row items-center"
            >
              <Calendar size={14} color="#9ca3af" />
              <Text
                className={`ml-2 text-xs font-semibold ${
                  dueDate ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {deadlineLabel}
              </Text>
            </Pressable>
            {Platform.OS === 'ios' ? (
              <View className="mt-2">
                <DateTimePicker
                  value={hasValidDeadline ? parsedDeadline : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
              </View>
            ) : Platform.OS !== 'web' && showDatePicker ? (
              <DateTimePicker
                value={hasValidDeadline ? parsedDeadline : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            ) : null}
          </View>
        ) : null}
        <Pressable onPress={onCancel} className="self-end mt-2">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
