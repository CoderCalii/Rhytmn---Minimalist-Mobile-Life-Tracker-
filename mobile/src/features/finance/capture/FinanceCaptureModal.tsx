import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { FinanceCaptureController } from './FinanceCaptureController';
import type { FinanceCaptureModalProps } from './capture.types';

export const FinanceCaptureModal = (props: FinanceCaptureModalProps) => {
  return (
    <Modal 
      transparent 
      visible={true} 
      animationType="slide" 
      onRequestClose={props.onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <BlurView intensity={45} tint="dark" style={styles.blurView} pointerEvents="none" />
        <Pressable style={styles.backdrop} onPress={props.onClose} />
        <FinanceCaptureController {...props} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});

export default FinanceCaptureModal;

