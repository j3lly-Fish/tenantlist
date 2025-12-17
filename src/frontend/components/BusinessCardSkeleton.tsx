import React from 'react';
import styles from './BusinessCardSkeleton.module.css';

/**
 * BusinessCardSkeleton Component
 *
 * Placeholder loading state for BusinessCard
 * Displays pulsing gray rectangles matching BusinessCard layout
 * Used during initial data fetch and infinite scroll loading
 */
export const BusinessCardSkeleton: React.FC = React.memo(() => {
  return (
    <div className={styles.skeleton} role="status" aria-label="Loading business card">
      <div className={styles.logoPlaceholder}></div>
      <div className={styles.namePlaceholder}></div>
      <div className={styles.badgesPlaceholder}>
        <div className={styles.badgePlaceholder}></div>
        <div className={styles.badgePlaceholder}></div>
      </div>
      <div className={styles.metricsPlaceholder}>
        <div className={styles.metricPlaceholder}></div>
        <div className={styles.metricPlaceholder}></div>
        <div className={styles.metricPlaceholder}></div>
      </div>
      <div className={styles.buttonsPlaceholder}>
        <div className={styles.buttonPlaceholder}></div>
        <div className={styles.buttonPlaceholder}></div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
});

BusinessCardSkeleton.displayName = 'BusinessCardSkeleton';
