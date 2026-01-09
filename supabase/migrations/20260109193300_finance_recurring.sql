create table if not exists public.finance_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  cadence text not null check (cadence in ('weekly', 'monthly', 'yearly')),
  next_due_date date not null,
  account_id uuid null references public.finance_accounts(id) on delete set null,
  reminder_days integer null check (reminder_days >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  cadence text not null check (cadence in ('weekly', 'monthly', 'yearly')),
  next_due_date date not null,
  account_id uuid null references public.finance_accounts(id) on delete set null,
  reminder_days integer null check (reminder_days >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_bills_user_id_idx on public.finance_bills (user_id);
create index if not exists finance_bills_next_due_date_idx on public.finance_bills (next_due_date);
create index if not exists finance_subscriptions_user_id_idx on public.finance_subscriptions (user_id);
create index if not exists finance_subscriptions_next_due_date_idx on public.finance_subscriptions (next_due_date);

alter table public.finance_bills enable row level security;
alter table public.finance_subscriptions enable row level security;

create policy "finance_bills_owner"
  on public.finance_bills
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "finance_subscriptions_owner"
  on public.finance_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
