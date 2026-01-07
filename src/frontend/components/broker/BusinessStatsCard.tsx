import React, { useEffect, useState } from 'react';
import styles from './BusinessStatsCard.module.css';
import apiClient from '@utils/apiClient';
import { useBusinessProfile } from '@contexts/BusinessProfileContext';

/**
 * BusinessStatsCard Component
 *
 * Displays business profile statistics in a grid layout.
 * Shows 4 metrics: Offices, Agents, Tenants, Properties
 * Features:
 * - Loading state while fetching
 * - Empty state when no profile selected
 * - Number formatting (shows "--" for zero)
 * - Auto-updates when active profile changes
 */

interface BusinessStats {
  business_profile_id: string;
  offices_count: number;
  agents_count: number;
  tenants_count: number;
  properties_count: number;
  updated_at: string;
}

export const BusinessStatsCard: React.FC = () => {
  const { activeProfileId } = useBusinessProfile();
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stats when activeProfileId changes
  useEffect(() => {
    if (activeProfileId) {
      loadStats(activeProfileId);
    } else {
      setStats(null);
      setError(null);
    }
  }, [activeProfileId]);

  const loadStats = async (profileId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<BusinessStats>(
        `/api/broker/business-profiles/${profileId}/stats`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load business stats');
      }

      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to load business stats:', err);
      setError(err.message || 'Failed to load business stats');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Format number: show value or "--" for zero/null
  const formatCount = (count: number | null | undefined): string => {
    if (count === null || count === undefined || count === 0) {
      return '--';
    }
    return count.toString();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={styles.statsCard}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Loading stats...
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={styles.statsCard}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  // Render empty state (no active profile)
  if (!activeProfileId || !stats) {
    return (
      <div className={styles.statsCard}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📊</div>
          <p className={styles.emptyStateText}>No business profile selected</p>
          <p className={styles.emptyStateSubtext}>
            Select a business profile from the sidebar to view statistics
          </p>
        </div>
      </div>
    );
  }

  // Render stats
  return (
    <div className={styles.statsCard}>
      <div className={styles.header}>
        <h3 className={styles.title}>Business Statistics</h3>
        <p className={styles.subtitle}>Overview of your business metrics</p>
      </div>

      <div className={styles.statsGrid}>
        {/* Offices */}
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <div className={styles.statValue}>{formatCount(stats.offices_count)}</div>
          <div className={styles.statLabel}>Offices</div>
        </div>

        {/* Agents */}
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <div className={styles.statValue}>{formatCount(stats.agents_count)}</div>
          <div className={styles.statLabel}>Agents</div>
        </div>

        {/* Tenants */}
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <div className={styles.statValue}>{formatCount(stats.tenants_count)}</div>
          <div className={styles.statLabel}>Tenants</div>
        </div>

        {/* Properties */}
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <div className={styles.statValue}>{formatCount(stats.properties_count)}</div>
          <div className={styles.statLabel}>Properties</div>
        </div>
      </div>
    </div>
  );
};
