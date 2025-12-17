import React from 'react';
import styles from './KPICard.module.css';

interface KPICardProps {
  title: string;
  value: number | string;
  suffix?: string;
  isLocked?: boolean;
  tierRequired?: string;
  loading?: boolean;
}

/**
 * KPICard Component
 *
 * Displays a single KPI metric with:
 * - Large value (48px bold)
 * - Label below (14px regular gray)
 * - Locked state for tier-gated features
 * - Loading skeleton state
 *
 * Locked state shows gray overlay with "Upgrade to [tierRequired]" badge
 */
export const KPICard: React.FC<KPICardProps> = React.memo(({
  title,
  value,
  suffix = '',
  isLocked = false,
  tierRequired,
  loading = false,
}) => {
  const formatValue = () => {
    if (loading) {
      return '...';
    }

    if (isLocked) {
      return '—';
    }

    if (typeof value === 'string') {
      return value + suffix;
    }

    // Format number with commas
    return value.toLocaleString() + suffix;
  };

  const displayValue = formatValue();

  return (
    <div
      className={`${styles.kpiCard} ${isLocked ? styles.locked : ''}`}
      role="article"
      aria-label={`${title}: ${isLocked ? 'Locked' : displayValue}`}
      aria-live="polite"
    >
      {isLocked && (
        <div className={styles.lockOverlay}>
          <div className={styles.lockIcon}>🔒</div>
        </div>
      )}

      <div className={styles.kpiContent}>
        <div className={`${styles.kpiValue} ${loading ? styles.loading : ''}`}>
          {displayValue}
        </div>
        <div className={styles.kpiTitle}>{title}</div>
        {isLocked && tierRequired && (
          <div className={styles.upgradeBadge}>
            Upgrade to {tierRequired}
          </div>
        )}
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';
