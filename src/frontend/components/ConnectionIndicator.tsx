import React from 'react';
import styles from './ConnectionIndicator.module.css';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'polling';

interface ConnectionIndicatorProps {
  connectionStatus: ConnectionStatus;
}

/**
 * ConnectionIndicator Component
 *
 * Displays WebSocket connection status with colored dot indicator
 * - Connected: Green dot, "Live"
 * - Reconnecting: Yellow dot, "Reconnecting..."
 * - Polling: Blue dot, "Polling"
 * - Disconnected: Red dot, "Disconnected"
 *
 * Can be positioned in top-right corner of dashboard header
 */
export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ connectionStatus }) => {
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'polling':
        return 'Polling';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return styles.connected;
      case 'reconnecting':
        return styles.reconnecting;
      case 'polling':
        return styles.polling;
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
