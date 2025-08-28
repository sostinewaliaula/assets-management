import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationPreferences from '../../components/ui/NotificationPreferences';

const Settings: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Please log in to access settings.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account preferences and notification settings.
        </p>
      </div>

      {/* Notification Preferences */}
      <NotificationPreferences />

      {/* Additional Settings Sections */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Account Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <p className="text-gray-900 dark:text-white">{user.name || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <p className="text-gray-900 dark:text-white capitalize">{user.role || 'User'}</p>
          </div>
        </div>
      </div>

      {/* More settings can be added here */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          System Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User ID
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{user.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Updated
            </label>
            <p className="text-gray-900 dark:text-white">
              {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


