import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { UserRole } from '@types';
import styles from './NavigationTabs.module.css';

/**
 * NavigationTabs Component
 *
 * Displays role-based navigation tabs
 * - TENANT: Dashboard, Trends, Applications
 * - LANDLORD: Dashboard (landlord-dashboard), Trends, Properties
 * - BROKER: Dashboard (broker-dashboard), Deals, Market
 * - Uses React Router NavLink for active state styling
 * - Active tab highlights with blue underline and bold text
 */
export const NavigationTabs: React.FC = () => {
  const { role } = useAuth();

  // Broker navigation tabs
  if (role === UserRole.BROKER) {
    return (
      <div className={styles.navigationTabs} role="tablist" aria-label="Main navigation tabs">
        <NavLink
          to="/broker-dashboard"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
          role="tab"
          aria-label="Dashboard"
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/broker/deals"
          className={({ isActive }) =>
            `${styles.tab} ${styles.placeholder} ${isActive ? styles.active : ''}`
          }
          role="tab"
          aria-label="Deals"
        >
          Deals
        </NavLink>

        <NavLink
          to="/market-insights"
          className={({ isActive }) =>
            `${styles.tab} ${styles.placeholder} ${isActive ? styles.active : ''}`
          }
          role="tab"
          aria-label="Market"
        >
          Market
        </NavLink>
      </div>
    );
  }

  // Landlord navigation tabs
  if (role === UserRole.LANDLORD) {
    return (
      <div className={styles.navigationTabs} role="tablist" aria-label="Main navigation tabs">
        <NavLink
          to="/landlord-dashboard"
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
          to="/landlord/properties"
          className={({ isActive }) =>
            `${styles.tab} ${styles.placeholder} ${isActive ? styles.active : ''}`
          }
          role="tab"
          aria-label="Properties"
        >
          Properties
        </NavLink>
      </div>
    );
  }

  // Tenant navigation tabs (default)
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
