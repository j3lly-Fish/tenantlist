import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  centered?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  centered = false,
}) => {
  return (
    <div
      className={`${styles.spinnerWrapper} ${centered ? styles.centered : ''}`}
      role="status"
      aria-label="Loading"
    >
      <div className={`${styles.spinner} ${styles[size]}`} aria-hidden="true" />
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
};
