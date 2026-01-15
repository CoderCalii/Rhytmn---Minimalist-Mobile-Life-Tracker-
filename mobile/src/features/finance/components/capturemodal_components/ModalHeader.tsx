import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, X } from 'lucide-react-native';

interface ModalHeaderProps {
  date: Date;
  onClose: () => void;
}

export const ModalHeader = ({ date, onClose }: ModalHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.dateContainer}>
        <View style={styles.iconWrapper}>
          <Calendar size={12} color="#94a3b8" />
        </View>
        <Text style={styles.dateText}>
          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })},{' '}
          {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
      <Pressable onPress={onClose} style={styles.closeButton}>
        <X size={18} color="#94a3b8" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 9999,
  },
  iconWrapper: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.1,
    color: '#64748b',
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 9999,
  },
});


