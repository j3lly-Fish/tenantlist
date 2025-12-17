import React from 'react';
import styles from './ConnectionIndicator.module.css';

interface ConnectionIndicatorProps {
  connectionState: 'connected' | 'disconnected' | 'reconnecting';
}

/**
 * ConnectionIndicator Component
 *
 * Displays WebSocket connection status with colored dot indicator
 * - Connected: Green dot (solid)
 * - Reconnecting: Yellow dot (pulsing)
 * - Disconnected: Red dot (solid)
 *
 * Fixed position in top-right corner with tooltip on hover
 */
export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ connectionState }) => {
  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = () => {
    switch (connectionState) {
      case 'connected':
        return styles.connected;
      case 'reconnecting':
        return styles.reconnecting;
      case 'disconnected':
        return styles.disconnected;
      default:
        return '';
    }
  };

  return (
    <div
      className={styles.connectionIndicator}
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${getStatusText()}`}
      title={getStatusText()}
    >
      <div className={`${styles.dot} ${getStatusClass()}`}></div>
      <span className={styles.statusText}>{getStatusText()}</span>
    </div>
  );
};
