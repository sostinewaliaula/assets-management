import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MenuIcon, BellIcon, SunIcon, MoonIcon, UserIcon } from 'lucide-react';
import NotificationDropdown from '../ui/NotificationDropdown';
import DatabaseStatus from '../ui/DatabaseStatus';
interface HeaderProps {
  toggleSidebar: () => void;
}
const Header: React.FC<HeaderProps> = ({
  toggleSidebar
}) => {
  const {
    user
  } = useAuth();
  const {
    unreadCount
  } = useNotifications();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isDark = theme === 'dark';
  return <header className="z-10 py-4 bg-white dark:bg-gray-900 shadow-sm">
    <div className="container flex items-center justify-between h-full px-6 mx-auto">
      {/* Logo */}
      <Link to="/" className="flex items-center mr-8 select-none">
        <span className="text-2xl font-bold" style={{ color: '#219653' }}>Assets -</span>
        <span className="text-2xl font-bold ml-1" style={{ color: '#9B51E0' }}>Management</span>
      </Link>
      
      {/* Database Status */}
      <div className="flex-1 flex justify-center">
        <DatabaseStatus className="hidden lg:flex" />
      </div>
      
      <div className="flex items-center">
        {/* Database Status - Mobile */}
        <DatabaseStatus className="lg:hidden mr-4" />
        
        {/* Theme toggler */}
        <button onClick={toggleTheme} className="p-2 mr-5 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary bg-gray-100 dark:bg-gray-800 transition-colors duration-200" aria-label="Toggle color mode">
          {isDark ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-gray-600" />}
        </button>
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-1 mr-5 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary relative" aria-label="Notifications">
            <BellIcon className="w-5 h-5 text-gray-500 dark:text-gray-200" />
            {unreadCount > 0 && <span className="absolute top-0 right-0 inline-block w-3 h-3 transform translate-x-1 -translate-y-1 bg-red-600 border-2 border-white rounded-full dark:border-gray-900"></span>}
          </button>
          {notificationsOpen && <NotificationDropdown onClose={() => setNotificationsOpen(false)} />}
        </div>
        {/* Profile */}
        <div className="relative">
          <button className="flex items-center focus:outline-none" aria-label="Account">
            <div className="hidden mr-2 text-right md:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.name}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </p>
            </div>
            <div className="p-1 mr-2 text-gray-400 bg-gray-100 rounded-full dark:bg-gray-800">
              <UserIcon className="w-6 h-6" />
            </div>
          </button>
        </div>
      </div>
    </div>
  </header>;
};
export default Header;