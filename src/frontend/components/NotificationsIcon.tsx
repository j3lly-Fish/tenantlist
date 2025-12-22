import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './NotificationsIcon.module.css';

interface NotificationsIconProps {
  /** Number of unread notifications (optional - for external state management) */
  unreadCount?: number;
}

/**
 * NotificationsIcon Component
 *
 * Bell icon button for accessing notifications
 * - Displays unread notification count badge
 * - Badge hidden when count is 0
 * - Navigates to /notifications on click
 * - Active state when on notifications page
 */
export const NotificationsIcon: React.FC<NotificationsIconProps> = ({
  unreadCount: externalCount
}) => {
  const [internalCount, setInternalCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith('/notifications');

  // Use external count if provided, otherwise use internal state
  const unreadCount = externalCount !== undefined ? externalCount : internalCount;

  // Fetch notification count on mount (if not provided externally)
  useEffect(() => {
    if (externalCount === undefined) {
      // Simulate fetching notification count
      // In a real implementation, this would call an API
      const fetchNotificationCount = async () => {
        try {
          // Placeholder: In production, replace with actual API call
          // const { count } = await getUnreadNotificationCount();
          // setInternalCount(count);

          // For now, use a mock value of 0 (can be changed for testing)
          setInternalCount(0);
        } catch (error) {
          console.error('Failed to fetch notification count:', error);
        }
      };

      fetchNotificationCount();
    }
  }, [externalCount]);

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <button
      className={`${styles.notificationsIcon} ${isActive ? styles.active : ''}`}
      onClick={handleClick}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      data-testid="notifications-icon"
    >
      {/* Bell icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Unread badge - only show if count > 0 */}
      {unreadCount > 0 && (
        <span className={styles.badge} aria-hidden="true" data-testid="notification-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
