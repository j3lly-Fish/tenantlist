import React, { useState } from 'react';
import styles from './WarningBanner.module.css';

interface WarningBannerProps {
  message: string;
  variant?: 'warning' | 'error' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  message,
  variant = 'warning',
  dismissible = false,
  onDismiss,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (isDismissed) {
    return null;
  }

  const getIcon = () => {
    switch (variant) {
      case 'error':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'warning':
      default:
        return '⚠';
    }
  };

  return (
    <div
      className={`${styles.warningBanner} ${styles[variant]}`}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.icon} aria-hidden="true">
        {getIcon()}
      </span>
      <span className={styles.message}>{message}</span>
      {dismissible && (
        <button
          className={styles.dismissButton}
          onClick={handleDismiss}
          aria-label="Dismiss warning"
        >
          &times;
        </button>
      )}
    </div>
  );
};
