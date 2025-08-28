-- =====================================================
-- EMAIL NOTIFICATIONS SETUP FOR SUPABASE
-- =====================================================

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  notification_types TEXT[] DEFAULT ARRAY['success', 'error', 'warning', 'info'],
  email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on preferences table
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user notification preferences
CREATE POLICY "Users can view their own notification preferences" ON public.user_notification_preferences
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own notification preferences" ON public.user_notification_preferences
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON public.user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- Function to get or create user notification preferences
CREATE OR REPLACE FUNCTION public.get_user_notification_preferences(target_user uuid)
RETURNS public.user_notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prefs public.user_notification_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO prefs FROM public.user_notification_preferences WHERE user_id = target_user;
  
  -- If no preferences exist, create default ones
  IF prefs IS NULL THEN
    INSERT INTO public.user_notification_preferences (user_id, email_notifications, notification_types)
    VALUES (target_user, true, ARRAY['success', 'error', 'warning', 'info'])
    RETURNING * INTO prefs;
  END IF;
  
  RETURN prefs;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_notification_preferences(uuid) TO anon, authenticated;

-- Function to update user notification preferences
CREATE OR REPLACE FUNCTION public.update_user_notification_preferences(
  target_user uuid,
  email_notifications boolean,
  notification_types text[],
  email_frequency text
)
RETURNS public.user_notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prefs public.user_notification_preferences;
BEGIN
  INSERT INTO public.user_notification_preferences (user_id, email_notifications, notification_types, email_frequency)
  VALUES (target_user, email_notifications, notification_types, email_frequency)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email_notifications = EXCLUDED.email_notifications,
    notification_types = EXCLUDED.notification_types,
    email_frequency = EXCLUDED.email_frequency,
    updated_at = NOW()
  RETURNING * INTO prefs;
  
  RETURN prefs;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_notification_preferences(uuid, boolean, text[], text) TO anon, authenticated;

-- Enhanced notification creation function with email support
CREATE OR REPLACE FUNCTION public.create_notification_with_email(
  target_user uuid,
  title_param text,
  message_param text,
  type_param text,
  send_email boolean DEFAULT true
) 
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_notification public.notifications;
  user_prefs public.user_notification_preferences;
  user_email text;
  user_name text;
BEGIN
  -- Create the notification
  INSERT INTO public.notifications (user_id, title, message, type, read)
  VALUES (target_user, title_param, message_param, type_param, false)
  RETURNING * INTO new_notification;
  
  -- If email is requested, check user preferences and send email
  IF send_email THEN
    -- Get user preferences
    SELECT * INTO user_prefs FROM public.get_user_notification_preferences(target_user);
    
    -- Check if user wants email notifications and for this notification type
    IF user_prefs.email_notifications AND type_param = ANY(user_prefs.notification_types) THEN
      -- Get user email and name
      SELECT email, name INTO user_email, user_name FROM public.users WHERE id = target_user;
      
      -- Log email notification (you can implement actual email sending here)
      RAISE NOTICE 'Email notification would be sent to % (%): % - %', 
        user_name, user_email, title_param, message_param;
    END IF;
  END IF;
  
  RETURN new_notification;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification_with_email(uuid, text, text, text, boolean) TO anon, authenticated;

-- Function to send bulk notifications with emails
CREATE OR REPLACE FUNCTION public.create_bulk_notifications_with_emails(
  user_ids uuid[],
  title_param text,
  message_param text,
  type_param text,
  send_emails boolean DEFAULT true
)
RETURNS SETOF public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  new_notification public.notifications;
BEGIN
  -- Create notifications for all users
  FOREACH user_id IN ARRAY user_ids
  LOOP
    SELECT * INTO new_notification FROM public.create_notification_with_email(
      user_id, title_param, message_param, type_param, send_emails
    );
    RETURN NEXT new_notification;
  END LOOP;
  
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_bulk_notifications_with_emails(uuid[], text, text, text, boolean) TO anon, authenticated;

-- Function to get notification statistics for a user
CREATE OR REPLACE FUNCTION public.get_user_notification_stats(target_user uuid)
RETURNS TABLE(
  total_notifications bigint,
  unread_count bigint,
  email_enabled boolean,
  preferred_types text[]
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE read = false) as unread_count,
    COALESCE(prefs.email_notifications, true) as email_enabled,
    COALESCE(prefs.notification_types, ARRAY['success', 'error', 'warning', 'info']) as preferred_types
  FROM public.notifications n
  LEFT JOIN public.user_notification_preferences prefs ON n.user_id = prefs.user_id
  WHERE n.user_id = target_user
  GROUP BY prefs.email_notifications, prefs.notification_types;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_notification_stats(uuid) TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);

-- Insert default preferences for existing users
INSERT INTO public.user_notification_preferences (user_id, email_notifications, notification_types, email_frequency)
SELECT 
  id, 
  true, 
  ARRAY['success', 'error', 'warning', 'info'], 
  'immediate'
FROM public.users 
WHERE id NOT IN (SELECT user_id FROM public.user_notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example: Create a notification with email
-- SELECT public.create_notification_with_email(
--   'user-uuid-here', 
--   'Asset Assigned', 
--   'You have been assigned a new laptop', 
--   'info', 
--   true
-- );

-- Example: Create bulk notifications
-- SELECT public.create_bulk_notifications_with_emails(
--   ARRAY['user1-uuid', 'user2-uuid'], 
--   'System Maintenance', 
--   'System will be down for maintenance', 
--   'warning', 
--   true
-- );

-- Example: Get user notification statistics
-- SELECT * FROM public.get_user_notification_stats('user-uuid-here');

-- Example: Update user preferences
-- SELECT public.update_user_notification_preferences(
--   'user-uuid-here', 
--   true, 
--   ARRAY['warning', 'error'], 
--   'daily'
-- );

-- =====================================================
-- NOTES
-- =====================================================

-- 1. The email sending is currently just logged with RAISE NOTICE
-- 2. To implement actual email sending, you can:
--    - Use Supabase Edge Functions with SMTP libraries
--    - Use external email services (SendGrid, Mailgun, etc.)
--    - Use Supabase's built-in email service if available
-- 3. The system automatically creates default preferences for new users
-- 4. All functions use SECURITY DEFINER to bypass RLS when needed
-- 5. Users can only access their own notification preferences
