import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
const NotificationsPage: React.FC = () => {
  const {
    notifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();
  return <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-3xl font-bold text-primary">Notifications</h1>
      <button onClick={markAllAsRead} className="button-primary">Mark all as read</button>
    </div>
    <div className="mt-6">
      {notifications.length > 0 ? <div className="space-y-4">
        {notifications.map(notification => <div key={notification.id} className={`p-4 border-l-4 rounded-xl ${notification.read ? 'bg-lightgreen border-primary dark:bg-green-900 dark:bg-opacity-20' : 'bg-lightpurple border-secondary dark:bg-purple-900 dark:bg-opacity-20'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">{notification.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
            </div>
            {!notification.read && <button onClick={() => markAsRead(notification.id)} className="px-2 py-1 text-xs font-medium text-secondary bg-lightpurple dark:bg-purple-900 dark:text-purple-200 rounded-full">Mark as read</button>}
          </div>
        </div>)}
      </div> : <p className="text-center text-gray-600 dark:text-gray-400">No notifications to display</p>}
    </div>
  </div>;
};
export default NotificationsPage;