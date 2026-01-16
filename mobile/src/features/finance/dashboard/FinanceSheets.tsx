import { CARD_TITLES } from '../constants';
import BottomSheet from '../components/BottomSheet';
import ActionMenuSheet from '../components/sheets/ActionMenuSheet';
import ThisWeekSheet from '../components/sheets/ThisWeekSheet';
import TopCategoriesSheet from '../components/sheets/TopCategoriesSheet';
import GrowthTargetsSheet from '../components/sheets/GrowthTargetsSheet';
import ActivitySheet from '../components/sheets/ActivitySheet';
import InsightsSheet from '../components/sheets/InsightsSheet';
import CategorizeSheet from '../components/sheets/CategorizeSheet';
import type { FinanceDashboardViewProps } from './dashboard.types';

export const FinanceSheets = (props: FinanceDashboardViewProps) => {
  const {
    activeSheet,
    actionMenuCardId,
    categorizeTarget,
    isActionCardPinned,
    thisWeekRange,
    thisWeekSummary,
    weeklyBudget,
    weeklyInsight,
    thisWeekChart,
    topCategoriesRange,
    topCategoriesAll,
    topCategoriesTotal,
    topCategoriesInsight,
    goals,
    activityRange,
    filteredTransactions,
    categorySuggestions,
    customCategory,
    currencyCode,
    onCloseSheet,
    onCardEdit,
    onCardPinToggle,
    onCardHide,
    onSetCategorizeTarget,
    onCustomCategoryChange,
    onCategorySelection,
    onSaveCustomCategory,
    onDeleteTransaction,
    onCategorizeTransaction,
    getRangeLabel,
    formatEntryTime
  } = props;

  return (
    <>
      {actionMenuCardId && (
        <BottomSheet
          isOpen={Boolean(actionMenuCardId)}
          title={`Manage ${CARD_TITLES[actionMenuCardId]}`}
          onClose={() => props.onCardLongPress(null)}
        >
          <ActionMenuSheet
            isPinned={isActionCardPinned}
            onEdit={() => {
              onCardEdit(actionMenuCardId);
              props.onCardLongPress(null);
            }}
            onPinToggle={() => {
              onCardPinToggle(actionMenuCardId);
              props.onCardLongPress(null);
            }}
            onHide={() => {
              onCardHide(actionMenuCardId);
              props.onCardLongPress(null);
            }}
            onInsights={() => {
              props.onSetActiveSheet('insights');
              props.onCardLongPress(null);
            }}
          />
        </BottomSheet>
      )}

      <BottomSheet
        isOpen={activeSheet === 'this-week'}
        title={`${getRangeLabel(thisWeekRange)} details`}
        onClose={onCloseSheet}
      >
        <ThisWeekSheet
          summary={thisWeekSummary}
          weeklyBudget={weeklyBudget ?? 0}
          weeklyInsight={weeklyInsight}
          chart={thisWeekChart}
          currencyCode={currencyCode}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'top-categories'}
        title={`Top categories - ${getRangeLabel(topCategoriesRange)}`}
        onClose={onCloseSheet}
      >
        <TopCategoriesSheet
          categories={props.topCategoriesAllForSheets}
          total={topCategoriesTotal}
          insight={topCategoriesInsight}
          currencyCode={currencyCode}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'growth-targets'}
        title="Growth targets timeline"
        onClose={onCloseSheet}
      >
        <GrowthTargetsSheet goals={goals} currencyCode={currencyCode} isActive={activeSheet === 'growth-targets'} />
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'activity'}
        title={`Activity - ${getRangeLabel(activityRange)}`}
        onClose={onCloseSheet}
      >
        <ActivitySheet
          filteredTransactions={filteredTransactions}
          currencyCode={currencyCode}
          unknownDateLabel="Unknown date"
          onDeleteTransaction={onDeleteTransaction}
          onCategorizeTransaction={onCategorizeTransaction}
          formatEntryTime={formatEntryTime}
        />
      </BottomSheet>

      <BottomSheet isOpen={activeSheet === 'insights'} title="Insights" onClose={onCloseSheet}>
        <InsightsSheet
          anomalyCategories={props.anomalyCategoriesForSheets}
          subscriptionShare={props.subscriptionShare}
          categoryTrends={props.categoryTrendsForSheets}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={Boolean(categorizeTarget)}
        title="Categorize transaction"
        onClose={() => onSetCategorizeTarget(null)}
      >
        <CategorizeSheet
          categorizeTarget={categorizeTarget}
          categorySuggestions={categorySuggestions}
          customCategory={customCategory}
          onCustomCategoryChange={onCustomCategoryChange}
          onSelectCategory={onCategorySelection}
          onSaveCustom={onSaveCustomCategory}
        />
      </BottomSheet>
    </>
  );
};

