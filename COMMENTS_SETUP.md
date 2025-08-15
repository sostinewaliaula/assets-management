# Comments System Setup for Issue Management

This document explains how to set up the comments system for the Issue Management page in your assets management application.

## Database Setup

### 1. Comments Table Already Exists ✅

You already have the `issue_comments` table created in your database. The system is configured to use this existing table.

### 2. Update Issues Table (Optional)

If you want to track comment counts, you can add a `comment_count` field to your issues table:

```sql
-- Add comment_count column to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create a function to update comment count
CREATE OR REPLACE FUNCTION update_issue_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE issues SET comment_count = comment_count + 1 WHERE id = NEW.issue_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE issues SET comment_count = comment_count - 1 WHERE id = OLD.issue_id;
    RETURN NULL;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update comment count
CREATE TRIGGER trigger_update_comment_count_insert
  AFTER INSERT ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_comment_count();

CREATE TRIGGER trigger_update_comment_count_delete
  AFTER DELETE ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_comment_count();
```

### 3. Verify RLS Policies

Since you already have RLS policies set up, you can verify they're working correctly by running:

```sql
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'issue_comments';

-- Test if the policies work
SELECT COUNT(*) FROM issue_comments;
```

## Features Implemented

### ✅ **Real-time Comments**
- Comments are stored in the Supabase `issue_comments` table
- Full CRUD operations: Create, Read, Update, Delete
- Real-time updates when comments are added/modified

### ✅ **User Management**
- Comments are tied to authenticated users
- Users can only edit/delete their own comments
- Admins can delete any comment

### ✅ **Security**
- Row Level Security (RLS) enabled
- Users can only see comments on issues they have access to
- Proper foreign key constraints with cascade delete

### ✅ **UI Features**
- Comment count display
- Edit and delete buttons for comments
- Real-time comment updates
- Proper error handling and notifications

## Usage

### Adding Comments
1. Open an issue in the Issue Management page
2. Click "Manage" to open the issue detail modal
3. Type your comment in the "Add Comment" field
4. Press Enter or click "Comment" to submit

### Editing Comments
1. Click the edit icon (pencil) on any comment you own
2. Modify the text in the textarea
3. Click "Save" to update or "Cancel" to discard changes

### Deleting Comments
1. Click the delete icon (trash) on any comment you own
2. Confirm the deletion (admins can delete any comment)

## API Endpoints

The comments system uses the following service methods:

- `commentService.getByIssue(issueId)` - Get all comments for an issue
- `commentService.create(commentData)` - Create a new comment
- `commentService.update(id, updates)` - Update an existing comment
- `commentService.delete(id)` - Delete a comment

## Security Policies

The `issue_comments` table has the following RLS policies (already configured):

1. **View Policy**: Users can view comments on issues they have access to
2. **Create Policy**: Users can create comments on accessible issues
3. **Update Policy**: Users can only update their own comments
4. **Delete Policy**: Users can delete their own comments, admins can delete any

## Troubleshooting

### Common Issues

1. **Comments not loading**: Check if the `issue_comments` table exists and RLS policies are correct
2. **Permission denied**: Verify user authentication and access to the issue
3. **Foreign key errors**: Ensure the `issue_id` and `user_id` exist in their respective tables

### Debug Steps

1. Check Supabase logs for SQL errors
2. Verify RLS policies are working correctly
3. Test with admin user to bypass restrictions
4. Check browser console for JavaScript errors

### If You Need to Reset RLS Policies

If you encounter issues with the existing RLS policies, you can use the simplified approach from your SQL:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view comments" ON issue_comments;
DROP POLICY IF EXISTS "Allow authenticated users to insert comments" ON issue_comments;
DROP POLICY IF EXISTS "Allow users to update own comments or admins to update any" ON issue_comments;
DROP POLICY IF EXISTS "Allow users to delete own comments or admins to delete any" ON issue_comments;

-- Create simple policies for testing
CREATE POLICY "Simple view policy" ON issue_comments
  FOR SELECT USING (true);

CREATE POLICY "Simple insert policy" ON issue_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Simple update policy" ON issue_comments
  FOR UPDATE USING (true);

CREATE POLICY "Simple delete policy" ON issue_comments
  FOR DELETE USING (true);
```

## Future Enhancements

- [ ] Real-time comment updates using Supabase subscriptions
- [ ] Comment notifications and email alerts
- [ ] Comment threading and replies
- [ ] File attachments in comments
- [ ] Comment search and filtering
- [ ] Comment moderation tools for admins
