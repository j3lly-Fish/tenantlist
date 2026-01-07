import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  LinkIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import styles from './BrokerSidebar.module.css';

/**
 * BrokerSidebar Props
 */
interface BrokerSidebarProps {
  /** Callback when a navigation item is clicked (useful for closing mobile menu) */
  onNavigate?: () => void;
}

/**
 * BrokerSidebar Component
 *
 * Left sidebar navigation menu for broker dashboard
 * - 6 menu items with icons and labels
 * - Active state highlighting
 * - Sticky positioning within BrokerLayout
 *
 * Menu Items:
 * 1. Overview (home icon) - /broker/overview
 * 2. Tenant Listings (users icon) - /broker/tenant-listings
 * 3. Property Listings (building icon) - /broker/property-listings
 * 4. Review Performance (chart icon) - /broker/review-performance
 * 5. Listing Matches (link icon) - /broker/listing-matches
 * 6. Invite Clients (mail icon) - /broker/invite-clients
 */
export const BrokerSidebar: React.FC<BrokerSidebarProps> = ({ onNavigate }) => {
  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <nav className={styles.brokerSidebar} aria-label="Broker dashboard navigation">
      <div className={styles.menuItems}>
        <NavLink
          to="/broker/overview"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <HomeIcon className={styles.icon} />
          <span className={styles.label}>Overview</span>
        </NavLink>

        <NavLink
          to="/broker/tenant-listings"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <UsersIcon className={styles.icon} />
          <span className={styles.label}>Tenant Listings</span>
        </NavLink>

        <NavLink
          to="/broker/property-listings"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <BuildingOffice2Icon className={styles.icon} />
          <span className={styles.label}>Property Listings</span>
        </NavLink>

        <NavLink
          to="/broker/review-performance"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <ChartBarIcon className={styles.icon} />
          <span className={styles.label}>Review Performance</span>
        </NavLink>

        <NavLink
          to="/broker/listing-matches"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <LinkIcon className={styles.icon} />
          <span className={styles.label}>Listing Matches</span>
        </NavLink>

        <NavLink
          to="/broker/invite-clients"
          className={({ isActive }) =>
            `${styles.menuItem} ${isActive ? styles.active : ''}`
          }
          onClick={handleClick}
        >
          <EnvelopeIcon className={styles.icon} />
          <span className={styles.label}>Invite Clients</span>
        </NavLink>
      </div>
    </nav>
  );
};
