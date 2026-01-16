import type { FinanceAccount, FinanceGoal, FinanceTransaction } from '../../../types';
import type { FinanceEntryRow } from '../../../lib/financeEntries';
import type { BillItem, SubscriptionItem, ActivityTransaction, DashboardConfig, TimeRange } from '../types';

export type DashboardCardId = 'this-week' | 'upcoming-bills' | 'subscriptions' | 'top-categories' | 'growth-targets' | 'activity';

export type ActiveSheet = 'this-week' | 'top-categories' | 'growth-targets' | 'activity' | 'insights' | null;

export interface FinanceDashboardViewProps {
  // Data from hooks
  accounts: FinanceAccount[];
  goals: FinanceGoal[];
  transactions: FinanceTransaction[];
  rawEntries: FinanceEntryRow[];
  bills: BillItem[];
  subscriptions: SubscriptionItem[];
  accountsLoading: boolean;
  goalsLoading: boolean;
  entriesLoading: boolean;
  billsLoading: boolean;
  subscriptionsLoading: boolean;
  accountsError: string | null;
  goalsError: string | null;
  entriesError: string | null;
  billsError: string | null;
  subscriptionsError: string | null;
  
  // Dashboard config
  dashboardConfig: DashboardConfig;
  orderedDashboardCards: DashboardCardId[];
  hiddenCards: DashboardCardId[];
  
  // Insights data
  thisWeekRange: TimeRange;
  thisWeekSummary: { spent: number; income: number; net: number };
  weeklyBudget: number | null;
  weeklyProgress: number;
  thisWeekChart: { points: Array<{ label: string; spend: number; budget: number }>; maxValue: number };
  weeklyHelperText: string;
  weeklyInsight: string | null;
  incomeDelta: { direction: 'up' | 'down' | 'flat'; label: string } | null;
  netDelta: { direction: 'up' | 'down' | 'flat'; label: string } | null;
  topCategoriesRange: TimeRange;
  topCategoriesAll: Array<{ category: string; amount: number }>;
  topCategoriesAllForSheets: Array<{ name: string; amount: number }>;
  topCategoriesTotal: number;
  topCategories: Array<{ name: string; amount: number }>;
  topCategoriesInsight: string | null;
  subscriptionsRange: TimeRange;
  categorySuggestions: string[];
  subscriptionsSummary: { total: number; names: string[]; count: number };
  subscriptionsInsight: string | null;
  subscriptionShare: number;
  anomalyCategories: Array<{ category: string; amount: number }>;
  anomalyCategoriesForSheets: Array<{ name: string; amount: number; delta: number }>;
  categoryTrends: Array<{ category: string; trend: string }>;
  categoryTrendsForSheets: Array<{ name: string; amount: number; previous: number; delta: number | null }>;
  upcomingBillsRange: TimeRange;
  upcomingBills: Array<{ name: string; dateLabel: string; amount: number }>;
  upcomingBillsMonthTotal: number;
  upcomingBillsInsight: string | null;
  activityRange: TimeRange;
  filteredTransactions: ActivityTransaction[];
  recentTransactions: ActivityTransaction[];
  hasMoreActivity: boolean;
  orderedActivityGroups: Array<[string, ActivityTransaction[]]>;
  activityInsight: string | null;
  
  // Animation
  animatedTransactionIds: string[];
  
  // UI state
  activeAccountIndex: number;
  showAllGoals: boolean;
  draggingCardId: DashboardCardId | null;
  actionMenuCardId: DashboardCardId | null;
  categorizeTarget: ActivityTransaction | null;
  customCategory: string;
  undoToast: { id: string; label: string } | null;
  scrollPaddingBottom: number;
  undoBottom: number;
  
  // Visibility state
  showAccountModal: boolean;
  showGoalModal: boolean;
  showBillsModal: boolean;
  showSubscriptionsModal: boolean;
  infoModal: { title: string; description: string } | null;
  activeSheet: ActiveSheet;
  
  // Account modal state
  editingAccount: FinanceAccount | null;
  accountForm: { name: string; balance: string; color: import('../utils/financeUi').AccountColorId; lastFour: string };
  accountSaveError: string | null;
  accountSaving: boolean;
  
  // Goal modal state
  goalForm: { name: string; target: string; current: string; color: string };
  goalSaveError: string | null;
  goalSaving: boolean;
  
  // Computed
  displayedGoals: FinanceGoal[];
  isActionCardPinned: boolean;
  
  // Auth
  user: { id: string } | null;
  authLoading: boolean;
  currencyCode: 'USD' | 'PHP';
  
  // Callbacks
  onCycleAccount: () => void;
  onOpenAddAccount: () => void;
  onOpenEditAccount: (account: import('../../../types').FinanceAccount) => void;
  onSaveAccount: () => void;
  onDeleteAccount?: () => void;
  onAccountFormChange: (field: string, value: string) => void;
  onAccountColorChange: (color: string) => void;
  onOpenGoalModal: () => void;
  onSaveGoal: () => void;
  onGoalFormChange: (field: string, value: string) => void;
  onGoalColorChange: (color: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onToggleShowAllGoals: () => void;
  onOpenInfoModal: (title: string, description?: string) => void;
  onCloseInfoModal: () => void;
  onCardDrop: (targetId: DashboardCardId) => void;
  onCardEdit: (cardId: DashboardCardId) => void;
  onCardLongPress: (cardId: DashboardCardId | null) => void;
  onCardSwipe: (cardId: DashboardCardId, direction: 'next' | 'prev') => void;
  onCardDragStart: (cardId: DashboardCardId) => void;
  onCardDragEnd: () => void;
  onCardPinToggle: (cardId: DashboardCardId) => void;
  onCardHide: (cardId: DashboardCardId) => void;
  onCardShow: (cardId: DashboardCardId) => void;
  onCategorySelection: (category: string) => void;
  onDeleteTransaction: (transaction: ActivityTransaction) => void;
  onUndoDelete: () => void;
  onCategorizeTransaction: (target: ActivityTransaction) => void;
  onCustomCategoryChange: (value: string) => void;
  onSaveCustomCategory: () => void;
  onSetActiveSheet: (sheet: ActiveSheet) => void;
  onCloseSheet: () => void;
  onCloseAccountModal: () => void;
  onCloseGoalModal: () => void;
  onCloseBillsModal: () => void;
  onCloseSubscriptionsModal: () => void;
  onSetCategorizeTarget: (target: ActivityTransaction | null) => void;
  
  // Data mutations
  setTransactions: (updater: (prev: FinanceTransaction[]) => FinanceTransaction[]) => void;
  setRawEntries: (updater: (prev: FinanceEntryRow[]) => FinanceEntryRow[]) => void;
  fetchEntries: () => void;
  createAccount: (data: { name: string; balance: number; color: string; lastFour: string }) => Promise<string | null>;
  updateAccount: (id: string, data: { name?: string; balance?: number; color?: string; lastFour?: string }) => Promise<string | null>;
  createGoal: (data: { name: string; target: number; current: number; color: string }) => Promise<string | null>;
  deleteGoal: (id: string) => Promise<string | null>;
  createBill: (data: import('../types').BillFormInput) => Promise<string | null>;
  updateBill: (id: string, data: Partial<import('../types').BillFormInput>) => Promise<string | null>;
  deleteBill: (id: string) => Promise<string | null>;
  createSubscription: (data: import('../types').SubscriptionFormInput) => Promise<string | null>;
  updateSubscription: (id: string, data: Partial<import('../types').SubscriptionFormInput>) => Promise<string | null>;
  deleteSubscription: (id: string) => Promise<string | null>;
  deleteFinanceEntry: (id: string) => Promise<void>;
  updateEntryCategory: (id: string, category: string) => Promise<string | null>;
  
  // Utils
  formatEntryTime: (value?: string | null) => string | null;
  getRangeLabel: (range: TimeRange) => string;
  getRangeBadge: (range: TimeRange) => string;
}

