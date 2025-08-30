# Backup System Guide

## Overview

The Assets Management System includes a comprehensive backup and restore system that allows administrators to:

- **Create backups** with custom names and descriptions
- **Store backups** securely in the database
- **Download backups** as JSON files for external storage
- **Restore from backups** with flexible options
- **Schedule automatic backups** (daily, weekly, monthly)
- **Manage backup retention** and cleanup

## Database Setup

### 1. Create Backups Table

Run the following SQL migration in your Supabase database:

```sql
-- Execute the contents of database_migrations/create_backups_table.sql
```

This creates:
- `backups` table with proper indexing
- Row Level Security (RLS) policies
- Admin-only access controls

### 2. Verify Table Creation

Check that the table was created successfully:

```sql
SELECT * FROM backups LIMIT 1;
```

## Features

### Manual Backup Creation

1. **Navigate to Backup Management**
   - Go to Admin → Backup Management
   - Click "Create Backup"

2. **Configure Backup**
   - Enter a descriptive name (required)
   - Add optional description
   - Click "Create Backup"

3. **Backup Contents**
   - All assets and their details
   - User accounts and preferences
   - Department information
   - Issue reports and status
   - Asset requests
   - Notification settings
   - System metadata

### Stored Backups Management

#### View Stored Backups
- All backups are listed with creation date, size, and metadata
- Shows number of assets, users, and issues included
- Displays backup size in human-readable format

#### Download Backup
- Click the download icon (📥) next to any backup
- File downloads as JSON with timestamp and name
- Can be stored externally or shared

#### Restore from Backup
- Click the restore icon (⬆️) next to any backup
- Choose restore options:
  - **Clear existing data**: Wipes current system before restore
  - **Skip user data**: Preserves current user accounts
  - **Skip notifications**: Preserves current notification settings

#### Delete Backup
- Click the delete icon (🗑️) to remove stored backup
- **Warning**: Deletion is permanent

### Automatic Backup Scheduling

#### Create Schedule
1. Click "Add Schedule" in Backup Schedules section
2. Configure:
   - **Frequency**: Daily, Weekly, or Monthly
   - **Time**: When backup should run (24-hour format)
   - **Retention**: How long to keep backups (days)

#### Schedule Management
- View all active schedules
- See last and next backup times
- Delete schedules as needed
- Automatic execution when time arrives

#### Scheduled Backup Features
- Runs automatically at specified times
- Creates backups with descriptive names
- Stores in database for later access
- Respects retention policies

## Best Practices

### Backup Strategy

1. **Regular Manual Backups**
   - Create backups before major changes
   - Use descriptive names (e.g., "Pre-Migration Backup - Jan 2024")
   - Add descriptions for context

2. **Automatic Scheduling**
   - Set daily backups for critical systems
   - Weekly backups for less critical data
   - Monthly backups for long-term retention

3. **Retention Management**
   - Keep daily backups for 7-30 days
   - Weekly backups for 3-6 months
   - Monthly backups for 1-2 years

### Security Considerations

1. **Access Control**
   - Only admins can create/manage backups
   - RLS policies protect backup data
   - User-specific backup access

2. **Data Protection**
   - Backups include all sensitive data
   - Store downloaded backups securely
   - Consider encryption for external storage

3. **Recovery Testing**
   - Test restore process regularly
   - Verify backup integrity
   - Document recovery procedures

### Performance Impact

1. **Backup Creation**
   - May take time for large datasets
   - Runs in background
   - Shows progress indicators

2. **System Resources**
   - Minimal impact during creation
   - Automatic backups run during off-peak hours
   - Configurable timing to minimize disruption

## Troubleshooting

### Common Issues

#### Backup Creation Fails
- Check database connectivity
- Verify admin permissions
- Review error logs in browser console

#### Restore Fails
- Ensure backup file is valid JSON
- Check backup version compatibility
- Verify sufficient database space

#### Scheduled Backups Not Running
- Check schedule configuration
- Verify system time settings
- Review browser console for errors

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to fetch data for backup" | Database connection issue | Check Supabase connection |
| "Invalid backup file format" | Corrupted backup file | Use a different backup file |
| "Backup not found" | Backup ID doesn't exist | Refresh backup list |
| "Access denied" | Insufficient permissions | Ensure admin role |

## API Reference

### BackupService Methods

```typescript
// Create backup
await backupService.createBackup(name: string, description?: string)

// Get all stored backups
await backupService.getStoredBackups()

// Download backup
await backupService.downloadBackup(backupId: string)

// Restore from backup
await backupService.restoreBackup(backupId: string, options)

// Delete backup
await backupService.deleteBackup(backupId: string)

// Schedule automatic backup
await backupService.scheduleBackup(schedule)
```

### Backup Data Structure

```typescript
interface BackupData {
  id?: string;
  timestamp: string;
  version: string;
  name: string;
  description?: string;
  tables: {
    assets: Asset[];
    users: User[];
    departments: Department[];
    issues: Issue[];
    asset_requests: AssetRequest[];
    notifications: any[];
    user_notification_preferences: any[];
  };
  metadata: {
    totalAssets: number;
    totalUsers: number;
    totalIssues: number;
    backupSize: number;
  };
}
```

## Migration Guide

### From Previous Backup System

If upgrading from a previous backup system:

1. **Export existing backups** before upgrade
2. **Run database migration** to create backups table
3. **Import old backups** using upload feature
4. **Verify data integrity** after migration

### Version Compatibility

- Backup version 1.0.0 is current
- Future versions will maintain backward compatibility
- Version checking during restore process

## Support

For issues with the backup system:

1. Check this documentation
2. Review browser console for errors
3. Verify database permissions
4. Contact system administrator

---

**Note**: Always test backup and restore procedures in a development environment before using in production.
