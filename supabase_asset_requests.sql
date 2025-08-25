-- supabase_asset_requests.sql
-- Asset Requests Table and Policies for Asset Management System

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- Drop the table if it exists (for idempotency in dev/test)
drop table if exists public.asset_requests cascade;

-- Create the asset_requests table
drop sequence if exists asset_requests_id_seq;
create table public.asset_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    title text not null,
    description text not null,
    type text not null,
    priority text not null,
    department_id uuid references public.departments(id),
    status text not null default 'Pending',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_asset_requests_user_id on public.asset_requests(user_id);
create index if not exists idx_asset_requests_department_id on public.asset_requests(department_id);

-- Enable Row Level Security
alter table public.asset_requests enable row level security;

-- TEMPORARY: Allow all inserts for debugging (remove after confirming feature works)
drop policy if exists "allow all inserts" on public.asset_requests;
create policy "allow all inserts" on public.asset_requests
    for insert
    with check (true);

-- Allow users to select their own requests
drop policy if exists "user can select own requests" on public.asset_requests;
create policy "user can select own requests" on public.asset_requests
    for select
    using (auth.uid()::uuid = user_id);

-- Allow admins/managers to select all requests (optional, adjust as needed)
drop policy if exists "admin can select all requests" on public.asset_requests;
create policy "admin can select all requests" on public.asset_requests
    for select
    using (EXISTS (
        select 1 from public.users u
        where u.id = auth.uid()::uuid
        and (u.role = 'admin' or u.role = 'department_officer')
    ));

-- Allow users to update their own requests (optional)
drop policy if exists "user can update own requests" on public.asset_requests;
create policy "user can update own requests" on public.asset_requests
    for update
    using (auth.uid()::uuid = user_id);

-- Allow admins/managers to update all requests (optional)
drop policy if exists "admin can update all requests" on public.asset_requests;
create policy "admin can update all requests" on public.asset_requests
    for update
    using (EXISTS (
        select 1 from public.users u
        where u.id = auth.uid()::uuid
        and (u.role = 'admin' or u.role = 'department_officer')
    ));
