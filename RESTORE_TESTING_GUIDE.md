# Restore Functionality Testing Guide

## **Overview**
This guide provides step-by-step instructions for testing the backup restore functionality in the asset management system.

## **What Was Fixed**

### **✅ Data Structure Issues**
- **Fixed `getBackupById` method** - Now returns complete backup data with metadata
- **Added data validation** - Validates backup structure before restoration
- **Improved error handling** - Better error messages and logging

### **✅ Restore Process Improvements**
- **Sequential restoration** - Tables restored in dependency order
- **Conflict handling** - Uses `onConflict: 'id'` for upsert operations
- **Detailed logging** - Step-by-step progress tracking
- **Error recovery** - Stops on first error with clear messages

### **✅ Upload and Restore**
- **Direct restoration** - No longer creates intermediate backup
- **File validation** - Validates JSON structure before processing
- **Better error messages** - Clear feedback for invalid files

## **Testing Steps**

### **1. Create a Test Backup**
1. **Navigate to Admin → Backup Management**
2. **Click "Create Backup"**
3. **Enter a test name** (e.g., "Test Backup for Restore")
4. **Add a description** (e.g., "Testing restore functionality")
5. **Click "Create Backup"**
6. **Verify the backup appears** in the stored backups list

### **2. Test Local Restore (From Stored Backup)**
1. **Find your test backup** in the stored backups list
2. **Click the restore button** (upload icon) next to the backup
3. **Check the console** for detailed restore progress:
   ```
   🔄 Starting system restore...
   📋 Backup data found: { name: "...", assets: X, users: Y, ... }
   📁 Restoring departments...
   👥 Restoring users...
   💻 Restoring assets...
   🐛 Restoring issues...
   📋 Restoring asset requests...
   🔔 Restoring notifications...
   ⚙️ Restoring notification preferences...
   ✅ System restore completed successfully
   📊 Restore summary: [...]
   ```
4. **Verify success notification** appears
5. **Check that data is restored** by navigating to other pages

### **3. Test Upload and Restore (From File)**
1. **Download a backup file** using the download button
2. **Click "Restore"** in the header
3. **Upload the downloaded file** in the restore modal
4. **Configure restore options**:
   - ✅ **Clear existing data** (if you want to start fresh)
   - ✅ **Skip user data** (if you want to keep current users)
   - ✅ **Skip notifications** (if you want to keep current notifications)
5. **Click "Restore"**
6. **Check the console** for detailed progress
7. **Verify success notification** appears

### **4. Test Error Scenarios**

#### **Invalid File Upload**
1. **Try uploading a non-JSON file**
   - Should show: "Please select a valid JSON backup file"
2. **Try uploading an invalid JSON file**
   - Should show: "Invalid backup data: not an object"
3. **Try uploading JSON without required fields**
   - Should show: "Invalid backup data: missing or invalid timestamp"

#### **Restore with Dependencies**
1. **Create a backup with assets assigned to users**
2. **Try restoring with "Skip users" enabled**
   - Should show error about foreign key constraints
3. **Try restoring with "Clear existing data" enabled**
   - Should work correctly

## **Expected Console Output**

### **Successful Restore**
```
🔄 Starting system restore...
📋 Backup data found: {
  name: "Test Backup",
  timestamp: "2024-01-15T10:30:00.000Z",
  assets: 5,
  users: 3,
  departments: 2,
  issues: 1
}
📁 Restoring departments...
✅ Cleared table: departments
👥 Restoring users...
✅ Cleared table: users
💻 Restoring assets...
✅ Cleared table: assets
🐛 Restoring issues...
✅ Cleared table: issues
📋 Restoring asset requests...
✅ Cleared table: asset_requests
🔔 Restoring notifications...
✅ Cleared table: notifications
⚙️ Restoring notification preferences...
✅ Cleared table: user_notification_preferences
✅ System restore completed successfully
📊 Restore summary: [
  { table: 'departments', count: 2 },
  { table: 'users', count: 3 },
  { table: 'assets', count: 5 },
  { table: 'issues', count: 1 },
  { table: 'asset_requests', count: 0 },
  { table: 'notifications', count: 0 },
  { table: 'user_notification_preferences', count: 0 }
]
```

### **Error Output**
```
❌ System restore failed: Error: Failed to restore assets: 
new row for relation "assets" violates foreign key constraint "assets_assigned_to_fkey"
```

## **Troubleshooting**

### **Common Issues**

#### **Foreign Key Constraint Errors**
- **Cause**: Trying to restore data with missing dependencies
- **Solution**: 
  - Enable "Clear existing data" to start fresh
  - Or ensure all dependent data is restored first
  - Check that user IDs in assets match existing users

#### **Permission Errors**
- **Cause**: User doesn't have admin role
- **Solution**: Ensure you're logged in as an admin user

#### **File Upload Errors**
- **Cause**: Invalid file format or corrupted backup
- **Solution**: 
  - Ensure file is valid JSON
  - Check that backup was created by this system
  - Try downloading a fresh backup and uploading that

#### **Network Errors**
- **Cause**: Supabase connection issues
- **Solution**: 
  - Check internet connection
  - Verify Supabase is accessible
  - Try refreshing the page

### **Debug Steps**
1. **Open browser console** (F12)
2. **Look for error messages** with ❌ emoji
3. **Check network tab** for failed requests
4. **Verify backup data** by downloading and examining the JSON
5. **Test with a simple backup** (few records) first

## **Success Criteria**

### **✅ Restore Works When:**
- [ ] Backup can be created successfully
- [ ] Restore from stored backup completes without errors
- [ ] Upload and restore from file completes without errors
- [ ] All data is properly restored (assets, users, departments, etc.)
- [ ] Foreign key relationships are maintained
- [ ] Error messages are clear and helpful
- [ ] Console shows detailed progress logging

### **✅ Error Handling Works When:**
- [ ] Invalid files show appropriate error messages
- [ ] Missing dependencies show clear error messages
- [ ] Network errors are handled gracefully
- [ ] User is informed of restore progress and results

## **Next Steps**
Once restore functionality is working correctly:
1. **Test with larger datasets** (100+ records)
2. **Test with complex relationships** (assets with issues, users with multiple assets)
3. **Test performance** with very large backups
4. **Add automated tests** for the restore functionality
5. **Document any additional edge cases** found during testing

The restore functionality should now work reliably and provide clear feedback for both successful operations and errors.
