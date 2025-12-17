import React from 'react';
import styles from './DashboardHeader.module.css';

/**
 * DashboardHeader Component
 *
 * Displays the main dashboard title and subtitle
 * - Title: "Tenant Dashboard"
 * - Subtitle: "Manage your space requirements and track proposals"
 */
export const DashboardHeader: React.FC = () => {
  return (
    <header className={styles.dashboardHeader}>
      <h1 className={styles.title}>Tenant Dashboard</h1>
      <p className={styles.subtitle}>Manage your space requirements and track proposals</p>
    </header>
  );
};
