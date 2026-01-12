import { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { Plus } from 'lucide-react-native';
import TasksView from '../features/tasks/views/TasksView';
import { sanitizeText } from '../utils/sanitize';
import FloatingLayout from '../components/layout/FloatingLayout';

const TasksScreen = () => {
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineValue, setInlineValue] = useState('');
  const inlineInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (isAddingInline && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [isAddingInline]);

  return (
    <FloatingLayout
      showFAB
      fabAction={() => {
        setIsAddingInline(true);
        setInlineValue('');
      }}
      fabIcon={<Plus size={24} color="#ffffff" />}
    >
      <TasksView
        isAddingInline={isAddingInline}
        inlineValue={inlineValue}
        inlineInputRef={inlineInputRef}
        onInlineChange={(value) => setInlineValue(sanitizeText(value))}
        onStartInline={() => setIsAddingInline(true)}
        onCancelInline={() => {
          setIsAddingInline(false);
          setInlineValue('');
        }}
        onInlineAdded={() => {
          setIsAddingInline(false);
        }}
      />
    </FloatingLayout>
  );
};

export default TasksScreen;
