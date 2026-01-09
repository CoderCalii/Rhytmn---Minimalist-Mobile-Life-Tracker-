create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency_code text not null default 'USD' check (currency_code in ('USD', 'PHP')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_settings_user_id_idx on public.user_settings (user_id);

alter table public.user_settings enable row level security;

create policy "user_settings_owner"
  on public.user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
