import { supabase } from '../lib/supabase';
import { Asset, User, Department, Issue, AssetRequest } from '../lib/supabase';

export interface BackupData {
  timestamp: string;
  version: string;
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
   * Create a complete system backup
   */
  async createBackup(): Promise<BackupData> {
    try {
      console.log('🔄 Starting system backup...');

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

      console.log('✅ Backup created successfully:', {
        timestamp: backupData.timestamp,
        assets: backupData.metadata.totalAssets,
        users: backupData.metadata.totalUsers,
        issues: backupData.metadata.totalIssues,
        size: this.formatBytes(backupData.metadata.backupSize)
      });

      return backupData;
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Download backup as JSON file
   */
  async downloadBackup(backupData: BackupData, filename?: string): Promise<void> {
    try {
      const defaultFilename = `assets-management-backup-${new Date().toISOString().split('T')[0]}.json`;
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

      console.log('✅ Backup downloaded:', finalFilename);
    } catch (error) {
      console.error('❌ Backup download failed:', error);
      throw error;
    }
  }

  /**
   * Restore system from backup
   */
  async restoreBackup(backupData: BackupData, options: {
    clearExisting?: boolean;
    skipUsers?: boolean;
    skipNotifications?: boolean;
  } = {}): Promise<void> {
    try {
      console.log('🔄 Starting system restore...');

      if (options.clearExisting) {
        console.log('🗑️ Clearing existing data...');
        await this.clearAllData();
      }

      // Restore data table by table
      const restorePromises = [];

      // Restore departments first (no dependencies)
      if (backupData.tables.departments.length > 0) {
        restorePromises.push(
          supabase.from('departments').upsert(backupData.tables.departments)
        );
      }

      // Restore users (depends on departments)
      if (backupData.tables.users.length > 0 && !options.skipUsers) {
        restorePromises.push(
          supabase.from('users').upsert(backupData.tables.users)
        );
      }

      // Restore assets (depends on users and departments)
      if (backupData.tables.assets.length > 0) {
        restorePromises.push(
          supabase.from('assets').upsert(backupData.tables.assets)
        );
      }

      // Restore issues (depends on assets and users)
      if (backupData.tables.issues.length > 0) {
        restorePromises.push(
          supabase.from('issues').upsert(backupData.tables.issues)
        );
      }

      // Restore asset requests (depends on users)
      if (backupData.tables.asset_requests.length > 0) {
        restorePromises.push(
          supabase.from('asset_requests').upsert(backupData.tables.asset_requests)
        );
      }

      // Restore notifications and preferences (optional)
      if (!options.skipNotifications) {
        if (backupData.tables.notifications.length > 0) {
          restorePromises.push(
            supabase.from('notifications').upsert(backupData.tables.notifications)
          );
        }
        if (backupData.tables.user_notification_preferences.length > 0) {
          restorePromises.push(
            supabase.from('user_notification_preferences').upsert(backupData.tables.user_notification_preferences)
          );
        }
      }

      await Promise.all(restorePromises);

      console.log('✅ System restore completed successfully');
    } catch (error) {
      console.error('❌ System restore failed:', error);
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
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (error) {
        console.warn(`Failed to clear table ${table}:`, error);
      }
    }
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
      
      // Validate backup data
      if (!backupData.timestamp || !backupData.tables) {
        throw new Error('Invalid backup file format');
      }

      await this.restoreBackup(backupData, options);
    } catch (error) {
      console.error('❌ Backup upload and restore failed:', error);
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
    
    console.log('✅ Backup schedule created:', newSchedule);
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
    console.log('✅ Backup schedule deleted:', scheduleId);
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
          console.log(`🔄 Executing scheduled backup: ${schedule.id}`);
          const backupData = await this.createBackup();
          await this.downloadBackup(backupData, `scheduled-backup-${schedule.id}-${now.toISOString().split('T')[0]}.json`);
          
          // Update schedule
          schedule.lastBackup = now.toISOString();
          schedule.nextBackup = this.calculateNextBackup(schedule.frequency, schedule.time);
          
          localStorage.setItem('backupSchedules', JSON.stringify(this.backupSchedules));
          
          console.log(`✅ Scheduled backup completed: ${schedule.id}`);
        } catch (error) {
          console.error(`❌ Scheduled backup failed: ${schedule.id}`, error);
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
      console.error('Failed to get system stats:', error);
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
