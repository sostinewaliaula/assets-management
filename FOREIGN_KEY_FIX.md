# Fix: Foreign Key Constraint Error

## **The Error:**
```
ERROR: 42804: foreign key constraint "backups_created_by_fkey" cannot be implemented
DETAIL: Key columns "created_by" and "id" are of incompatible types: character varying and uuid.
```

## **What This Means:**
The `backups` table has a foreign key constraint that tries to link `created_by` to the `auth.users` table's `id` field. But we're changing `created_by` from UUID to VARCHAR (email), which breaks this constraint.

## **The Fix:**

### **Step 1: Drop the Foreign Key Constraint**
Run this SQL command first:

```sql
-- Drop the foreign key constraint
ALTER TABLE backups 
DROP CONSTRAINT IF EXISTS backups_created_by_fkey;
```

### **Step 2: Then Run the Full Fix Script**
Now run the complete script from `QUICK_FIX_GUIDE.md` which includes:

1. **Drop the constraint** (already done in step 1)
2. **Change column type** from UUID to VARCHAR
3. **Update RLS policies** to use email-based access
4. **Add user to users table** if missing

## **Why This Happens:**
- The original table was created with a foreign key to `auth.users(id)`
- We're changing the approach to use email instead of UUID
- PostgreSQL can't change a column type if it has foreign key constraints

## **Alternative: Complete Table Recreation**
If you prefer to start fresh, you can drop and recreate the table:

```sql
-- Drop the existing table (WARNING: This will delete all existing backups)
DROP TABLE IF EXISTS backups;

-- Then run the migration script from src/database/migrations/create_backups_table.sql
```

## **Verification:**
After running the fix, verify the table structure:

```sql
-- Check the column type
\d backups

-- Check that the constraint is gone
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'backups'::regclass;
```

The backup system should now work correctly with email-based user identification!
