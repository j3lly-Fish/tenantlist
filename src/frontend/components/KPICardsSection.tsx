import React from 'react';
import { KPICard } from './KPICard';
import styles from './KPICardsSection.module.css';

interface KPICardsSectionProps {
  activeBusinesses: number;
  performance: number;
  responseRate: number;
  landlordViews: number;
  loading?: boolean;
}

/**
 * KPICardsSection Component
 *
 * Container for 4 KPI cards displayed at the top of the dashboard.
 * Shows key metrics:
 * - Active Businesses (Building icon)
 * - Performance (Chart icon)
 * - Response Rate (Message icon)
 * - Landlord Views (Eye icon)
 *
 * Responsive layout:
 * - Desktop: 4 columns (1x4)
 * - Tablet: 2 columns (2x2)
 * - Mobile: 2 columns (2x2)
 */
export const KPICardsSection: React.FC<KPICardsSectionProps> = ({
  activeBusinesses,
  performance,
  responseRate,
  landlordViews,
  loading = false,
}) => {
  return (
    <section className={styles.kpiCardsSection} aria-label="Key Performance Indicators">
      <div className={styles.kpiCardsGrid}>
        <KPICard
          title="Active Businesses"
          value={activeBusinesses}
          icon="building"
          loading={loading}
        />
        <KPICard
          title="Performance"
          value={performance}
          suffix="%"
          icon="chart"
          loading={loading}
        />
        <KPICard
          title="Response Rate"
          value={responseRate}
          suffix="%"
          icon="message"
          loading={loading}
        />
        <KPICard
          title="Landlord Views"
          value={landlordViews}
          icon="eye"
          loading={loading}
        />
      </div>
    </section>
  );
};

KPICardsSection.displayName = 'KPICardsSection';
