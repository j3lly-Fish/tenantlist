import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getBrokerKPIs } from '@utils/apiClient';
import { getEnv } from '@utils/env';

/**
 * Connection status type
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'polling';

/**
 * Broker KPI data structure
 */
export interface BrokerKPIData {
  activeDeals?: { value: number; trend?: any };
  commissionPipeline?: { value: number; trend?: any };
  responseRate?: { value: number; trend?: any };
  propertiesMatched?: { value: number; trend?: any };
}

/**
 * WebSocket event types for broker dashboard
 */
export interface BrokerDashboardEvents {
  onKPIUpdate?: (kpis: BrokerKPIData) => void;
  onDealCreated?: (deal: any) => void;
  onDealUpdated?: (dealId: string, deal: any) => void;
}

/**
 * Custom hook for managing broker dashboard WebSocket connection and real-time updates
 *
 * Features:
 * - Establishes WebSocket connection on mount
 * - Listens for KPI and broker deal update events
 * - Implements fallback to polling after 3 failed reconnection attempts
 * - Auto-reconnection with exponential backoff (1s, 2s, 4s)
 * - Cleans up connection on unmount
 * - Provides connection status
 *
 * @param userId - User ID for the broker
 * @param enabled - Whether to enable WebSocket connection
 * @param events - Event handlers for broker updates
 * @returns Object with connection status and refresh function
 */
export const useBrokerDashboardWebSocket = (
  userId: string | undefined,
  enabled: boolean,
  events: BrokerDashboardEvents
) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 3;
  const reconnectDelays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
  const hasInitializedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start polling for KPI data as fallback
   */
  const startPolling = useCallback(() => {
    console.log('Starting KPI polling fallback');

    // Poll every 30 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const kpis = await getBrokerKPIs();
        if (events.onKPIUpdate) {
          events.onKPIUpdate(kpis);
        }
      } catch (error) {
        console.error('Error polling broker KPIs:', error);
      }
    }, 30000);
  }, [events]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('Stopping KPI polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Handle WebSocket connection failure
   * Falls back to polling after max reconnection attempts
   */
  const handleConnectionFailed = useCallback(() => {
    console.log('WebSocket connection failed after max attempts, falling back to polling');
    setConnectionStatus('polling');
    startPolling();
  }, [startPolling]);

  /**
   * Handle reconnection with exponential backoff
   */
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      handleConnectionFailed();
      return;
    }

    // Calculate delay with exponential backoff
    const delayIndex = Math.min(reconnectAttemptsRef.current, reconnectDelays.length - 1);
    const delay = reconnectDelays[delayIndex];

    console.log(
      `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`
    );

    setConnectionStatus('reconnecting');

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }, delay);
  }, [handleConnectionFailed]);

  /**
   * Connect to WebSocket
   */
  const connectWebSocket = useCallback(() => {
    if (!userId || !enabled) {
      return;
    }

    // Prevent double initialization
    if (hasInitializedRef.current || socketRef.current?.connected) {
      return;
    }

    hasInitializedRef.current = true;

    // Get WebSocket base URL
    const env = getEnv();
    const wsBaseUrl = env.VITE_WS_BASE_URL || '';

    try {
      // Create socket connection to /dashboard namespace
      const socket = io(`${wsBaseUrl}/dashboard`, {
        withCredentials: true, // Include httpOnly cookies for JWT authentication
        transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
        reconnection: false, // Manual reconnection with exponential backoff
        timeout: 10000, // 10 second connection timeout
      });

      socketRef.current = socket;

      // Connection successful
      socket.on('connect', () => {
        console.log('WebSocket connected to broker dashboard namespace');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // If we were polling, stop polling since WebSocket is working
        if (connectionStatus === 'polling') {
          stopPolling();
        }
      });

      // Connection error
      socket.on('connect_error', (error: Error) => {
        console.error('WebSocket connection error:', error.message);
        setConnectionStatus('disconnected');
        handleReconnect();
      });

      // Disconnection
      socket.on('disconnect', (reason: string) => {
        console.log('WebSocket disconnected:', reason);
        setConnectionStatus('disconnected');

        // Only attempt reconnection for unexpected disconnections
        if (reason !== 'io client disconnect') {
          handleReconnect();
        }
      });

      // Listen for broker-specific KPI updates
      socket.on('broker:kpi-update', (kpis: BrokerKPIData) => {
        console.log('Received broker KPI update:', kpis);
        if (events.onKPIUpdate) {
          events.onKPIUpdate(kpis);
        }
      });

      // Listen for broker deal created events
      socket.on('broker:deal-created', (deal: any) => {
        console.log('Received broker deal created:', deal);
        if (events.onDealCreated) {
          events.onDealCreated(deal);
        }
      });

      // Listen for broker deal updated events
      socket.on('broker:deal-updated', (data: { dealId: string; deal: any }) => {
        console.log('Received broker deal updated:', data);
        if (events.onDealUpdated) {
          events.onDealUpdated(data.dealId, data.deal);
        }
      });

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      handleConnectionFailed();
    }
  }, [userId, enabled, connectionStatus, events, handleReconnect, handleConnectionFailed, stopPolling]);

  /**
   * Disconnect WebSocket and cleanup
   */
  const disconnectWebSocket = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop polling
    stopPolling();

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Reset state
    hasInitializedRef.current = false;
    reconnectAttemptsRef.current = 0;
    setConnectionStatus('disconnected');
  }, [stopPolling]);

  /**
   * Set up WebSocket connection on mount
   */
  useEffect(() => {
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isPolling: connectionStatus === 'polling',
    isReconnecting: connectionStatus === 'reconnecting',
    refresh: connectWebSocket,
  };
};
