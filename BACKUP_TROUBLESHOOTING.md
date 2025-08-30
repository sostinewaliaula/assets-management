# Backup System Troubleshooting Guide

## Issue: Backups not appearing in Supabase

If you're trying to create backups but nothing shows up in your Supabase database, follow these steps to diagnose and fix the issue.

## Step 1: Check Database Table

### 1.1 Verify the backups table exists
1. **Open your Supabase dashboard**
2. **Go to Table Editor**
3. **Look for a table named `backups`**
4. **If it doesn't exist, run the migration:**

```sql
-- Copy and paste this into your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    metadata JSONB NOT NULL,
    backup_data JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_backups_timestamp ON backups(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_backups_created_by ON backups(created_by);

-- Enable RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own backups" ON backups
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all backups" ON backups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can create backups" ON backups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can update backups" ON backups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete backups" ON backups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
```

## Step 2: Use the Debug Tool

### 2.1 Run the debug check
1. **Navigate to Admin → Backup Management**
2. **Click the "Debug" button** (newly added)
3. **Check the browser console** for detailed logs
4. **Look for success/error messages** in the notifications

### 2.2 What the debug tool checks:
- ✅ Backups table existence and access
- ✅ User authentication status
- ✅ User role (must be admin)
- ✅ Data table accessibility
- ✅ Backup insertion capability
- ✅ Cleanup functionality

## Step 3: Common Issues and Solutions

### Issue 1: "Table not found or access denied"
**Solution:**
- Run the SQL migration above
- Check if you're logged in as an admin user
- Verify RLS policies are applied

### Issue 2: "User must be admin to create backups"
**Solution:**
- Ensure you're logged in with an admin account
- Check your user role in the `users` table:
```sql
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
```

### Issue 3: "Failed to fetch some data"
**Solution:**
- Check if all required tables exist:
  - `assets`
  - `users`
  - `departments`
  - `issues`
  - `asset_requests`
  - `notifications`
  - `user_notification_preferences`

### Issue 4: "Failed to insert backup"
**Solution:**
- Check RLS policies are correctly applied
- Verify JSONB data types are supported
- Check for any database constraints

## Step 4: Manual Testing

### 4.1 Test table access directly
Run this in your Supabase SQL Editor:

```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'backups'
);

-- Check table structure
\d backups

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'backups';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'backups';
```

### 4.2 Test manual insertion
```sql
-- Test inserting a backup (replace with your user ID)
INSERT INTO backups (name, description, metadata, backup_data, created_by)
VALUES (
    'Test Backup',
    'Manual test backup',
    '{"totalAssets": 0, "totalUsers": 0, "totalIssues": 0, "backupSize": 100}'::jsonb,
    '{"timestamp": "2024-01-15T10:00:00Z", "version": "1.0.0", "name": "Test Backup", "tables": {}, "metadata": {}}'::jsonb,
    'your-user-id-here'
);
```

## Step 5: Browser Console Debugging

### 5.1 Check for JavaScript errors
1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Try creating a backup**
4. **Look for error messages**

### 5.2 Common console errors:
- `NetworkError`: Check Supabase connection
- `PermissionError`: Check user role and RLS policies
- `TypeError`: Check data structure issues

## Step 6: Verify Supabase Configuration

### 6.1 Check environment variables
Ensure your `.env` file has correct Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 6.2 Test Supabase connection
Add this to your browser console to test:

```javascript
// Test Supabase connection
import { supabase } from './src/lib/supabase';

// Test authentication
const { data: { user }, error } = await supabase.auth.getUser();
console.log('User:', user, 'Error:', error);

// Test table access
const { data, error } = await supabase.from('backups').select('*').limit(1);
console.log('Backups:', data, 'Error:', error);
```

## Step 7: Reset and Retry

If all else fails:

1. **Delete the backups table** (if it exists):
```sql
DROP TABLE IF EXISTS backups CASCADE;
```

2. **Re-run the migration** from Step 1.1

3. **Restart your application**

4. **Try creating a backup again**

## Getting Help

If you're still having issues:

1. **Check the browser console** for detailed error messages
2. **Run the debug tool** and share the results
3. **Check your Supabase logs** for any server-side errors
4. **Verify your user has admin role** in the system

## Expected Behavior

When working correctly, you should see:
- ✅ Debug tool shows "All backup system components are working correctly"
- ✅ Backups appear in the "Stored Backups" section
- ✅ Backups are visible in Supabase Table Editor
- ✅ No console errors during backup creation
