import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TransactionType } from '../capture.types';
import { transactionTypes } from './transactionTypes';

interface TransactionTypeSelectorProps {
  type: TransactionType;
  onTypeChange: (type: TransactionType) => void;
}

export const TransactionTypeSelector = ({ type, onTypeChange }: TransactionTypeSelectorProps) => {
  const handlePress = (newType: TransactionType) => {
    onTypeChange(newType);
  };

  return (
    <View style={styles.container}>
      {transactionTypes.map((t) => {
        const active = type === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => handlePress(t.id)}
            style={[styles.button, active && styles.buttonActive]}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                {t.icon}
              </View>
              <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
                {t.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    padding: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    color: '#94a3b8',
  },
  buttonTextActive: {
    color: '#000000',
  },
});
