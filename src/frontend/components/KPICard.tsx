import React from 'react';
import styles from './KPICard.module.css';

export type KPIIconType = 'building' | 'chart' | 'message' | 'eye' | 'none';

interface KPICardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: KPIIconType;
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
 * - Icon on the right side
 * - Locked state for tier-gated features
 * - Loading skeleton state
 *
 * Locked state shows gray overlay with "Upgrade to [tierRequired]" badge
 */
export const KPICard: React.FC<KPICardProps> = React.memo(({
  title,
  value,
  suffix = '',
  icon = 'none',
  isLocked = false,
  tierRequired,
  loading = false,
}) => {
  const formatValue = () => {
    if (loading) {
      return '...';
    }

    if (isLocked) {
      return '--';
    }

    if (typeof value === 'string') {
      return value + suffix;
    }

    // Format number with commas
    return value.toLocaleString() + suffix;
  };

  const displayValue = formatValue();

  const renderIcon = () => {
    if (icon === 'none') return null;

    switch (icon) {
      case 'building':
        return (
          <svg
            data-testid="icon-building"
            className={styles.icon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
            <path d="M8 14h.01" />
            <path d="M16 14h.01" />
          </svg>
        );
      case 'chart':
        return (
          <svg
            data-testid="icon-chart"
            className={styles.icon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case 'message':
        return (
          <svg
            data-testid="icon-message"
            className={styles.icon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'eye':
        return (
          <svg
            data-testid="icon-eye"
            className={styles.icon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`${styles.kpiCard} ${isLocked ? styles.locked : ''}`}
      role="article"
      aria-label={`${title}: ${isLocked ? 'Locked' : displayValue}`}
      aria-live="polite"
    >
      {isLocked && (
        <div className={styles.lockOverlay}>
          <div className={styles.lockIcon}>lock</div>
        </div>
      )}

      <div className={styles.kpiContent}>
        <div className={styles.kpiMain}>
          <div className={styles.kpiTextContent}>
            <div className={styles.kpiTitle}>{title}</div>
            <div className={`${styles.kpiValue} ${loading ? styles.loading : ''}`}>
              {displayValue}
            </div>
          </div>
          {icon !== 'none' && (
            <div className={styles.iconContainer}>
              {renderIcon()}
            </div>
          )}
        </div>
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
