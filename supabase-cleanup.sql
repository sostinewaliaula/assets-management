-- =====================================================
-- SUPABASE CLEANUP SCRIPT
-- Remove all existing tables, functions, triggers, and policies
-- =====================================================

-- Drop triggers first (if they exist)
DROP TRIGGER IF EXISTS trigger_update_user_count ON users;
DROP TRIGGER IF EXISTS trigger_update_asset_stats ON assets;

-- Drop functions (if they exist)
DROP FUNCTION IF EXISTS update_department_user_count() CASCADE;
DROP FUNCTION IF EXISTS update_department_asset_stats() CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS asset_maintenance CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop indexes (if they exist)
DROP INDEX IF EXISTS idx_departments_name;
DROP INDEX IF EXISTS idx_departments_location;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_department;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_assets_serial;
DROP INDEX IF EXISTS idx_assets_department;
DROP INDEX IF EXISTS idx_assets_assigned;
DROP INDEX IF EXISTS idx_assets_status;
DROP INDEX IF EXISTS idx_assets_type;
DROP INDEX IF EXISTS idx_assets_category;
DROP INDEX IF EXISTS idx_issues_status;
DROP INDEX IF EXISTS idx_issues_priority;
DROP INDEX IF EXISTS idx_issues_reported_by;
DROP INDEX IF EXISTS idx_issues_assigned_to;
DROP INDEX IF EXISTS idx_issues_asset;
DROP INDEX IF EXISTS idx_maintenance_asset;
DROP INDEX IF EXISTS idx_maintenance_date;

-- Cleanup complete
SELECT 'Cleanup completed successfully! All tables, functions, and triggers removed.' as status;
