import React from 'react';
import { Logo } from './Logo';
import { NavigationTabs } from './NavigationTabs';
import { TierBadge } from './TierBadge';
import { FavoritesIcon } from './FavoritesIcon';
import { NotificationsIcon } from './NotificationsIcon';
import { MessageIcon } from './MessageIcon';
import { ProfileDropdown } from './ProfileDropdown';
import { useAuth } from '@contexts/AuthContext';
import styles from './TopNavigation.module.css';

interface TopNavigationProps {
  tier?: string;
  /** Number of unread notifications (optional - for external state management) */
  notificationCount?: number;
}

/**
 * TopNavigation Component
 *
 * Main navigation bar for the tenant dashboard
 * - Displays logo on the left
 * - Shows navigation tabs in the center
 * - Displays icons and profile dropdown on the right
 * - Sticky positioning at top of page
 * - Integrates with AuthContext for user data
 *
 * Icon Order (left to right in right section):
 * [Favorites] [Notifications] [Messages] [Tier Badge] [Profile Dropdown]
 */
export const TopNavigation: React.FC<TopNavigationProps> = ({
  tier = 'Free Plan',
  notificationCount
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <nav className={styles.topNavigation} role="navigation" aria-label="Main navigation">
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.topNavigation} role="navigation" aria-label="Main navigation">
      <div className={styles.container}>
        {/* Left section: Logo */}
        <div className={styles.leftSection}>
          <Logo />
        </div>

        {/* Center section: Navigation tabs */}
        <div className={styles.centerSection}>
          <NavigationTabs />
        </div>

        {/* Right section: Favorites, Notifications, Messages, Tier badge, Profile dropdown */}
        <div className={styles.rightSection}>
          <div className={styles.iconGroup}>
            <FavoritesIcon />
            <NotificationsIcon unreadCount={notificationCount} />
            <MessageIcon />
          </div>
          <TierBadge tier={tier} />
          <ProfileDropdown />
        </div>
      </div>
    </nav>
  );
};
