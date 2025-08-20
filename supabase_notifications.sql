-- Supabase Notifications RPC setup
-- This file creates helper functions for notifications without touching existing tables.
-- Run this in your Supabase SQL editor.

-- Function: create a notification for a target user (bypasses RLS)
create or replace function public.create_notification(
  target_user uuid,
  title_param text,
  message_param text,
  type_param text
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.notifications (user_id, title, message, type, read)
  values (target_user, title_param, message_param, type_param, false);
end;
$$;

grant execute on function public.create_notification(uuid, text, text, text) to anon, authenticated;

-- Function: fetch notifications for a user (bypasses RLS)
create or replace function public.get_notifications_for_user(
  target_user uuid
) returns setof public.notifications
language sql
security definer
stable
as $$
  select *
    from public.notifications
   where user_id = target_user
   order by created_at desc
$$;

grant execute on function public.get_notifications_for_user(uuid) to anon, authenticated;

-- Function: mark a single notification as read
create or replace function public.mark_notification_read(
  target_id uuid
) returns public.notifications
language plpgsql
security definer
as $$
declare
  rec public.notifications;
begin
  update public.notifications
     set read = true
   where id = target_id
   returning * into rec;
  return rec;
end;
$$;

grant execute on function public.mark_notification_read(uuid) to anon, authenticated;

-- Function: mark all notifications as read for a user
create or replace function public.mark_all_notifications_read(
  target_user uuid
) returns void
language plpgsql
security definer
as $$
begin
  update public.notifications
     set read = true
   where user_id = target_user
     and read = false;
end;
$$;

grant execute on function public.mark_all_notifications_read(uuid) to anon, authenticated;

-- Notes:
-- - These functions assume a table public.notifications with columns:
--   id uuid default gen_random_uuid() primary key,
--   user_id uuid not null,
--   title text not null,
--   message text not null,
--   type text check (type in ('success','error','warning','info')) not null,
--   read boolean not null default false,
--   created_at timestamptz not null default now();
-- - SECURITY DEFINER lets your client call these even with strict RLS on the table.
-- - Be sure your postgres function owner has permission to insert/select/update the table.
