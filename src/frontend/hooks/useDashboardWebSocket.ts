import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketClient } from '@utils/websocketClient';
import { startPolling, stopPolling } from '@utils/pollingService';
import { DashboardKPIs, Business } from '@types';

/**
 * Custom hook for managing dashboard WebSocket connection and real-time updates
 *
 * Features:
 * - Establishes WebSocket connection on mount
 * - Listens for KPI and business update events
 * - Implements fallback to polling after 3 failed reconnection attempts
 * - Cleans up connection on unmount
 * - Provides connection status
 *
 * @param onKPIUpdate - Callback when KPIs are updated
 * @param onBusinessUpdate - Callback when a business is updated
 * @param onBusinessCreated - Callback when a business is created
 * @param onBusinessDeleted - Callback when a business is deleted
 * @returns Object with connection status
 */
export const useDashboardWebSocket = (
  onKPIUpdate: ((kpis: DashboardKPIs) => void) | undefined,
  onBusinessUpdate: (business: Business) => void,
  onBusinessCreated: (business: Business) => void,
  onBusinessDeleted: (data: { businessId: string }) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isFallbackPolling, setIsFallbackPolling] = useState(false);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const hasInitializedRef = useRef(false);

  /**
   * Handle WebSocket connection failure
   * Falls back to polling after max reconnection attempts
   */
  const handleConnectionFailed = useCallback(() => {
    console.log('WebSocket connection failed after max attempts, falling back to polling');
    setIsConnected(false);
    setIsFallbackPolling(true);

    // Start polling for dashboard data
    startPolling((data) => {
      if (data.kpis && onKPIUpdate) {
        onKPIUpdate(data.kpis);
      }
    });
  }, [onKPIUpdate]);

  /**
   * Set up WebSocket connection and event listeners
   */
  useEffect(() => {
    // Prevent double initialization in React 18 Strict Mode
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    // Connect to dashboard WebSocket
    websocketClient.connectToDashboard(handleConnectionFailed);

    // Set up event listeners
    const cleanupKPI = websocketClient.onKPIUpdate((kpis) => {
      if (onKPIUpdate) {
        onKPIUpdate(kpis);
      }
      setIsConnected(true);

      // If we were polling, stop polling since WebSocket is working
      if (isFallbackPolling) {
        stopPolling();
        setIsFallbackPolling(false);
      }
    });

    const cleanupBusinessUpdate = websocketClient.onBusinessUpdate((business) => {
      onBusinessUpdate(business);
    });

    const cleanupBusinessCreated = websocketClient.onBusinessCreated((business) => {
      onBusinessCreated(business);
    });

    const cleanupBusinessDeleted = websocketClient.onBusinessDeleted((data) => {
      onBusinessDeleted(data);
    });

    // Store cleanup functions
    cleanupFunctionsRef.current = [
      cleanupKPI,
      cleanupBusinessUpdate,
      cleanupBusinessCreated,
      cleanupBusinessDeleted,
    ];

    // Cleanup on unmount
    return () => {
      // Call all cleanup functions for event listeners
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      cleanupFunctionsRef.current = [];

      // Disconnect WebSocket
      websocketClient.disconnect();

      // Stop polling if active
      if (isFallbackPolling) {
        stopPolling();
      }

      // Reset refs
      hasInitializedRef.current = false;
    };
  }, [
    handleConnectionFailed,
    onKPIUpdate,
    onBusinessUpdate,
    onBusinessCreated,
    onBusinessDeleted,
    isFallbackPolling,
  ]);

  return {
    isConnected,
    isFallbackPolling,
  };
};
