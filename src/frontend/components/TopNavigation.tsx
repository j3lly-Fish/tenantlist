import React from 'react';
import { Logo } from './Logo';
import { NavigationTabs } from './NavigationTabs';
import { TierBadge } from './TierBadge';
import { MessageIcon } from './MessageIcon';
import { ProfileDropdown } from './ProfileDropdown';
import { useAuth } from '@contexts/AuthContext';
import styles from './TopNavigation.module.css';

interface TopNavigationProps {
  tier?: string;
}

/**
 * TopNavigation Component
 *
 * Main navigation bar for the tenant dashboard
 * - Displays logo on the left
 * - Shows navigation tabs in the center
 * - Displays tier badge and profile dropdown on the right
 * - Sticky positioning at top of page
 * - Integrates with AuthContext for user data
 *
 * Layout: [Logo] [Navigation Tabs] [Tier Badge] [Profile Dropdown]
 */
export const TopNavigation: React.FC<TopNavigationProps> = ({ tier = 'Free Plan' }) => {
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

        {/* Right section: Tier badge, Message icon, Profile dropdown */}
        <div className={styles.rightSection}>
          <TierBadge tier={tier} />
          <MessageIcon />
          <ProfileDropdown />
        </div>
      </div>
    </nav>
  );
};
