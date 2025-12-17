import React from 'react';
import { DashboardKPIs } from '@types';
import { KPICard } from './KPICard';
import styles from './PerformanceKPIs.module.css';

interface PerformanceKPIsProps {
  kpis: DashboardKPIs;
  loading?: boolean;
  userTier?: string;
}

/**
 * PerformanceKPIs Component
 *
 * Displays 4 KPI cards in a responsive grid:
 * 1. Active Businesses
 * 2. Response Rate
 * 3. Landlord Views (locked for Starter tier)
 * 4. Messages Total
 *
 * Responsive layout:
 * - Desktop (1200px+): 4-column grid
 * - Tablet (768-1199px): 2x2 grid
 * - Mobile (<768px): Stacked vertically
 */
export const PerformanceKPIs: React.FC<PerformanceKPIsProps> = ({
  kpis,
  loading = false,
  userTier = 'starter',
}) => {
  const isStarterTier = userTier === 'starter' || userTier === 'free';

  return (
    <section className={styles.performanceKPIs} aria-label="Performance KPIs">
      <div className={styles.kpiGrid}>
        <KPICard
          title="Active Businesses"
          value={kpis.activeBusinesses}
          loading={loading}
        />

        <KPICard
          title="Response Rate"
          value={kpis.responseRate}
          loading={loading}
        />

        <KPICard
          title="Landlord Views"
          value={kpis.landlordViews}
          loading={loading}
          isLocked={isStarterTier}
          tierRequired="Pro"
        />

        <KPICard
          title="Messages Total"
          value={kpis.messagesTotal}
          loading={loading}
        />
      </div>
    </section>
  );
};
