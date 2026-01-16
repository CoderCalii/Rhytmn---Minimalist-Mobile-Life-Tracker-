import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { sanitizeText } from '../../../../utils/sanitize';

interface NotesSectionProps {
  showNotes: boolean;
  note: string;
  onToggleNotes: () => void;
  onNoteChange: (value: string) => void;
}

export const NotesSection = ({ showNotes, note, onToggleNotes, onNoteChange }: NotesSectionProps) => {
  return (
    <View style={styles.container}>
      <Pressable onPress={onToggleNotes}>
        <Text style={styles.toggleText}>
          {showNotes ? 'Remove Note' : 'Add Note'}
        </Text>
      </Pressable>
      {showNotes && (
        <TextInput
          placeholder="What was this for?"
          style={styles.input}
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  toggleText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  input: {
    width: '100%',
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    fontSize: 14,
    color: '#334155',
  },
});

