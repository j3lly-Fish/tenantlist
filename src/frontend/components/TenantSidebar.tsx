import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  LinkIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import styles from './TenantSidebar.module.css';

/**
 * TenantSidebar Props
 */
interface TenantSidebarProps {
  /** Callback when a navigation item is clicked (useful for closing mobile menu) */
  onNavigate?: () => void;
}

/**
 * TenantSidebar Component
 *
 * Left sidebar navigation menu for tenant dashboard
 * - Menu header: "DASHBOARD MENU"
 * - 5 menu items with icons and labels
 * - Active state highlighting
 * - Sticky positioning
 *
 * Menu Items:
 * 1. Overview (home icon) - /dashboard
 * 2. My Businesses (building icon) - /my-businesses
 * 3. Review Performance (chart icon) - /review-performance
 * 4. Listing Matches (link icon) - /listing-matches
 * 5. Invite Team Member (envelope icon) - /invite-team-member
 */
export const TenantSidebar: React.FC<TenantSidebarProps> = ({ onNavigate }) => {
  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <nav className={styles.tenantSidebar} aria-label="Tenant dashboard navigation">
      <div className={styles.menuHeader}>DASHBOARD MENU</div>

      <div className={styles.menuItems}>
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <HomeIcon className={styles.icon} />
          <span className={styles.label}>Overview</span>
        </NavLink>

        <NavLink
          to="/my-businesses"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <BuildingOffice2Icon className={styles.icon} />
          <span className={styles.label}>My Businesses</span>
        </NavLink>

        <NavLink
          to="/review-performance"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <ChartBarIcon className={styles.icon} />
          <span className={styles.label}>Review Performance</span>
        </NavLink>

        <NavLink
          to="/listing-matches"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <LinkIcon className={styles.icon} />
          <span className={styles.label}>Listing Matches</span>
        </NavLink>

        <NavLink
          to="/invite-team-member"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <EnvelopeIcon className={styles.icon} />
          <span className={styles.label}>Invite Team Member</span>
        </NavLink>
      </div>
    </nav>
  );
};
