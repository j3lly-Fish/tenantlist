import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './NavigationTabs.module.css';

/**
 * NavigationTabs Component
 *
 * Displays navigation tabs: Dashboard, Trends, Applications
 * - Dashboard is active and functional
 * - Trends and Applications are grayed out (placeholder tabs)
 * - Uses React Router NavLink for active state styling
 * - Active tab highlights with blue underline and bold text
 * - Messages moved to icon next to profile
 */
export const NavigationTabs: React.FC = () => {
  return (
    <div className={styles.navigationTabs} role="tablist" aria-label="Main navigation tabs">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `${styles.tab} ${isActive ? styles.active : ''}`
        }
        role="tab"
        aria-label="Dashboard"
      >
        Dashboard
      </NavLink>

      <NavLink
        to="/trends"
        className={({ isActive }) =>
          `${styles.tab} ${styles.placeholder} ${isActive ? styles.active : ''}`
        }
        role="tab"
        aria-label="Trends"
      >
        Trends
      </NavLink>

      <NavLink
        to="/applications"
        className={({ isActive }) =>
          `${styles.tab} ${styles.placeholder} ${isActive ? styles.active : ''}`
        }
        role="tab"
        aria-label="Applications"
      >
        Applications
      </NavLink>
    </div>
  );
};
