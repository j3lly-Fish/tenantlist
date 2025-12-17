import React from 'react';
import styles from './PropertyCardSkeleton.module.css';

/**
 * PropertyCardSkeleton Component
 *
 * Loading placeholder for PropertyCard component
 * Shows animated skeleton while property data loads
 */
export const PropertyCardSkeleton: React.FC = () => {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      {/* Photo placeholder */}
      <div className={styles.photoPlaceholder} />

      {/* Content placeholders */}
      <div className={styles.content}>
        {/* Title and type */}
        <div className={styles.header}>
          <div className={styles.titlePlaceholder} />
          <div className={styles.typePlaceholder} />
        </div>

        {/* Location */}
        <div className={styles.locationPlaceholder} />

        {/* Details */}
        <div className={styles.detailsPlaceholder} />

        {/* Metrics */}
        <div className={styles.metricsPlaceholder}>
          <div className={styles.metricPlaceholder} />
          <div className={styles.metricPlaceholder} />
          <div className={styles.metricPlaceholder} />
        </div>

        {/* Button */}
        <div className={styles.buttonPlaceholder} />
      </div>
    </div>
  );
};
