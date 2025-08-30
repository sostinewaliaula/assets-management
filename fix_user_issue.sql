-- Fix User Issue in Supabase
-- This script addresses the ID mismatch between auth.users and public.users tables

-- First, check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@turnkeyafrica.com';

-- Check if the user exists in the users table
SELECT id, email, role, created_at 
FROM users 
WHERE email = 'admin@turnkeyafrica.com';

-- If the user doesn't exist in the users table, insert them
-- Note: We don't use the auth.users ID, we let the users table generate its own ID
INSERT INTO users (email, role, created_at)
SELECT 
    email,
    'admin' as role,
    created_at
FROM auth.users 
WHERE email = 'admin@turnkeyafrica.com'
AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.email = auth.users.email
);

-- Verify the user was added
SELECT id, email, role, created_at 
FROM users 
WHERE email = 'admin@turnkeyafrica.com';

-- Check all users in the system
SELECT id, email, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- First, we need to update the backups table schema to use email instead of UUID
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own backups" ON backups;
DROP POLICY IF EXISTS "Admins can view all backups" ON backups;
DROP POLICY IF EXISTS "Only admins can create backups" ON backups;
DROP POLICY IF EXISTS "Only admins can update backups" ON backups;
DROP POLICY IF EXISTS "Only admins can delete backups" ON backups;

-- Drop the foreign key constraint first (if it exists)
ALTER TABLE backups 
DROP CONSTRAINT IF EXISTS backups_created_by_fkey;

-- Update the created_by column to use VARCHAR instead of UUID
ALTER TABLE backups 
ALTER COLUMN created_by TYPE VARCHAR(255);

-- Create new policies using email
CREATE POLICY "Users can view their own backups" ON backups
    FOR SELECT USING (auth.jwt() ->> 'email' = created_by);

CREATE POLICY "Admins can view all backups" ON backups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt() ->> 'email'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can create backups" ON backups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt() ->> 'email'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can update backups" ON backups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt() ->> 'email'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete backups" ON backups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt() ->> 'email'
            AND users.role = 'admin'
        )
    );
