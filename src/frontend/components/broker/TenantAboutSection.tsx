import React, { useState } from 'react';
import styles from './TenantAboutSection.module.css';

interface TenantAboutSectionProps {
  about?: string | null;
}

/**
 * TenantAboutSection Component
 *
 * Displays company description with expand/collapse for long text (>500 chars)
 */
export const TenantAboutSection: React.FC<TenantAboutSectionProps> = ({ about }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const COLLAPSE_THRESHOLD = 500;

  if (!about || about.trim().length === 0) {
    return null;
  }

  const needsExpansion = about.length > COLLAPSE_THRESHOLD;
  const displayText = needsExpansion && !isExpanded
    ? about.substring(0, COLLAPSE_THRESHOLD) + '...'
    : about;

  return (
    <section className={styles.aboutSection}>
      <h2 className={styles.sectionTitle}>About</h2>
      <div className={styles.content}>
        <p className={styles.aboutText}>{displayText}</p>
        {needsExpansion && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleButton}
          >
            {isExpanded ? 'view less' : 'view more'}
          </button>
        )}
      </div>
    </section>
  );
};
