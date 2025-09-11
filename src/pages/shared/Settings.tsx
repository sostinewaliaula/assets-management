import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import NotificationPreferences from '../../components/ui/NotificationPreferences';
import { EyeIcon, EyeOffIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { addToast, addNotification } = useNotifications();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordChecks = useMemo(() => {
    const len = newPassword.length >= 8;
    const upper = /[A-Z]/.test(newPassword);
    const lower = /[a-z]/.test(newPassword);
    const num = /[0-9]/.test(newPassword);
    const special = /[^A-Za-z0-9]/.test(newPassword);
    const match = !!newPassword && confirmPassword === newPassword;
    return { len, upper, lower, num, special, match };
  }, [newPassword, confirmPassword]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      addNotification({ title: 'Missing fields', message: 'Please fill in all password fields.', type: 'warning' });
      addToast({ title: 'Missing fields', message: 'Please fill in all password fields.', type: 'warning' });
      return;
    }
    if (!(passwordChecks.len && passwordChecks.upper && passwordChecks.lower && passwordChecks.num && passwordChecks.special)) {
      addNotification({ title: 'Weak password', message: 'Password does not meet complexity requirements.', type: 'warning' });
      addToast({ title: 'Weak password', message: 'Password does not meet complexity requirements.', type: 'warning' });
      return;
    }
    if (!passwordChecks.match) {
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
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full pr-10 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700">
                {showCurrent ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full pr-10 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Strong password"
                required
              />
              <button type="button" onClick={() => setShowNew(s => !s)} className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700">
                {showNew ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {/* Requirements indicator */}
            <ul className="mt-2 space-y-1 text-xs">
              <li className={`flex items-center ${passwordChecks.len ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordChecks.len ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />} At least 8 characters
              </li>
              <li className={`flex items-center ${passwordChecks.upper ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordChecks.upper ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />} Contains an uppercase letter
              </li>
              <li className={`flex items-center ${passwordChecks.lower ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordChecks.lower ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />} Contains a lowercase letter
              </li>
              <li className={`flex items-center ${passwordChecks.num ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordChecks.num ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />} Contains a number
              </li>
              <li className={`flex items-center ${passwordChecks.special ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordChecks.special ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />} Contains a special character
              </li>
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pr-10 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Re-enter new password"
                required
              />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700">
                {showConfirm ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && (
              <div className={`mt-2 text-xs flex items-center ${passwordChecks.match ? 'text-green-600' : 'text-red-600'}`}>
                {passwordChecks.match ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <XCircleIcon className="w-4 h-4 mr-1" />}
                {passwordChecks.match ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
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


