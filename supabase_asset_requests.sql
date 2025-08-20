-- Asset Requests table and RLS
create table if not exists public.asset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  type text not null,
  priority text not null,
  department_id uuid null references public.departments(id) on delete set null,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

alter table public.asset_requests enable row level security;

-- Policies
create policy if not exists "user can select own requests" on public.asset_requests for select using (user_id = auth.uid());
create policy if not exists "user can insert own requests" on public.asset_requests for insert with check (user_id = auth.uid());
create policy if not exists "user can update own requests" on public.asset_requests for update using (user_id = auth.uid());
-- Admins can select all: adjust if you have a role table; simple policy:
create policy if not exists "admin can select all requests" on public.asset_requests for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- Optional: index
create index if not exists idx_asset_requests_user on public.asset_requests(user_id);
create index if not exists idx_asset_requests_created on public.asset_requests(created_at);

-- Notifications (handled by app RPC create_notification).
