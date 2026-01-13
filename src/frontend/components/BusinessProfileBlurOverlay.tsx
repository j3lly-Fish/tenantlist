import React from 'react';
import styles from './BusinessProfileBlurOverlay.module.css';

interface BusinessProfileBlurOverlayProps {
  isVisible: boolean;
  onAddBusinessClick: () => void;
}

/**
 * BusinessProfileBlurOverlay Component
 *
 * Displays a blur overlay on the tenant dashboard when the user has no businesses.
 * Shows a centered card with onboarding message and "+ Add Business" button.
 *
 * Features:
 * - Blur effect: backdrop-filter blur(8px) with semi-transparent white background
 * - Centered card with white background and 12px border radius
 * - Title: "Begin your journey" (32px, semi-bold)
 * - Subtitle: Call-to-action message (16px, #666)
 * - Button: "+ Add Business" (dark #1a1a1a, white text, 8px border radius)
 *
 * Props:
 * - isVisible: Controls overlay visibility based on business count
 * - onAddBusinessClick: Callback to open global business search modal
 */
export const BusinessProfileBlurOverlay: React.FC<BusinessProfileBlurOverlayProps> = ({
  isVisible,
  onAddBusinessClick,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={styles.overlay}
      data-testid="blur-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blur-overlay-title"
      aria-describedby="blur-overlay-description"
    >
      <div className={styles.card} data-testid="blur-overlay-card">
        <h2 id="blur-overlay-title" className={styles.title}>
          Begin your journey
        </h2>
        <p id="blur-overlay-description" className={styles.subtitle}>
          Add your businesses and space needs so landlords can begin sending you locations.
        </p>
        <button
          className={styles.addBusinessButton}
          onClick={onAddBusinessClick}
          aria-label="Add your first business"
        >
          + Add Business
        </button>
      </div>
    </div>
  );
};
