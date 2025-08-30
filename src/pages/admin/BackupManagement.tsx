import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  DownloadIcon, 
  UploadIcon, 
  ClockIcon, 
  CalendarIcon, 
  TrashIcon, 
  PlusIcon, 
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  DatabaseIcon,
  SettingsIcon
} from 'lucide-react';
import { backupService, BackupSchedule, BackupData } from '../../services/backupService';

const BackupManagement: React.FC = () => {
  const { user } = useAuth();
  const { addNotification, addToast } = useNotifications();
  
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    clearExisting: false,
    skipUsers: false,
    skipNotifications: false
  });
  const [newSchedule, setNewSchedule] = useState({
    enabled: true,
    frequency: 'daily' as const,
    time: '02:00',
    retentionDays: 30
  });

  useEffect(() => {
    loadSystemStats();
    loadBackupSchedules();
    
    // Check for scheduled backups every minute
    const interval = setInterval(() => {
      backupService.checkScheduledBackups();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadSystemStats = async () => {
    try {
      const stats = await backupService.getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Failed to load system stats:', error);
    }
  };

  const loadBackupSchedules = async () => {
    try {
      const schedules = await backupService.getBackupSchedules();
      setBackupSchedules(schedules);
    } catch (error) {
      console.error('Failed to load backup schedules:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backupData = await backupService.createBackup();
      await backupService.downloadBackup(backupData);
      
      addNotification({
        title: 'Backup Created',
        message: `System backup created successfully with ${backupData.metadata.totalAssets} assets, ${backupData.metadata.totalUsers} users, and ${backupData.metadata.totalIssues} issues.`,
        type: 'success'
      });
      
      addToast({
        title: 'Backup Created',
        message: 'System backup downloaded successfully.',
        type: 'success'
      });
      
      await loadSystemStats();
    } catch (error) {
      console.error('Backup creation failed:', error);
      addNotification({
        title: 'Backup Failed',
        message: 'Failed to create system backup. Please try again.',
        type: 'error'
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    } else {
      addToast({
        title: 'Invalid File',
        message: 'Please select a valid JSON backup file.',
        type: 'error'
      });
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedFile) return;
    
    setIsRestoring(true);
    try {
      await backupService.uploadAndRestore(selectedFile, restoreOptions);
      
      addNotification({
        title: 'Restore Completed',
        message: 'System has been restored from backup successfully.',
        type: 'success'
      });
      
      addToast({
        title: 'Restore Completed',
        message: 'System restore completed successfully.',
        type: 'success'
      });
      
      setShowRestoreModal(false);
      setSelectedFile(null);
      await loadSystemStats();
    } catch (error) {
      console.error('Restore failed:', error);
      addNotification({
        title: 'Restore Failed',
        message: 'Failed to restore system from backup. Please check the backup file and try again.',
        type: 'error'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      await backupService.scheduleBackup(newSchedule);
      
      addNotification({
        title: 'Schedule Created',
        message: `Automatic backup scheduled for ${newSchedule.frequency} at ${newSchedule.time}.`,
        type: 'success'
      });
      
      setShowScheduleModal(false);
      setNewSchedule({
        enabled: true,
        frequency: 'daily',
        time: '02:00',
        retentionDays: 30
      });
      
      await loadBackupSchedules();
    } catch (error) {
      console.error('Schedule creation failed:', error);
      addNotification({
        title: 'Schedule Failed',
        message: 'Failed to create backup schedule. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await backupService.deleteBackupSchedule(scheduleId);
      
      addNotification({
        title: 'Schedule Deleted',
        message: 'Backup schedule deleted successfully.',
        type: 'success'
      });
      
      await loadBackupSchedules();
    } catch (error) {
      console.error('Schedule deletion failed:', error);
      addNotification({
        title: 'Delete Failed',
        message: 'Failed to delete backup schedule. Please try again.',
        type: 'error'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access backup management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Backup Management</h1>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              Create, restore, and schedule automatic backups of your system data.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="button-primary flex items-center"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {isCreatingBackup ? 'Creating...' : 'Create Backup'}
            </button>
            <button
              onClick={() => setShowRestoreModal(true)}
              className="px-4 py-2 text-sm font-medium text-secondary bg-lightpurple rounded-full shadow-button hover:opacity-90"
            >
              <UploadIcon className="w-4 h-4 mr-2" />
              Restore
            </button>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      {systemStats && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center">
              <DatabaseIcon className="w-8 h-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-primary">{systemStats.totalAssets}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center">
              <DatabaseIcon className="w-8 h-8 text-secondary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-secondary">{systemStats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center">
              <DatabaseIcon className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Issues</p>
                <p className="text-2xl font-bold text-yellow-600">{systemStats.totalIssues}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center">
              <DatabaseIcon className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-green-600">{systemStats.totalDepartments}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Schedules */}
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-primary">Automatic Backup Schedules</h2>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="button-primary flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Schedule
          </button>
        </div>

        {backupSchedules.length > 0 ? (
          <div className="space-y-4">
            {backupSchedules.map((schedule) => (
              <div key={schedule.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${schedule.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {getFrequencyLabel(schedule.frequency)} Backup at {schedule.time}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Retention: {schedule.retentionDays} days
                      </p>
                      {schedule.lastBackup && (
                        <p className="text-xs text-gray-500">
                          Last backup: {formatDate(schedule.lastBackup)}
                        </p>
                      )}
                      {schedule.nextBackup && (
                        <p className="text-xs text-gray-500">
                          Next backup: {formatDate(schedule.nextBackup)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No backup schedules configured</p>
            <p className="text-sm text-gray-500">Create a schedule to enable automatic backups</p>
          </div>
        )}
      </div>

      {/* Backup Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create Backup Schedule
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  value={newSchedule.frequency}
                  onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Retention (days)
                </label>
                <input
                  type="number"
                  value={newSchedule.retentionDays}
                  onChange={(e) => setNewSchedule({ ...newSchedule, retentionDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="1"
                  max="365"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                className="button-primary px-4 py-2 text-sm font-medium"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Restore from Backup
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Backup File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={restoreOptions.clearExisting}
                    onChange={(e) => setRestoreOptions({ ...restoreOptions, clearExisting: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Clear existing data</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={restoreOptions.skipUsers}
                    onChange={(e) => setRestoreOptions({ ...restoreOptions, skipUsers: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Skip user data</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={restoreOptions.skipNotifications}
                    onChange={(e) => setRestoreOptions({ ...restoreOptions, skipNotifications: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Skip notifications</span>
                </label>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Warning: Restoring will overwrite existing data. Make sure you have a current backup.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreBackup}
                disabled={!selectedFile || isRestoring}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isRestoring ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManagement;
