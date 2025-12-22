import React from 'react';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  onFindSpace?: () => void;
  onListProperty?: () => void;
}

/**
 * HeroSection Component
 *
 * Landing page hero section with:
 * - "Get Listed" headline (h1)
 * - Subtext: "Providing commercial real estate pros with value"
 * - Two CTA buttons: "Find Space" (tenant) and "List Property" (landlord)
 * - Stats row: "Avg. Applications Per Listing: 24" and "Properties Matched: 850+"
 *
 * Props:
 * - onFindSpace: Callback when "Find Space" button is clicked (opens signup modal with Tenant role)
 * - onListProperty: Callback when "List Property" button is clicked (opens signup modal with Landlord role)
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  onFindSpace,
  onListProperty,
}) => {
  const handleFindSpace = () => {
    onFindSpace?.();
  };

  const handleListProperty = () => {
    onListProperty?.();
  };

  return (
    <section className={styles.heroSection} aria-label="Hero section">
      <div className={styles.container}>
        {/* Content wrapper */}
        <div className={styles.content}>
          {/* Headline */}
          <h1 className={styles.headline}>Get Listed</h1>

          {/* Subtext */}
          <p className={styles.subtext}>
            Providing commercial real estate pros with value
          </p>

          {/* CTA Buttons */}
          <div className={styles.ctaButtons}>
            <button
              type="button"
              className={styles.findSpaceButton}
              onClick={handleFindSpace}
            >
              <span className={styles.buttonIcon}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              Find Space
            </button>
            <button
              type="button"
              className={styles.listPropertyButton}
              onClick={handleListProperty}
            >
              <span className={styles.buttonIcon}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              List Property
            </button>
          </div>

          {/* Stats Row */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>24</span>
                <span className={styles.statLabel}>Avg. Applications Per Listing</span>
              </div>
            </div>

            <div className={styles.statDivider} aria-hidden="true" />

            <div className={styles.stat}>
              <div className={styles.statIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>850+</span>
                <span className={styles.statLabel}>Properties Matched</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className={styles.backgroundDecor} aria-hidden="true">
          <div className={styles.gradientOrb1} />
          <div className={styles.gradientOrb2} />
        </div>
      </div>
    </section>
  );
};
