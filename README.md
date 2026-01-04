# Rhythm - Minimalist Mobile Life Tracker

Rhythm is a mobile-first "Life OS" that unifies tasks, habits, notes, and finances in a single, focused interface. It is designed for fast capture and clean visuals, with a phone-sized UI and Supabase-backed data.

## Highlights
- Unified capture for tasks, habits, finance entries, and quick notes
- Habit views for daily, weekly, monthly, and yearly rhythm tracking
- Finance dashboard with goals and activity timeline
- Phone-sized layout (390x844) to stay focused on what matters
- Supabase-backed persistence for tasks, habits, and finance

## Tech Stack
- React 19 + TypeScript + Vite
- Tailwind CSS
- Supabase (auth + database)
- Lucide icons

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Supabase Expectations
Rhythm expects a signed-in Supabase session for tasks, habits, and finance data.

Tables and columns used:
- `tasks`: `id`, `user_id`, `title`, `completed`, `created_at`
- `habits`: `id`, `user_id`, `title`, `frequency`, `created_at`
- `finance_entries`: `id`, `user_id`, `amount`, `category`, `note`, `created_at`

Recommended:
- Enable Row Level Security (RLS).
- Add policies that scope read/write to `auth.uid() = user_id`.

Notes:
- Pages and quick notes are currently stored in local client state (not persisted).

## Scripts
- `npm run dev` - start local dev server
- `npm run build` - typecheck and build for production
- `npm run lint` - run ESLint
- `npm run preview` - preview the production build

## Project Structure
- `src/features` - feature views and capture flows
- `src/components` - shared UI building blocks
- `src/hooks` - shared hooks (Supabase session)
- `src/lib` - external client setup (Supabase)
- `src/utils` - small utilities and sanitizers

## License
See `LICENSE`.
