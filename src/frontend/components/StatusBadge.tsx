import React from 'react';
import { BusinessStatus } from '../../types';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: BusinessStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusText = () => {
    switch (status) {
      case BusinessStatus.ACTIVE:
        return 'Active';
      case BusinessStatus.PENDING_VERIFICATION:
        return 'Pending Verification';
      case BusinessStatus.STEALTH_MODE:
        return 'Stealth Mode';
      default:
        return status;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case BusinessStatus.ACTIVE:
        return styles.active;
      case BusinessStatus.PENDING_VERIFICATION:
        return styles.pending;
      case BusinessStatus.STEALTH_MODE:
        return styles.stealth;
      default:
        return '';
    }
  };

  return (
    <span
      className={`${styles.statusBadge} ${getStatusClass()}`}
      role="status"
      aria-label={`Status: ${getStatusText()}`}
    >
      {getStatusText()}
    </span>
  );
};
