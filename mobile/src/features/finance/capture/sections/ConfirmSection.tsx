import { ConfirmButton } from '../components/ConfirmButton';
import type { TransactionType } from '../capture.types';

interface ConfirmSectionProps {
  type: TransactionType;
  isSaving: boolean;
  isDisabled: boolean;
  onPress: () => void;
  error?: string | null;
  toast?: { type: 'success' | 'error'; message: string } | null;
}

export const ConfirmSection = ({
  type,
  isSaving,
  isDisabled,
  onPress,
  error,
  toast
}: ConfirmSectionProps) => {
  return (
    <ConfirmButton
      type={type}
      isSaving={isSaving}
      isDisabled={isDisabled}
      onPress={onPress}
      error={error}
      toast={toast}
    />
  );
};

