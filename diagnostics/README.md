# Mobile App Functions Documentation

This document provides detailed documentation for all functions and modules in the `mobile/` directory of the Rhythm mobile habit tracking app.

## Table of Contents

1. [Core App Setup](#core-app-setup)
2. [Authentication & User Management](#authentication--user-management)
3. [Context Providers & State Management](#context-providers--state-management)
4. [Data Fetching & Storage](#data-fetching--storage)
5. [Task Management](#task-management)
6. [Habit Tracking](#habit-tracking)
7. [Finance Management](#finance-management)
8. [Notes Management](#notes-management)
9. [Utility Functions](#utility-functions)
10. [Navigation](#navigation)

---

## Core App Setup

### `App.tsx` (Default Export)
**Location:** `mobile/App.tsx`

The main application component that initializes the React Native app.

**Responsibilities:**
- Loads custom fonts (Space Grotesk) using `useFonts` hook
- Wraps the app with gesture handlers for React Native Gesture Handler
- Provides context providers for Settings, Tasks, and Habits
- Sets up navigation container with RootNavigator

**Dependencies:**
- `SettingsProvider`, `TasksProvider`, `HabitsProvider` - Context providers
- `RootNavigator` - Main navigation component
- `GestureHandlerRootView` - Enables gesture handling

**Function Flow:**
1. Checks if fonts are loaded
2. Returns `null` until fonts are ready (prevents flash of unstyled text)
3. Renders the full app with all providers and navigation

---

### `index.ts`
**Location:** `mobile/index.ts`

Entry point that registers the root component with Expo.

**Function:** `registerRootComponent(App)`
- Registers the App component as the root component
- Ensures proper initialization for both Expo Go and native builds
- Called by Expo's runtime system

---

## Authentication & User Management

### `useAuth()`
**Location:** `mobile/src/hooks/useAuth.ts`

React hook that manages user authentication state using Supabase.

**Returns:**
- `user`: `User | null` - The current authenticated user
- `loading`: `boolean` - Loading state during initial auth check

**Function Flow:**
1. Checks if Supabase is configured via `isSupabaseConfigured`
2. Gets initial session from Supabase auth
3. Sets up `onAuthStateChange` listener for real-time auth updates
4. Returns null user and false loading if Supabase is not configured

**Key Features:**
- Graceful degradation when Supabase is unavailable
- Real-time auth state synchronization
- Automatic session refresh

---

## Context Providers & State Management

### `SettingsProvider`
**Location:** `mobile/src/store/settingsContext.tsx`

Context provider that manages user settings, particularly currency preferences.

**Functions:**

#### `readStoredCurrency(): Promise<CurrencyCode>`
Reads currency preference from AsyncStorage.

**Returns:** `'USD' | 'PHP'` (defaults to 'USD')

#### `SettingsProvider({ children })`
React context provider component.

**State Managed:**
- `currencyCode`: Current currency setting ('USD' | 'PHP')
- `loading`: Loading state for settings initialization

**Function Flow:**
1. On mount, loads currency from AsyncStorage or Supabase (if user is authenticated)
2. Syncs to Supabase `user_settings` table when user is logged in
3. Falls back to local storage if Supabase is unavailable
4. Persists changes to AsyncStorage immediately

**Exports:**
- `useSettings()` - Hook to access settings context
- `SettingsProvider` - Provider component

---

### `TasksProvider`
**Location:** `mobile/src/store/tasksProvider.tsx`

Context provider that wraps the tasks functionality.

**Function:** `TasksProvider({ children })`
- Merges auth loading state with tasks loading state
- Passes user ID to `useTasksInternal` hook
- Provides unified loading state to consumers

**Exports:**
- `useTasks()` - Hook to access tasks context
- `TasksProvider` - Provider component
- `TaskRow` - Type definition

---

### `HabitsProvider`
**Location:** `mobile/src/store/habitsProvider.tsx`

Context provider for habit tracking functionality.

**Functions:**

#### `useHabitsInternal(userId: string | null): HabitsContextValue`
Internal hook that manages habits state and operations.

**State:**
- `habits`: Array of habit definitions
- `habitLogs`: Array of habit completion logs
- `loading`: Loading state
- `error`: Error message if any

**Methods:**

##### `fetchHabits(): Promise<void>`
Fetches habits and habit logs from Supabase.
- Queries `habits` table filtered by user_id
- Queries `habit_logs` table filtered by user_id
- Handles errors gracefully

##### `refreshHabits(): Promise<void>`
Manually refreshes habits data from Supabase.

##### `toggleHabitToday(habitId: string): Promise<void>`
Toggles habit completion for today.
- Uses optimistic updates for instant UI feedback
- Creates or deletes log entry in Supabase
- Reverts on error

##### `isHabitCompletedToday(habitId: string): boolean`
Checks if a habit was completed today.

##### `getHabitStreak(habitId: string): number`
Calculates current streak for a habit by counting consecutive days from today backwards.

**Exports:**
- `HabitsProvider` - Provider component
- `useHabits()` - Hook to access habits context
- `HabitRow`, `HabitLogRow` - Type definitions

---

## Data Fetching & Storage

### `supabase` Client
**Location:** `mobile/src/lib/supabase.ts`

Supabase client configuration and initialization.

**Exports:**

#### `isSupabaseConfigured: boolean`
Boolean flag indicating if Supabase environment variables are set.

#### `supabase: SupabaseClient`
The Supabase client instance configured with:
- URL from `EXPO_PUBLIC_SUPABASE_URL`
- Anon key from `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- AsyncStorage for auth persistence
- Auto token refresh enabled

**Error Handling:**
- Logs critical warning if environment variables are missing
- Uses placeholder values to prevent immediate crashes

---

### `useLocalStorage<T>(key, initialValue, validator?)`
**Location:** `mobile/src/hooks/useLocalStorage.ts`

React hook for managing localStorage-like state with AsyncStorage.

**Parameters:**
- `key`: Storage key string
- `initialValue`: Default value of type T
- `validator`: Optional type guard function

**Returns:** `[value, setValue]` tuple

**Function Flow:**
1. Loads value from AsyncStorage on mount
2. Validates value if validator is provided
3. Persists changes to AsyncStorage automatically
4. Handles parse errors gracefully

---

### `assertValidStoredData<T>(data, validator): T`
**Location:** `mobile/src/utils/storageGuards.ts`

Type guard utility for validating stored data.

**Throws:** Error if validation fails

**Use Case:** Ensures data integrity when reading from AsyncStorage

---

## Task Management

### `useTasksInternal(userId: string | null)`
**Location:** `mobile/src/features/tasks/components/useTasks.ts`

Core hook for managing tasks state and operations.

**State:**
- `tasks`: Array of active tasks
- `archivedTasks`: Array of archived tasks
- `loading`: Loading state
- `error`: Error message

**Methods:**

#### `refreshTasks(): Promise<void>`
Refreshes tasks from Supabase.

#### `createTask(title: string, dueDate?: string | null): Promise<TaskRow | null>`
Creates a new task.
- Inserts into `tasks` table
- Optimistically updates local state
- Returns created task or null on error

#### `completeTask(taskId: string): Promise<boolean>`
Toggles task completion status.
- Updates `completed` and `completed_at` fields
- Only works on non-archived tasks
- Returns true on success

#### `bulkComplete(ids: string[]): Promise<boolean>`
Marks multiple tasks as completed in a single operation.

#### `archiveTask(taskId: string): Promise<boolean>`
Archives a task by setting `archived_at` timestamp.
- Moves task from `tasks` to `archivedTasks`
- Uses optimistic updates
- Reverts on error

#### `bulkArchive(ids: string[]): Promise<boolean>`
Archives multiple tasks at once.

#### `restoreTask(taskId: string): Promise<boolean>`
Restores an archived task by clearing `archived_at`.
- Moves task from `archivedTasks` back to `tasks`

**Function Flow:**
- Automatically fetches tasks when userId changes
- Splits tasks into active and archived arrays
- Handles Supabase unavailability gracefully

---

### `useNotes(userId: string | null)`
**Location:** `mobile/src/features/tasks/components/useNotes.ts`

Hook for managing notes (different from finance notes).

**State:**
- `notes`: Array of note objects
- `notesLoading`: Loading state
- `notesError`: Error message

**Methods:**

#### `refreshNotes(): Promise<void>`
Refreshes notes from Supabase `notes` table.

#### `addNote(input: AddNoteInput): Promise<NoteRow | null>`
Creates a new note.
- Supports title, content, category, icon, isPinned
- Optimistically updates UI
- Returns created note or null on error

---

### `useDailyRollover({ userId, tasks, notesReady, tasksReady })`
**Location:** `mobile/src/features/tasks/components/useDailyRollover.ts`

Manages automatic daily rollover of tasks and notes.

**Helper Functions:**

#### `parseTags(value): string[]`
Parses tags from string or array format.

#### `isTaskArchived(task): boolean`
Checks if a task is archived.

#### `buildArchivedTags(task): string[]`
Builds archive metadata tags from task.

#### `resolveTaskDate(task): Date`
Resolves the effective date for a task (due_date or created_at).

#### `toLocalDateKey(date): string`
Converts Date to 'yyyy-MM-dd' string format.

#### `resolveTaskDateKey(task): string`
Gets date key for task's effective date.

#### `findTaskBacklogKey(taskList, todayKey): string`
Finds the backlog key (previous day) for tasks.

#### `buildDailyLogContent(taskList): string`
Builds formatted daily log content from task list.

#### `findExistingDailyLog(userId, todayKey): Promise<NoteRow | null>`
Finds existing daily log note for today.

#### `ensureDailyLog({ userId, tasks, todayKey, backlogKey }): Promise<void>`
Ensures a daily log exists, creating or updating as needed.

**Function Flow:**
- Runs when tasks or notes are ready
- Creates/updates daily log entries automatically
- Manages backlog entries for past tasks

---

### `useTaskStats(tasks: TaskRow[]): TaskStats`
**Location:** `mobile/src/features/tasks/components/useTaskStats.ts`

Calculates statistics about tasks.

**Returns:**
- Task completion statistics
- Counts of completed vs pending tasks

---

## Finance Management

### `listFinanceEntries(options?): Promise<{ entries, error }>`
**Location:** `mobile/src/lib/financeEntries.ts`

Fetches finance entries using Supabase Edge Function.

**Parameters:**
- `options.limit`: Maximum number of entries (default: 100)
- `options.accountId`: Filter by account ID

**Function Flow:**
1. Validates user session
2. Calls `finance-entries` Edge Function
3. Returns entries array or error message

---

### `createFinanceEntry(input): Promise<{ id, error }>`
**Location:** `mobile/src/lib/financeEntries.ts`

Creates a new finance entry.

**Parameters:**
- `input.amount`: Transaction amount (number)
- `input.category`: Category string
- `input.note`: Optional note
- `input.account_id`: Optional account ID
- `input.to_account_id`: For transfers
- `input.type`: 'transfer' | 'income' | 'expense' | 'goal'

**Returns:** Entry ID or error message

---

### `useFinanceData({ user, refreshToken })`
**Location:** `mobile/src/features/finance/hooks/useFinanceData.ts`

Comprehensive hook for managing finance data.

**State:**
- `accounts`: Array of finance accounts
- `goals`: Array of savings goals
- `transactions`: Array of processed transactions
- `rawEntries`: Raw finance entries
- `bills`: Array of recurring bills
- `subscriptions`: Array of subscriptions

**Loading States:** Separate loading flags for each data type

**Fetch Methods:**

#### `fetchAccounts(): Promise<void>`
Fetches accounts from `finance_accounts` table.

#### `fetchGoals(): Promise<void>`
Fetches goals from `finance_goals` table.

#### `fetchEntries(): Promise<void>`
Fetches entries using `listFinanceEntries` and transforms them.

#### `fetchBills(): Promise<void>`
Fetches bills from `finance_bills` table.

#### `fetchSubscriptions(): Promise<void>`
Fetches subscriptions from `finance_subscriptions` table.

**CRUD Operations:**

#### Account Management:
- `createAccount(payload)`: Creates new account
- `updateAccount(id, payload)`: Updates account details
- `deleteAccount(id)`: Deletes account

#### Goal Management:
- `createGoal(payload)`: Creates savings goal
- `deleteGoal(goalId)`: Deletes goal

#### Bill Management:
- `createBill(input)`: Creates recurring bill
- `updateBill(id, input)`: Updates bill
- `deleteBill(id)`: Deletes bill

#### Subscription Management:
- `createSubscription(input)`: Creates subscription
- `updateSubscription(id, input)`: Updates subscription
- `deleteSubscription(id)`: Deletes subscription

#### Entry Management:
- `deleteFinanceEntry(id)`: Deletes transaction
- `updateEntryCategory(id, category)`: Updates transaction category

**Function Flow:**
- Automatically fetches all data on mount or when refreshToken changes
- Transforms raw entries into transaction objects with metadata
- Handles currency, date formatting, and icon assignment

---

### `useFinanceInsights({ rawEntries, transactions, bills, subscriptions, cardRanges, user })`
**Location:** `mobile/src/features/finance/hooks/useFinanceInsights.ts`

Hook that calculates insights and analytics from finance data.

**Calculation Methods:**

#### `summarizeEntriesForRange(range, anchorDate?): { spent, income, net }`
Calculates spending, income, and net for a time range.

#### `buildCategoryTotals(range, anchorDate?): Array<{ name, amount }>`
Aggregates spending by category for a range.

#### `buildBudgetTarget(range, currentSpent): number`
Calculates budget target based on historical averages (4 periods back).

#### `buildSpendChart(range, budgetTotal): { points, maxValue }`
Builds chart data for spending visualization.

**Computed Values:**

- `thisWeekSummary`: Current period spending summary
- `weeklyBudget`: Calculated budget for current period
- `weeklyProgress`: Budget utilization percentage
- `thisWeekChart`: Chart data for weekly view
- `weeklyCategories`: Top spending categories
- `weeklyInsight`: Textual insight about spending patterns
- `incomeDelta`, `netDelta`: Comparison indicators with previous period
- `topCategories`: Top 2 spending categories
- `topCategoriesInsight`: Insight about category spending
- `subscriptionsSummary`: Aggregated subscription costs
- `subscriptionsInsight`: Text about next renewal
- `subscriptionShare`: Percentage of income going to subscriptions
- `upcomingBills`: Bills due in selected range
- `upcomingBillsInsight`: Text about next bill
- `filteredTransactions`: Transactions filtered by range
- `activityInsight`: Text about recent activity

**Function Flow:**
- Processes raw entries to calculate insights
- Supports different time ranges (week, month, year)
- Compares current vs previous periods
- Identifies anomalies and trends

---

## Utility Functions

### `formatCurrency(value, currency): string`
**Location:** `mobile/src/utils/formatters.ts`

Formats a number as currency using Intl.NumberFormat.

**Parameters:**
- `value`: Number to format
- `currency`: Currency code (default: 'USD')

**Returns:** Formatted currency string (e.g., "$1,234.56")

---

### `sanitizeText(input): string`
**Location:** `mobile/src/utils/sanitize.ts`

Removes HTML-like characters from text.

**Function:** Removes `<` and `>` characters for XSS prevention

**Returns:** Sanitized string

---

### `getTodoCompleted(content): boolean`
**Location:** `mobile/src/utils/todo.ts`

Extracts completion status from todo content object.

**Checks:** `content.completed` or `content.done` properties

**Returns:** Boolean completion status

---

## Navigation

### `RootNavigator()`
**Location:** `mobile/src/navigation/RootNavigator.tsx`

Root navigation component that sets up the main navigation structure.

**Function:** Configures stack or tab navigation for the app

---

### `TabNavigator()`
**Location:** `mobile/src/navigation/TabNavigator.tsx`

Bottom tab navigation component.

**Tabs:**
- Home
- Tasks
- Habits
- Finance
- Settings

**Configuration:**
- Header hidden
- Tab bar hidden (uses floating navigation instead)

---

## Data Flow Patterns

### General Pattern
1. **Hooks** manage state and Supabase operations
2. **Context Providers** wrap hooks and provide to app tree
3. **Components** consume context via custom hooks (e.g., `useTasks()`, `useSettings()`)
4. **Screens** render feature views wrapped in layout components

### Error Handling
- Most functions return error messages as strings (null = success)
- State includes `error` and `loading` flags
- Graceful degradation when Supabase is unavailable
- Optimistic updates with rollback on failure

### Loading States
- Separate loading flags for different data types
- Auth loading merged with feature loading where appropriate
- Components check loading state before rendering data

### State Synchronization
- Local state updated optimistically for instant UI feedback
- Background sync to Supabase for persistence
- Manual refresh functions available for all data types

---

## Environment Requirements

### Required Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

### Supabase Tables Expected
- `tasks` - Task items
- `habits` - Habit definitions
- `habit_logs` - Habit completion records
- `finance_entries` - Financial transactions
- `finance_accounts` - Bank/account definitions
- `finance_goals` - Savings goals
- `finance_bills` - Recurring bills
- `finance_subscriptions` - Subscriptions
- `user_settings` - User preferences
- `notes` - User notes

### Edge Functions Expected
- `finance-entries` - Finance entry CRUD operations

---

## Notes

- All async operations handle Supabase unavailability gracefully
- Type safety enforced via TypeScript throughout
- Most hooks include cleanup to prevent memory leaks
- Date handling uses `date-fns` library
- Storage uses AsyncStorage for React Native compatibility

