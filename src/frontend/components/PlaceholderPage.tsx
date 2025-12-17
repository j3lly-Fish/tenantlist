import React from 'react';
import { TopNavigation } from './TopNavigation';
import styles from './PlaceholderPage.module.css';

interface PlaceholderPageProps {
  title: string;
  message: string;
  tierRequired?: string;
  showUpgradeButton?: boolean;
}

/**
 * PlaceholderPage Component
 *
 * Reusable component for placeholder pages that are not yet implemented
 * - Displays top navigation
 * - Shows title and message in centered layout
 * - Optionally shows tier requirement and upgrade button
 * - Consistent layout across all placeholder pages
 *
 * Usage:
 * <PlaceholderPage
 *   title="Market Trends"
 *   message="Coming Soon - This feature is available in Pro tier"
 *   tierRequired="Pro"
 *   showUpgradeButton={true}
 * />
 */
export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  message,
  tierRequired,
  showUpgradeButton = false,
}) => {
  const handleUpgradeClick = () => {
    alert('Upgrade functionality coming soon');
    console.log('Upgrade to:', tierRequired);
  };

  return (
    <div className={styles.placeholderPage}>
      <TopNavigation />

      <main className={styles.content}>
        <div className={styles.container}>
          <div className={styles.messageBox}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.message}>{message}</p>

            {tierRequired && (
              <div className={styles.tierInfo}>
                <span className={styles.tierBadge}>{tierRequired} Tier</span>
              </div>
            )}

            {showUpgradeButton && (
              <button
                className={styles.upgradeButton}
                onClick={handleUpgradeClick}
                aria-label={`Upgrade to ${tierRequired || 'premium'} tier`}
              >
                Upgrade Now
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
