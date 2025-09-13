import { supabase } from '../lib/supabase';
import { Asset, User, Department, Issue, AssetRequest } from '../lib/supabase';

export interface BackupData {
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

export interface StoredBackup {
  id: string;
  name: string;
  description?: string;
  timestamp: string;
  version: string;
  metadata: {
    totalAssets: number;
    totalUsers: number;
    totalIssues: number;
    backupSize: number;
  };
  created_by: string;
}

export interface BackupSchedule {
  id: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm format
  retentionDays: number;
  lastBackup?: string;
  nextBackup?: string;
}

export class BackupService {
  private static instance: BackupService;
  private backupSchedules: BackupSchedule[] = [];

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Create a complete system backup and store it in the database
   */
  async createBackup(name: string, description?: string): Promise<StoredBackup> {
    try {

      // Fetch all data from all tables
      const [
        { data: assets, error: assetsError },
        { data: users, error: usersError },
        { data: departments, error: deptError },
        { data: issues, error: issuesError },
        { data: assetRequests, error: requestsError },
        { data: notifications, error: notifError },
        { data: userPrefs, error: prefsError }
      ] = await Promise.all([
        supabase.from('assets').select('*'),
        supabase.from('users').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('issues').select('*'),
        supabase.from('asset_requests').select('*'),
        supabase.from('notifications').select('*'),
        supabase.from('user_notification_preferences').select('*')
      ]);

      // Check for errors
      const errors = [assetsError, usersError, deptError, issuesError, requestsError, notifError, prefsError];
      const hasErrors = errors.some(error => error !== null);
      
      if (hasErrors) {
        throw new Error('Failed to fetch data for backup: ' + errors.filter(e => e).map(e => e?.message).join(', '));
      }

      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        name,
        description,
        tables: {
          assets: assets || [],
          users: users || [],
          departments: departments || [],
          issues: issues || [],
          asset_requests: assetRequests || [],
          notifications: notifications || [],
          user_notification_preferences: userPrefs || []
        },
        metadata: {
          totalAssets: assets?.length || 0,
          totalUsers: users?.length || 0,
          totalIssues: issues?.length || 0,
          backupSize: 0 // Will be calculated below
        }
      };

      // Calculate backup size
      const backupString = JSON.stringify(backupData);
      backupData.metadata.backupSize = new Blob([backupString]).size;

      // Store backup in database
      const { data: storedBackup, error: storeError } = await supabase
        .from('backups')
        .insert({
          name: backupData.name,
          description: backupData.description,
          timestamp: backupData.timestamp,
          version: backupData.version,
          metadata: backupData.metadata,
          backup_data: backupData,
          created_by: (await supabase.auth.getUser()).data.user?.email || 'system'
        })
        .select()
        .single();

      if (storeError) {
        throw new Error('Failed to store backup: ' + storeError.message);
      }


      return storedBackup;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all stored backups
   */
  async getStoredBackups(): Promise<StoredBackup[]> {
    try {
      const { data: backups, error } = await supabase
        .from('backups')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error('Failed to fetch backups: ' + error.message);
      }

      return backups || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get a specific backup by ID
   */
  async getBackupById(backupId: string): Promise<BackupData | null> {
    try {
      const { data: backup, error } = await supabase
        .from('backups')
        .select('*')
        .eq('id', backupId)
        .single();

      if (error) {
        throw new Error('Failed to fetch backup: ' + error.message);
      }

      if (!backup || !backup.backup_data) {
        return null;
      }

      // Return the backup data with metadata
      return {
        ...backup.backup_data,
        id: backup.id,
        name: backup.name,
        description: backup.description,
        timestamp: backup.timestamp,
        version: backup.version
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Download backup as JSON file
   */
  async downloadBackup(backupId: string, filename?: string): Promise<void> {
    try {
      const backupData = await this.getBackupById(backupId);
      if (!backupData) {
        throw new Error('Backup not found');
      }

      const defaultFilename = `${backupData.name}-${new Date(backupData.timestamp).toISOString().split('T')[0]}.json`;
      const finalFilename = filename || defaultFilename;

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a stored backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', backupId);

      if (error) {
        throw new Error('Failed to delete backup: ' + error.message);
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore system from backup
   */
  async restoreBackup(backupId: string, options: {
    clearExisting?: boolean;
    skipUsers?: boolean;
    skipNotifications?: boolean;
  } = {}): Promise<void> {
    try {

      const backupData = await this.getBackupById(backupId);
      if (!backupData) {
        throw new Error('Backup not found');
      }

      // Validate backup data structure
      this.validateBackupData(backupData);


      if (options.clearExisting) {
        await this.clearAllData();
      }

      // Restore data sequentially to handle dependencies properly
      const results = [];

      // 1. Restore departments first (no dependencies)
      if (backupData.tables.departments.length > 0) {
        const { data: deptResult, error: deptError } = await supabase
          .from('departments')
          .upsert(backupData.tables.departments, { onConflict: 'id' });
        
        if (deptError) {
          throw new Error(`Failed to restore departments: ${deptError.message}`);
        }
        results.push({ table: 'departments', count: deptResult?.length || 0 });
      }

      // 2. Restore users (depends on departments)
      if (backupData.tables.users.length > 0 && !options.skipUsers) {
        const { data: userResult, error: userError } = await supabase
          .from('users')
          .upsert(backupData.tables.users, { onConflict: 'id' });
        
        if (userError) {
          throw new Error(`Failed to restore users: ${userError.message}`);
        }
        results.push({ table: 'users', count: userResult?.length || 0 });
      }

      // 3. Restore assets (depends on users and departments)
      if (backupData.tables.assets.length > 0) {
        const { data: assetResult, error: assetError } = await supabase
          .from('assets')
          .upsert(backupData.tables.assets, { onConflict: 'id' });
        
        if (assetError) {
          throw new Error(`Failed to restore assets: ${assetError.message}`);
        }
        results.push({ table: 'assets', count: assetResult?.length || 0 });
      }

      // 4. Restore issues (depends on assets and users)
      if (backupData.tables.issues.length > 0) {
        const { data: issueResult, error: issueError } = await supabase
          .from('issues')
          .upsert(backupData.tables.issues, { onConflict: 'id' });
        
        if (issueError) {
          throw new Error(`Failed to restore issues: ${issueError.message}`);
        }
        results.push({ table: 'issues', count: issueResult?.length || 0 });
      }

      // 5. Restore asset requests (depends on users)
      if (backupData.tables.asset_requests.length > 0) {
        const { data: requestResult, error: requestError } = await supabase
          .from('asset_requests')
          .upsert(backupData.tables.asset_requests, { onConflict: 'id' });
        
        if (requestError) {
          throw new Error(`Failed to restore asset requests: ${requestError.message}`);
        }
        results.push({ table: 'asset_requests', count: requestResult?.length || 0 });
      }

      // 6. Restore notifications and preferences (optional)
      if (!options.skipNotifications) {
        if (backupData.tables.notifications.length > 0) {
          const { data: notifResult, error: notifError } = await supabase
            .from('notifications')
            .upsert(backupData.tables.notifications, { onConflict: 'id' });
          
          if (notifError) {
            throw new Error(`Failed to restore notifications: ${notifError.message}`);
          }
          results.push({ table: 'notifications', count: notifResult?.length || 0 });
        }

        if (backupData.tables.user_notification_preferences.length > 0) {
          const { data: prefResult, error: prefError } = await supabase
            .from('user_notification_preferences')
            .upsert(backupData.tables.user_notification_preferences, { onConflict: 'id' });
          
          if (prefError) {
            throw new Error(`Failed to restore notification preferences: ${prefError.message}`);
          }
          results.push({ table: 'user_notification_preferences', count: prefResult?.length || 0 });
        }
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Clear all data from the system
   */
  private async clearAllData(): Promise<void> {
    const tables = [
      'notifications',
      'user_notification_preferences',
      'issues',
      'asset_requests',
      'assets',
      'users',
      'departments'
    ];

    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          throw new Error(`Failed to clear table ${table}: ${error.message}`);
        }
        
      } catch (error) {
        throw error;
      }
    }
    
  }

  /**
   * Validate backup data structure
   */
  private validateBackupData(backupData: any): backupData is BackupData {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Invalid backup data: not an object');
    }

    if (!backupData.timestamp || typeof backupData.timestamp !== 'string') {
      throw new Error('Invalid backup data: missing or invalid timestamp');
    }

    if (!backupData.tables || typeof backupData.tables !== 'object') {
      throw new Error('Invalid backup data: missing or invalid tables object');
    }

    const requiredTables = ['assets', 'users', 'departments', 'issues', 'asset_requests', 'notifications', 'user_notification_preferences'];
    for (const table of requiredTables) {
      if (!Array.isArray(backupData.tables[table])) {
        throw new Error(`Invalid backup data: missing or invalid table '${table}'`);
      }
    }

    return true;
  }

  /**
   * Upload and restore from backup file
   */
  async uploadAndRestore(file: File, options?: {
    clearExisting?: boolean;
    skipUsers?: boolean;
    skipNotifications?: boolean;
  }): Promise<void> {
    try {
      
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);
      
      // Validate backup data structure
      this.validateBackupData(backupData);


      if (options?.clearExisting) {
        await this.clearAllData();
      }

      // Restore data sequentially to handle dependencies properly
      const results = [];

      // 1. Restore departments first (no dependencies)
      if (backupData.tables.departments?.length > 0) {
        const { data: deptResult, error: deptError } = await supabase
          .from('departments')
          .upsert(backupData.tables.departments, { onConflict: 'id' });
        
        if (deptError) {
          throw new Error(`Failed to restore departments: ${deptError.message}`);
        }
        results.push({ table: 'departments', count: deptResult?.length || 0 });
      }

      // 2. Restore users (depends on departments)
      if (backupData.tables.users?.length > 0 && !options?.skipUsers) {
        const { data: userResult, error: userError } = await supabase
          .from('users')
          .upsert(backupData.tables.users, { onConflict: 'id' });
        
        if (userError) {
          throw new Error(`Failed to restore users: ${userError.message}`);
        }
        results.push({ table: 'users', count: userResult?.length || 0 });
      }

      // 3. Restore assets (depends on users and departments)
      if (backupData.tables.assets?.length > 0) {
        const { data: assetResult, error: assetError } = await supabase
          .from('assets')
          .upsert(backupData.tables.assets, { onConflict: 'id' });
        
        if (assetError) {
          throw new Error(`Failed to restore assets: ${assetError.message}`);
        }
        results.push({ table: 'assets', count: assetResult?.length || 0 });
      }

      // 4. Restore issues (depends on assets and users)
      if (backupData.tables.issues?.length > 0) {
        const { data: issueResult, error: issueError } = await supabase
          .from('issues')
          .upsert(backupData.tables.issues, { onConflict: 'id' });
        
        if (issueError) {
          throw new Error(`Failed to restore issues: ${issueError.message}`);
        }
        results.push({ table: 'issues', count: issueResult?.length || 0 });
      }

      // 5. Restore asset requests (depends on users)
      if (backupData.tables.asset_requests?.length > 0) {
        const { data: requestResult, error: requestError } = await supabase
          .from('asset_requests')
          .upsert(backupData.tables.asset_requests, { onConflict: 'id' });
        
        if (requestError) {
          throw new Error(`Failed to restore asset requests: ${requestError.message}`);
        }
        results.push({ table: 'asset_requests', count: requestResult?.length || 0 });
      }

      // 6. Restore notifications and preferences (optional)
      if (!options?.skipNotifications) {
        if (backupData.tables.notifications?.length > 0) {
          const { data: notifResult, error: notifError } = await supabase
            .from('notifications')
            .upsert(backupData.tables.notifications, { onConflict: 'id' });
          
          if (notifError) {
            throw new Error(`Failed to restore notifications: ${notifError.message}`);
          }
          results.push({ table: 'notifications', count: notifResult?.length || 0 });
        }

        if (backupData.tables.user_notification_preferences?.length > 0) {
          const { data: prefResult, error: prefError } = await supabase
            .from('user_notification_preferences')
            .upsert(backupData.tables.user_notification_preferences, { onConflict: 'id' });
          
          if (prefError) {
            throw new Error(`Failed to restore notification preferences: ${prefError.message}`);
          }
          results.push({ table: 'user_notification_preferences', count: prefResult?.length || 0 });
        }
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Schedule automatic backups
   */
  async scheduleBackup(schedule: Omit<BackupSchedule, 'id'>): Promise<BackupSchedule> {
    const newSchedule: BackupSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}`,
      lastBackup: undefined,
      nextBackup: this.calculateNextBackup(schedule.frequency, schedule.time)
    };

    this.backupSchedules.push(newSchedule);
    
    // Store in localStorage for persistence
    localStorage.setItem('backupSchedules', JSON.stringify(this.backupSchedules));
    
    return newSchedule;
  }

  /**
   * Get all backup schedules
   */
  async getBackupSchedules(): Promise<BackupSchedule[]> {
    const stored = localStorage.getItem('backupSchedules');
    if (stored) {
      this.backupSchedules = JSON.parse(stored);
    }
    return this.backupSchedules;
  }

  /**
   * Delete a backup schedule
   */
  async deleteBackupSchedule(scheduleId: string): Promise<void> {
    this.backupSchedules = this.backupSchedules.filter(s => s.id !== scheduleId);
    localStorage.setItem('backupSchedules', JSON.stringify(this.backupSchedules));
  }

  /**
   * Calculate next backup time
   */
  private calculateNextBackup(frequency: string, time: string): string {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextBackup = new Date();
    nextBackup.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        nextBackup.setDate(nextBackup.getDate() + 1);
        break;
      case 'weekly':
        nextBackup.setDate(nextBackup.getDate() + 7);
        break;
      case 'monthly':
        nextBackup.setMonth(nextBackup.getMonth() + 1);
        break;
    }

    return nextBackup.toISOString();
  }

  /**
   * Check and execute scheduled backups
   */
  async checkScheduledBackups(): Promise<void> {
    const schedules = await this.getBackupSchedules();
    const now = new Date();

    for (const schedule of schedules) {
      if (!schedule.enabled) continue;

      const nextBackup = new Date(schedule.nextBackup || '');
      if (now >= nextBackup) {
        try {
          const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
          const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
          await this.createBackup(
            `Scheduled Backup - ${schedule.frequency} - ${dateStr} ${timeStr}`,
            `Automatic backup from schedule ${schedule.id}`
          );
          
          // Update schedule
          schedule.lastBackup = now.toISOString();
          schedule.nextBackup = this.calculateNextBackup(schedule.frequency, schedule.time);
          
          localStorage.setItem('backupSchedules', JSON.stringify(this.backupSchedules));
          
        } catch (error) {
        }
      }
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    totalAssets: number;
    totalUsers: number;
    totalIssues: number;
    totalDepartments: number;
    lastBackup?: string;
  }> {
    try {
      const [
        { count: assetsCount },
        { count: usersCount },
        { count: issuesCount },
        { count: deptCount }
      ] = await Promise.all([
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('issues').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true })
      ]);

      const schedules = await this.getBackupSchedules();
      const lastBackup = schedules
        .filter(s => s.lastBackup)
        .sort((a, b) => new Date(b.lastBackup!).getTime() - new Date(a.lastBackup!).getTime())[0]?.lastBackup;

      return {
        totalAssets: assetsCount || 0,
        totalUsers: usersCount || 0,
        totalIssues: issuesCount || 0,
        totalDepartments: deptCount || 0,
        lastBackup
      };
    } catch (error) {
      return {
        totalAssets: 0,
        totalUsers: 0,
        totalIssues: 0,
        totalDepartments: 0
      };
    }
  }
}

// Export singleton instance
export const backupService = BackupService.getInstance();
