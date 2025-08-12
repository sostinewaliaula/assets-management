-- Simplified migration to fix RLS recursion issues
-- This removes all recursive policies and replaces them with simple ones

-- First, drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Managers can view department users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
DROP POLICY IF EXISTS "Users can view relevant assets" ON assets;
DROP POLICY IF EXISTS "Users can view relevant issues" ON issues;
DROP POLICY IF EXISTS "Users can view relevant maintenance" ON asset_maintenance;
DROP POLICY IF EXISTS "Admins can manage all data" ON departments;
DROP POLICY IF EXISTS "Admins can manage all data" ON assets;
DROP POLICY IF EXISTS "Admins can manage all data" ON issues;
DROP POLICY IF EXISTS "Admins can manage all data" ON asset_maintenance;

-- Also drop the new policies we're about to create (in case they already exist)
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "departments_select_authenticated" ON departments;
DROP POLICY IF EXISTS "assets_select_authenticated" ON assets;
DROP POLICY IF EXISTS "issues_select_authenticated" ON issues;
DROP POLICY IF EXISTS "maintenance_select_authenticated" ON asset_maintenance;
DROP POLICY IF EXISTS "users_all_operations" ON users;
DROP POLICY IF EXISTS "departments_all_operations" ON departments;
DROP POLICY IF EXISTS "assets_all_operations" ON assets;
DROP POLICY IF EXISTS "issues_all_operations" ON issues;
DROP POLICY IF EXISTS "maintenance_all_operations" ON asset_maintenance;

-- Add auth_id column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Simple, non-recursive policies for authenticated users
CREATE POLICY "users_select_authenticated" ON users
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "departments_select_authenticated" ON departments
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "assets_select_authenticated" ON assets
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "issues_select_authenticated" ON issues
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "maintenance_select_authenticated" ON asset_maintenance
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow all operations for now (we can add more restrictive policies later)
CREATE POLICY "users_all_operations" ON users
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "departments_all_operations" ON departments
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "assets_all_operations" ON assets
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "issues_all_operations" ON issues
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "maintenance_all_operations" ON asset_maintenance
FOR ALL USING (auth.uid() IS NOT NULL);

-- Display completion message
SELECT 'Simplified migration completed successfully!' as status;
SELECT 'All recursive policies removed' as change_1;
SELECT 'Simple authenticated-only policies added' as change_2;
SELECT 'auth_id column and index created' as change_3;
