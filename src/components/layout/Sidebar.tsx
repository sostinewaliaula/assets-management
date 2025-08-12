import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { HomeIcon, MonitorIcon, TicketIcon, UsersIcon, BuildingIcon, SettingsIcon, LogOutIcon } from 'lucide-react';
interface SidebarProps {
  closeSidebar: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({
  closeSidebar
}) => {
  const location = useLocation();
  const {
    user,
    logout
  } = useAuth();
  const { addToast } = useNotifications();
  const isAdmin = user?.role === 'admin';
  const userNavItems = [{
    name: 'Dashboard',
    path: '/user/dashboard',
    icon: <HomeIcon size={20} />
  }, {
    name: 'My Assets',
    path: '/user/assets',
    icon: <MonitorIcon size={20} />
  }, {
    name: 'My Issues',
    path: '/user/issues',
    icon: <TicketIcon size={20} />
  }];
  const adminNavItems = [{
    name: 'Admin Dashboard',
    path: '/admin/dashboard',
    icon: <HomeIcon size={20} />
  }, {
    name: 'Asset Management',
    path: '/admin/assets',
    icon: <MonitorIcon size={20} />
  }, {
    name: 'Issue Management',
    path: '/admin/issues',
    icon: <TicketIcon size={20} />
  }, {
    name: 'User Management',
    path: '/admin/users',
    icon: <UsersIcon size={20} />
  }, {
    name: 'Departments',
    path: '/admin/departments',
    icon: <BuildingIcon size={20} />
  }, {
    name: 'Settings',
    path: '/settings',
    icon: <SettingsIcon size={20} />
  }];
  const userOnlySettings = { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> };
  const navItems = isAdmin ? [...adminNavItems, ...userNavItems] : [...userNavItems, userOnlySettings];
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  return <div className="flex flex-col h-full py-4 text-gray-800 dark:text-gray-200">
    <div className="px-4 pb-6">
      <Link to="/" className="flex items-center" onClick={closeSidebar}>
        <span className="text-2xl font-bold" style={{ color: '#219653' }}>Turnkey</span>
        <span className="ml-1 text-2xl font-bold" style={{ color: '#9B51E0' }}>Africa</span>
      </Link>
    </div>
    <div className="flex-1 px-2 space-y-1">
      {navItems.map(item => <Link key={item.path} to={item.path} onClick={closeSidebar} className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-150 ${isActive(item.path) ? 'bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-button' : 'text-gray-700 dark:text-gray-200 hover:bg-lightgreen hover:text-primary dark:hover:text-primary'}`}> <span className="mr-3">{item.icon}</span> {item.name} </Link>)}
    </div>
    <div className="px-2 mt-6">
      <button onClick={() => { 
        logout(); 
        closeSidebar(); 
        addToast({
          title: 'Logged Out',
          message: 'You have been successfully logged out.',
          type: 'info',
          duration: 3000
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }} className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-xl hover:bg-lightgreen dark:hover:bg-gray-800">
        <LogOutIcon size={20} className="mr-3" />
        Logout
      </button>
    </div>
  </div>;
};
export default Sidebar;