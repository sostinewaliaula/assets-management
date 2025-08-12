import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useNotifications();

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  // Local form state (mocked; no backend persistence in this demo)
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Admin-only state
  const [organizationName, setOrganizationName] = useState('Turnkey Africa');
  const [defaultDepartment, setDefaultDepartment] = useState('IT');
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you could integrate with your backend. For now, it's a no-op.
    addToast({
      title: 'Profile Updated',
      message: 'Your profile has been updated successfully.',
      type: 'success',
      duration: 3000
    });
  };

  const saveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      title: 'Preferences Saved',
      message: 'Your notification preferences have been saved.',
      type: 'success',
      duration: 3000
    });
  };

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      addToast({
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please try again.',
        type: 'error',
        duration: 5000
      });
      return;
    }
    addToast({
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      type: 'success',
      duration: 3000
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const saveAdminSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      title: 'Settings Saved',
      message: 'Admin settings have been saved successfully.',
      type: 'success',
      duration: 3000
    });
  };

  const exportData = (type: 'assets' | 'users') => {
    addToast({
      title: 'Export Started',
      message: `${type} data is being exported. You will receive a download link shortly.`,
      type: 'info',
      duration: 5000
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary">Settings</h1>

      {/* Profile */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="button-primary">Save Profile</button>
          </div>
        </form>
      </section>

      {/* Preferences */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm font-medium">Appearance</p>
            <div className="flex items-center gap-3">
              <span className="text-sm">Theme:</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1 rounded-xl bg-lightgreen dark:bg-gray-800 text-sm"
              >
                Toggle to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
          <form onSubmit={saveNotifications} className="space-y-3">
            <p className="text-sm font-medium">Notifications</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
              Email notifications
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
              Push notifications
            </label>
            <button type="submit" className="button-primary">Save Preferences</button>
          </form>
        </div>
      </section>

      {/* Security */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Security</h2>
        <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="button-primary">Change Password</button>
          </div>
        </form>
      </section>

      {/* Admin-only settings */}
      {isAdmin && (
        <>
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Organization</h2>
            <form onSubmit={saveAdminSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Department</label>
                <input
                  type="text"
                  value={defaultDepartment}
                  onChange={(e) => setDefaultDepartment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="button-primary">Save Organization</button>
              </div>
            </form>
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Access Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allowSelfRegistration} onChange={(e) => setAllowSelfRegistration(e.target.checked)} />
                Allow user self-registration
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={require2FA} onChange={(e) => setRequire2FA(e.target.checked)} />
                Require 2FA for all users
              </label>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Data Management</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => exportData('assets')} className="button-primary">Export Assets</button>
              <button onClick={() => exportData('users')} className="button-primary">Export Users</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Settings;


