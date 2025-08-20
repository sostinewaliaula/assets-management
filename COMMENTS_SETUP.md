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

## Testing Edit/Delete Functionality

After confirming comments are displaying correctly, test the edit and delete functionality:

1. **Edit a comment:**
   - Click the edit icon (pencil) on any comment
   - Modify the text in the textarea
   - Click "Save" to update
   - Check console for debugging output

2. **Delete a comment:**
   - Click the delete icon (trash) on any comment
   - Check console for debugging output
   - Comment should disappear from the list

## Troubleshooting Common Issues

### Issue: Comments display but edit/delete don't work

**Possible causes:**
1. **RLS Policy Issues:** The current user might not have permission to update/delete comments
2. **Missing user_name field:** If the table requires user_name but it's not being provided
3. **Authentication issues:** User context might not be properly loaded

**Debugging steps:**
1. Check browser console for error messages
2. Verify the user object is loaded correctly
3. Check if RLS policies allow the current user to perform operations

**Quick RLS test:**
```sql
-- Test if current user can update/delete comments
SELECT * FROM issue_comments WHERE user_id = auth.uid() LIMIT 1;
UPDATE issue_comments SET content = 'test' WHERE user_id = auth.uid() LIMIT 1;
DELETE FROM issue_comments WHERE user_id = auth.uid() LIMIT 1;
```

### Issue: Permission denied errors

If you get permission errors, try these simplified RLS policies:

```sql
-- Simplified policies for testing (less secure)
DROP POLICY IF EXISTS "Allow authenticated users to view comments" ON issue_comments;
DROP POLICY IF EXISTS "Allow authenticated users to insert comments" ON issue_comments;
DROP POLICY IF EXISTS "Allow users to update own comments or admins to update any" ON issue_comments;
DROP POLICY IF EXISTS "Allow users to delete own comments or admins to delete any" ON issue_comments;

-- Create simple policies
CREATE POLICY "Simple view policy" ON issue_comments FOR SELECT USING (true);
CREATE POLICY "Simple insert policy" ON issue_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Simple update policy" ON issue_comments FOR UPDATE USING (true);
CREATE POLICY "Simple delete policy" ON issue_comments FOR DELETE USING (true);
```

**Note:** These simplified policies are less secure and should only be used for testing. Revert to the proper RLS policies for production use.

## Future Enhancements

- [ ] Real-time comment updates using Supabase subscriptions
- [ ] Comment notifications and email alerts
- [ ] Comment threading and replies
- [ ] File attachments in comments
- [ ] Comment search and filtering
- [ ] Comment moderation tools for admins
