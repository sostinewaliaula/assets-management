-- Migration to add auth_id column to users table
-- This links your existing users with Supabase auth.users

-- Add auth_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Update RLS policies to work with auth
DROP POLICY IF EXISTS "Allow all operations for now" ON users;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    auth_id = auth.uid() OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND role = 'admin'
    )
  );

-- Allow managers to view users in their department
CREATE POLICY "Managers can view department users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN departments d ON u1.department_id = d.id
      WHERE (u1.auth_id = auth.uid() OR u1.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND u1.role = 'manager'
      AND d.manager_id = u1.id
      AND users.department_id = d.id
    )
  );

-- Update other table policies to work with auth
DROP POLICY IF EXISTS "Allow all operations for now" ON departments;
DROP POLICY IF EXISTS "Allow all operations for now" ON assets;
DROP POLICY IF EXISTS "Allow all operations for now" ON issues;
DROP POLICY IF EXISTS "Allow all operations for now" ON asset_maintenance;

-- Departments: Allow all authenticated users to view
CREATE POLICY "Authenticated users can view departments" ON departments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Assets: Allow users to view assets in their department or assigned to them
CREATE POLICY "Users can view relevant assets" ON assets
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      department_id IN (
        SELECT department_id FROM users 
        WHERE auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
      ) OR
      assigned_to IN (
        SELECT id FROM users 
        WHERE auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Issues: Allow users to view issues they reported or are assigned to
CREATE POLICY "Users can view relevant issues" ON issues
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      reported_by IN (
        SELECT id FROM users 
        WHERE auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
      ) OR
      assigned_to IN (
        SELECT id FROM users 
        WHERE auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Maintenance: Allow users to view maintenance for assets they can access
CREATE POLICY "Users can view relevant maintenance" ON asset_maintenance
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      asset_id IN (
        SELECT id FROM assets WHERE 
          department_id IN (
            SELECT department_id FROM users 
            WHERE auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
          ) OR
          assigned_to IN (
            SELECT id FROM users 
            WHERE auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
          )
      )
    )
  );

-- Allow admins to manage all data
CREATE POLICY "Admins can manage all data" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all data" ON assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all data" ON issues
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all data" ON asset_maintenance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (auth_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND role = 'admin'
    )
  );

-- Display migration status
SELECT 'Migration completed successfully!' as status;
SELECT 'auth_id column added to users table' as change_1;
SELECT 'RLS policies updated for authentication' as change_2;
SELECT 'Index created on auth_id column' as change_3;
