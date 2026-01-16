import ArchivedTasksView from '../features/tasks/views/ArchivedTasksView';
import FloatingLayout from '../components/layout/FloatingLayout';

const ArchivedTasksScreen = () => (
  <FloatingLayout showFAB={false}>
    <ArchivedTasksView />
  </FloatingLayout>
);

export default ArchivedTasksScreen;


