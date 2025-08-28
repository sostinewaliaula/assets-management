import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserIcon, SettingsIcon } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View your account information.</p>
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:opacity-90 transition-opacity"
        >
          <SettingsIcon className="w-4 h-4 mr-2" /> Settings
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <div className="flex items-center">
          <div className="p-3 mr-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500">
            <UserIcon className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{user.name || 'Unnamed User'}</h2>
              <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-lightgreen text-primary">
                {user.role === 'admin' ? 'Administrator' : (user.role || 'User')}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
            <p className="mt-1 text-sm font-mono text-gray-800 dark:text-gray-200 break-all">{user.id}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
            <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
            <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{user.updated_at ? new Date(user.updated_at).toLocaleString() : 'Unknown'}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
            <p className="mt-1 text-sm text-gray-800 dark:text-gray-200 capitalize">{user.role || 'User'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Next steps</h3>
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="px-4 py-2 text-sm font-medium text-primary bg-lightgreen rounded-xl hover:opacity-90 transition-opacity"
          >
            Manage Settings
          </Link>
          <Link
            to="/settings"
            className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-xl hover:opacity-90 transition-opacity"
          >
            Change Password
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;


