import { Pressable, Text, TextInput, View } from 'react-native';
import { sanitizeText } from '../../../../utils/sanitize';

interface NotesSectionProps {
  showNotes: boolean;
  note: string;
  onToggleNotes: () => void;
  onNoteChange: (value: string) => void;
}

export const NotesSection = ({ showNotes, note, onToggleNotes, onNoteChange }: NotesSectionProps) => {
  return (
    <View className="mb-6">
      <Pressable onPress={onToggleNotes}>
        <Text className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
          {showNotes ? 'Remove Note' : 'Add Note'}
        </Text>
      </Pressable>
      {showNotes && (
        <TextInput
          placeholder="What was this for?"
          className="w-full mt-3 p-4 bg-slate-50 rounded-3xl text-sm text-slate-700"
          placeholderTextColor="#cbd5f5"
          value={note}
          onChangeText={(value) => onNoteChange(sanitizeText(value))}
          multiline
          textAlignVertical="top"
        />
      )}
    </View>
  );
};

