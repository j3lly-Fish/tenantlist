import React, { useState, useEffect, useCallback } from 'react';
import { PropertyMatchWithProperty } from '@types';
import { getPropertyMatches, toggleMatchSaved, dismissMatch } from '../utils/apiClient';
import { PropertyMatchCard } from './PropertyMatchCard';
import styles from './PropertyMatchesSection.module.css';

interface PropertyMatchesSectionProps {
  refreshTrigger?: number;
}

/**
 * PropertyMatchesSection Component
 * Displays top property matches for the tenant's demand listings
 */
export const PropertyMatchesSection: React.FC<PropertyMatchesSectionProps> = ({
  refreshTrigger,
}) => {
  const [matches, setMatches] = useState<PropertyMatchWithProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const response = await getPropertyMatches(10);
      setMatches(response.matches);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError('Failed to load property matches');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      setIsRefreshing(true);
      fetchMatches();
    }
  }, [refreshTrigger, fetchMatches]);

  // Handle refresh button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMatches();
  };

  // Handle save toggle
  const handleSave = async (matchId: string) => {
    try {
      const response = await toggleMatchSaved(matchId);
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId ? { ...match, is_saved: response.isSaved } : match
        )
      );
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  // Handle dismiss
  const handleDismiss = async (matchId: string) => {
    try {
      await dismissMatch(matchId);
      setMatches((prev) => prev.filter((match) => match.id !== matchId));
    } catch (err) {
      console.error('Failed to dismiss match:', err);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className={styles.matchesSection}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>Property Matches</h2>
          </div>
        </div>
        <div className={styles.skeletonGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonImage} />
              <div className={styles.skeletonContent}>
                <div className={`${styles.skeletonLine} ${styles.short}`} />
                <div className={`${styles.skeletonLine} ${styles.medium}`} />
                <div className={`${styles.skeletonLine} ${styles.long}`} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className={styles.matchesSection}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>Property Matches</h2>
          </div>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <svg
              className={`${styles.refreshIcon} ${isRefreshing ? styles.spinning : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Retry
          </button>
        </div>
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className={styles.emptyTitle}>Unable to load matches</h3>
          <p className={styles.emptyText}>{error}</p>
        </div>
      </section>
    );
  }

  // Empty state
  if (matches.length === 0) {
    return (
      <section className={styles.matchesSection}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>Property Matches</h2>
            <span className={styles.matchCount}>0</span>
          </div>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <svg
              className={`${styles.refreshIcon} ${isRefreshing ? styles.spinning : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h3 className={styles.emptyTitle}>No matches yet</h3>
          <p className={styles.emptyText}>
            Create a demand listing to get matched with available properties that meet your requirements.
          </p>
        </div>
      </section>
    );
  }

  // Matches grid
  return (
    <section className={styles.matchesSection}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>Property Matches</h2>
          <span className={styles.matchCount}>{matches.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <svg
              className={`${styles.refreshIcon} ${isRefreshing ? styles.spinning : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <a href="/matches" className={styles.viewAllLink}>
            View all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
      <div className={styles.matchesGrid}>
        {matches.map((match) => (
          <PropertyMatchCard
            key={match.id}
            match={match}
            onSave={handleSave}
            onDismiss={handleDismiss}
            showMatchDetails={true}
          />
        ))}
      </div>
    </section>
  );
};

export default PropertyMatchesSection;
