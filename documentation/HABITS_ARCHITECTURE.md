# Habits Feature Architecture - Mobile App

## 📁 Tree Structure

```
mobile/src/
├── App.tsx                          # Root app component
│   └── HabitsProvider                # Context provider wrapper
│
├── navigation/
│   ├── RootNavigator.tsx           # Stack navigator
│   └── TabNavigator.tsx            # Tab navigator (Habits tab)
│
├── screens/
│   └── HabitsScreen.tsx            # Screen container
│       ├── FloatingLayout          # Layout with FAB
│       ├── HabitsView              # Main view component
│       └── HabitCaptureModal       # Create habit modal
│
├── features/habits/
│   ├── HabitsView.tsx              # Main display component
│   ├── HabitCaptureModal.tsx       # Create/edit habit modal
│   ├── components/
│   │   ├── HabitModal.tsx
│   │   └── WeeklyGrid.tsx
│   └── hooks/
│       └── useHabitLogic.ts        # (Currently empty)
│
├── store/
│   └── habitsProvider.tsx          # Context provider + state management
│
├── hooks/
│   └── useAuth.ts                  # Auth hook
│
└── lib/
    └── supabase.ts                 # Supabase client setup
```

## 🔐 Supabase Authentication Flow

### 1. **Initialization** (`lib/supabase.ts`)
```typescript
- Creates Supabase client with AsyncStorage for persistence
- Uses EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
- Configures auth with:
  - autoRefreshToken: true
  - persistSession: true
  - detectSessionInUrl: false (mobile)
```

### 2. **Auth Hook** (`hooks/useAuth.ts`)
```typescript
Flow:
1. On mount: Check if Supabase is configured
2. Get current session: supabase.auth.getSession()
3. Set up listener: onAuthStateChange() for real-time updates
4. Returns: { user, loading }
```

### 3. **Auth Context** (`store/authContext.tsx`)
```typescript
- Simple context wrapper for auth state
- Provides user and loading state to children
```

### 4. **Integration in Habits**
- `HabitsProvider` uses `useAuth()` hook
- Only fetches habits when `user.id` exists
- All Supabase queries filter by `user_id`

## 🔄 How Habits React to Changes

### **State Management Flow**

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │         HabitsProvider                           │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │  useAuth() → gets user.id                 │   │   │
│  │  │  useHabitsInternal(userId)                │   │   │
│  │  │    ├─ State: habits[], habitLogs[]        │   │   │
│  │  │    ├─ State: loading, error               │   │   │
│  │  │    └─ Methods:                            │   │   │
│  │  │        - fetchHabits()                    │   │   │
│  │  │        - toggleHabitToday()                │   │   │
│  │  │        - deleteHabit()                     │   │   │
│  │  │        - refreshHabits()                   │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              HabitsScreen.tsx                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  HabitsView (consumes useHabits())               │   │
│  │    ├─ Reads: habits, habitLogs, loading, error  │   │
│  │    ├─ Calls: toggleHabitToday(), deleteHabit()   │   │
│  │    └─ Transforms data for display                │   │
│  │                                                   │   │
│  │  HabitCaptureModal                               │   │
│  │    └─ Calls: supabase.from('habits').insert()    │   │
│  │    └─ Triggers: onSaved() → refreshToken++      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### **Reactive Updates**

#### 1. **Initial Load**
```typescript
HabitsProvider:
  useEffect(() => {
    fetchHabits() // When userId changes
  }, [userId])

fetchHabits():
  - Queries: habits table (filtered by user_id)
  - Queries: habit_logs table (filtered by user_id)
  - Updates: habits[], habitLogs[] state
  - Sets: loading = false
```

#### 2. **Toggle Habit (Optimistic Updates)**
```typescript
toggleHabitToday(habitId):
  1. IMMEDIATE (Optimistic):
     - Updates habitLogs[] state locally
     - UI updates instantly
  
  2. BACKGROUND (Sync):
     - If completed: DELETE from habit_logs
     - If not completed: INSERT into habit_logs
     - On error: Revert optimistic update
     - On success: Refresh to get real IDs
```

#### 3. **Create Habit**
```typescript
HabitCaptureModal.handleSave():
  1. INSERT into habits table
  2. onSaved() callback
  3. HabitsScreen: refreshToken++
  4. HabitsView: useEffect watches refreshToken
  5. Calls refreshHabits() → fetches new data
```

#### 4. **Delete Habit**
```typescript
deleteHabit(habitId):
  1. IMMEDIATE (Optimistic):
     - Removes from habits[] state
     - Removes related logs from habitLogs[]
  
  2. BACKGROUND (Sync):
     - DELETE from habit_logs (cascade)
     - DELETE from habits
     - On error: Revert optimistic update
```

### **Data Transformation**

```typescript
HabitsView transforms provider data:
  habitsData (HabitRow[]) + habitLogs (HabitLogRow[])
    ↓
  habits (HabitEntry[])
    - id, name, meta, color
    - completedDates: Set<string> (date keys like "2024-01-15")
```

## 📊 Database Schema

### **Tables**

#### `habits`
```sql
- id: uuid (PK)
- user_id: uuid (FK to auth.users)
- title: text
- frequency: text (e.g., "Daily", "3x Week", "Weekly")
- active: boolean
- created_at: timestamp
- updated_at: timestamp
```

#### `habit_logs`
```sql
- id: uuid (PK)
- habit_id: uuid (FK to habits)
- user_id: uuid (FK to auth.users)
- completed_on: date (YYYY-MM-DD format)
- completed_at: timestamp
- created_at: timestamp
```

## 🎨 UI Views & Reactions

### **Daily View**
- Shows current streak (calculated from habitLogs)
- List of habits with checkboxes
- Toggle updates immediately (optimistic)
- Long press → delete confirmation

### **Weekly View**
- 7-day grid for each habit
- Shows completion count (X/7 days)
- Visual grid with filled/unfilled cells

### **Monthly View**
- Calendar grid (7 columns × ~4-5 rows)
- Shows days active in current month
- Calculates cell size dynamically

### **Yearly View**
- 12-month bar chart
- Shows completion percentage per month
- Annual completion count (X/365 days)

## 🔄 Real-time Behavior

### **Auth State Changes**
```typescript
onAuthStateChange listener:
  - When user logs in → userId changes → fetchHabits() triggers
  - When user logs out → userId = null → habits cleared
```

### **Optimistic Updates**
- All mutations (toggle, delete) update UI immediately
- Background sync happens asynchronously
- Errors trigger rollback to previous state

### **Loading States**
```typescript
loading = authLoading || habitsLoading
- Shows "Loading habits..." while fetching
- Shows error message if fetch fails
- Shows "No habits yet." if empty
```

## 🛡️ Error Handling

1. **Supabase Not Configured**
   - `isSupabaseConfigured` check
   - Returns empty arrays, no errors

2. **Fetch Errors**
   - Sets error state
   - Shows error message in UI
   - Doesn't crash app

3. **Mutation Errors**
   - Reverts optimistic update
   - Shows error message
   - Previous state restored

4. **No User**
   - Returns empty arrays
   - Disables mutations
   - Shows appropriate UI state

## 🔗 Key Dependencies

- `@supabase/supabase-js` - Database client
- `@react-native-async-storage/async-storage` - Auth persistence
- `date-fns` - Date manipulation
- `react-native` - Core components
- `expo-blur` - Blur effects
- `lucide-react-native` - Icons

## 📝 Key Functions

### **HabitsProvider**
- `fetchHabits()` - Loads habits and logs from Supabase
- `toggleHabitToday()` - Toggles completion with optimistic update
- `deleteHabit()` - Deletes habit and logs
- `refreshHabits()` - Manual refresh trigger
- `isHabitCompletedToday()` - Check completion status
- `getHabitStreak()` - Calculate streak count

### **HabitsView**
- `getCurrentStreak()` - Calculates max streak across habits
- `countDatesWithPrefix()` - Counts dates in time period
- `toDateKey()` - Converts Date to "YYYY-MM-DD" string

### **HabitCaptureModal**
- `handleSave()` - Creates new habit in Supabase
- Validates input, sanitizes text
- Requires authenticated user

