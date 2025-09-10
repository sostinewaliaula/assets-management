import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import NotificationPreferences from '../../components/ui/NotificationPreferences';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { addToast, addNotification } = useNotifications();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      addNotification({ title: 'Missing fields', message: 'Please fill in all password fields.', type: 'warning' });
      addToast({ title: 'Missing fields', message: 'Please fill in all password fields.', type: 'warning' });
      return;
    }

    if (newPassword.length < 8) {
      addNotification({ title: 'Weak password', message: 'Password must be at least 8 characters long.', type: 'warning' });
      addToast({ title: 'Weak password', message: 'Password must be at least 8 characters long.', type: 'warning' });
      return;
    }

    if (newPassword !== confirmPassword) {
      addNotification({ title: 'Password mismatch', message: 'New password and confirmation do not match.', type: 'error' });
      addToast({ title: 'Password mismatch', message: 'New password and confirmation do not match.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Re-authenticate user with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      if (signInError) {
        addNotification({ title: 'Authentication failed', message: 'Current password is incorrect.', type: 'error' });
        addToast({ title: 'Authentication failed', message: 'Current password is incorrect.', type: 'error' });
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        addNotification({ title: 'Update failed', message: updateError.message || 'Could not update password.', type: 'error' });
        addToast({ title: 'Update failed', message: updateError.message || 'Could not update password.', type: 'error' });
        return;
      }

      addNotification({ title: 'Password updated', message: 'Your password has been changed successfully.', type: 'success' });
      addToast({ title: 'Password updated', message: 'Your password has been changed successfully.', type: 'success' });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addNotification({ title: 'Unexpected error', message: err?.message || 'Something went wrong.', type: 'error' });
      addToast({ title: 'Unexpected error', message: err?.message || 'Something went wrong.', type: 'error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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

      {/* Two-Factor Authentication */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Add an extra layer of security to your account by enabling 2FA.</p>
        <Link to="/settings/security" className="button-primary inline-block px-4 py-2 text-sm font-medium">Manage 2FA</Link>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Change Password
        </h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Re-enter new password"
              minLength={8}
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

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


