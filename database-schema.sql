-- Issue Comments table for Issue Management System
-- This table stores comments on issues (already exists as issue_comments)

-- Note: The issue_comments table already exists in your database
-- This file shows the structure for reference

-- Table structure (already created):
-- CREATE TABLE issue_comments (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
--   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   content TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Create indexes for better performance (if not already created)
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_user_id ON issue_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created_at ON issue_comments(created_at);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view comments on accessible issues" ON issue_comments;
DROP POLICY IF EXISTS "Users can create comments on accessible issues" ON issue_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON issue_comments;
DROP POLICY IF EXISTS "Users can delete their own comments, admins can delete any" ON issue_comments;

-- Create RLS policies
-- Users can view comments on issues they have access to
CREATE POLICY "Users can view comments on accessible issues" ON issue_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM issues i
      WHERE i.id = issue_comments.issue_id
      AND (
        i.reported_by = auth.uid() OR
        i.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      )
    )
  );

-- Users can create comments on issues they have access to
CREATE POLICY "Users can create comments on accessible issues" ON issue_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM issues i
      WHERE i.id = issue_comments.issue_id
      AND (
        i.reported_by = auth.uid() OR
        i.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      )
    )
    AND user_id = auth.uid()
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON issue_comments
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own comments, admins can delete any comment
CREATE POLICY "Users can delete their own comments, admins can delete any" ON issue_comments
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_issue_comments_updated_at ON issue_comments;
CREATE TRIGGER update_issue_comments_updated_at
  BEFORE UPDATE ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create notification helper function (RPC)
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

revoke all on function public.create_notification(uuid, text, text, text) from public;
grant execute on function public.create_notification(uuid, text, text, text) to anon, authenticated;

-- RPC to fetch notifications for a specific user (bypasses RLS)
create or replace function public.get_notifications_for_user(target_user uuid)
returns setof public.notifications
language sql
security definer
stable
as $$
  select * from public.notifications
  where user_id = target_user
  order by created_at desc
$$;

grant execute on function public.get_notifications_for_user(uuid) to anon, authenticated;

-- RPC to mark single notification as read
create or replace function public.mark_notification_read(target_id uuid)
returns public.notifications
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

-- RPC to mark all notifications as read for a user
create or replace function public.mark_all_notifications_read(target_user uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.notifications set read = true where user_id = target_user and read = false;
end;
$$;

grant execute on function public.mark_all_notifications_read(uuid) to anon, authenticated;
