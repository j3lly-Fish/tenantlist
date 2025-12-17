import React from 'react';
import styles from './MetricBadge.module.css';

interface MetricBadgeProps {
  icon?: React.ReactNode;
  label: string;
  value: number;
}

/**
 * MetricBadge Component
 *
 * Displays a metric with optional icon, label, and value
 * Used on business cards to show Listings count, States count, and Invites count
 *
 * Layout: [Icon] Label: Value
 * Styling: Gray background, rounded corners, compact padding
 */
export const MetricBadge: React.FC<MetricBadgeProps> = React.memo(({ icon, label, value }) => {
  return (
    <div className={styles.metricBadge} role="status" aria-label={`${label}: ${value}`}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}:</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
});

MetricBadge.displayName = 'MetricBadge';
