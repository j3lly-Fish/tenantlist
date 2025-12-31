import React, { useState, useEffect } from 'react';
import { TopNavigation } from '@components/TopNavigation';
import styles from './Notifications.module.css';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

/**
 * Notifications Page
 *
 * Displays all user notifications:
 * - Unread notifications highlighted
 * - Mark as read functionality
 * - Clear all notifications
 * - Different notification types (info, success, warning, error)
 */
const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch notifications on mount
    const fetchNotifications = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/notifications');
        // const data = await response.json();
        // setNotifications(data);

        // Mock data for now
        setNotifications([
          {
            id: '1',
            type: 'info',
            title: 'Welcome to ZYX Platform',
            message: 'Your account has been successfully created.',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            read: false,
          },
          {
            id: '2',
            type: 'success',
            title: 'Business Profile Created',
            message: 'Your business profile has been published successfully.',
            timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            read: true,
          },
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );

    // TODO: Call API to mark notification as read
    // await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );

    // TODO: Call API to mark all notifications as read
    // await fetch('/api/notifications/read-all', { method: 'POST' });
  };

  const clearAll = () => {
    setNotifications([]);

    // TODO: Call API to clear all notifications
    // await fetch('/api/notifications', { method: 'DELETE' });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={styles.notificationsPage}>
      <TopNavigation />

      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Notifications</h1>
            {unreadCount > 0 && (
              <p className={styles.subtitle}>
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className={styles.actions}>
            {unreadCount > 0 && (
              <button
                className={styles.secondaryButton}
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className={styles.secondaryButton}
                onClick={clearAll}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <svg
              className={styles.emptyIcon}
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2 className={styles.emptyTitle}>No notifications</h2>
            <p className={styles.emptyMessage}>
              You're all caught up! Check back later for updates.
            </p>
          </div>
        ) : (
          <div className={styles.notificationsList}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationCard} ${
                  !notification.read ? styles.unread : ''
                } ${styles[notification.type]}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <h3 className={styles.notificationTitle}>
                      {notification.title}
                    </h3>
                    <span className={styles.notificationTime}>
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                  <p className={styles.notificationMessage}>
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <div className={styles.unreadIndicator} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
