import React, { useEffect, useState, createContext, useContext } from 'react';
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
}
interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  toasts: ToastNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  dismissToast: (id: string) => void;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Update unread count whenever notifications change
  useEffect(() => {
    setUnreadCount(notifications.filter(notification => !notification.read).length);
  }, [notifications]);
  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? {
      ...notification,
      read: true
    } : notification));
  };
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
  };
  // Add a toast notification
  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const newToast: ToastNotification = {
      ...toast,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setToasts(prev => [...prev, newToast]);
  };

  // Dismiss a toast
  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  // For demo purposes, add some example notifications
  useEffect(() => {
    // Add sample notifications after a short delay
    const timer = setTimeout(() => {
      addNotification({
        title: 'New Asset Assigned',
        message: 'A new laptop has been assigned to you',
        type: 'info'
      });
      addNotification({
        title: 'Maintenance Required',
        message: 'Your monitor is due for maintenance next week',
        type: 'warning'
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  const value = {
    notifications,
    toasts,
    unreadCount,
    addNotification,
    addToast,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    dismissToast
  };
  return <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>;
};