import { FinanceDashboardController } from './dashboard/FinanceDashboardController';

interface FinanceViewProps {
  refreshToken?: number;
  currencyCode?: 'USD' | 'PHP';
  fabIntent?: { type: 'subscription' } | null;
  onFabIntentHandled?: () => void;
  onFabContextChange?: (context: 'portfolio' | 'activity' | 'subscriptions') => void;
}

const FinanceView = (props: FinanceViewProps) => {
  return <FinanceDashboardController {...props} />;
};

export default FinanceView;
