import React, { useState } from 'react';
import styles from './AddBusinessButton.module.css';

/**
 * AddBusinessButton Component
 *
 * Primary CTA button for adding a new business
 * - Blue accent color (primary CTA styling)
 * - Shows "Coming Soon" message when clicked (placeholder)
 * - Disabled state for placeholder implementation
 */
export const AddBusinessButton: React.FC = () => {
  const [showToast, setShowToast] = useState(false);

  const handleClick = () => {
    // Placeholder: Show "Coming soon" message
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  return (
    <>
      <button
        className={styles.addBusinessButton}
        onClick={handleClick}
        aria-label="Add new business"
      >
        <span className={styles.icon}>+</span>
        <span className={styles.label}>Add Business</span>
      </button>

      {showToast && (
        <div className={styles.toast} role="alert">
          Coming soon
        </div>
      )}
    </>
  );
};
