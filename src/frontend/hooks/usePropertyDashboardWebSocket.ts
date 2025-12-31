import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { startPropertyPolling, stopPropertyPolling } from '../services/propertyPollingService';
import { PropertyKPIData, PropertyListing } from '@utils/apiClient';
import { getEnv } from '@utils/env';

/**
 * Connection status type
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'polling';

/**
 * WebSocket event types for property dashboard
 */
export interface PropertyDashboardEvents {
  onKPIUpdate?: (kpis: PropertyKPIData) => void;
  onPropertyCreated?: (property: PropertyListing) => void;
  onPropertyUpdated?: (propertyId: string, property: PropertyListing) => void;
  onPropertyDeleted?: (propertyId: string) => void;
  onStatusChanged?: (propertyId: string, oldStatus: string, newStatus: string) => void;
}

/**
 * Custom hook for managing property dashboard WebSocket connection and real-time updates
 *
 * Features:
 * - Establishes WebSocket connection on mount
 * - Listens for KPI and property update events
 * - Implements fallback to polling after 3 failed reconnection attempts
 * - Auto-reconnection with exponential backoff (1s, 2s, 4s)
 * - Cleans up connection on unmount
 * - Provides connection status
 *
 * @param userId - User ID for the landlord
 * @param enabled - Whether to enable WebSocket connection
 * @param events - Event handlers for property updates
 * @returns Object with connection status and refresh function
 */
export const usePropertyDashboardWebSocket = (
  userId: string | undefined,
  enabled: boolean,
  events: PropertyDashboardEvents
) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectDelays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
  const hasInitializedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle WebSocket connection failure
   * Falls back to polling after max reconnection attempts
   */
  const handleConnectionFailed = useCallback(() => {
    console.log('WebSocket connection failed after max attempts, falling back to polling');
    setConnectionStatus('polling');

    // Start polling for KPI data
    startPropertyPolling((kpis) => {
      if (events.onKPIUpdate) {
        events.onKPIUpdate(kpis);
      }
    });
  }, [events]);

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
        console.log('WebSocket connected to property dashboard namespace');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // If we were polling, stop polling since WebSocket is working
        if (connectionStatus === 'polling') {
          stopPropertyPolling();
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

      // Authentication error
      socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        if (error?.message?.includes('authentication')) {
          console.error('WebSocket authentication failed');
          setConnectionStatus('disconnected');
          handleConnectionFailed();
        }
      });

      // Event listeners for property dashboard events

      // 1. KPI Update Event
      socket.on('kpi:update', (kpis: PropertyKPIData) => {
        console.log('Received KPI update:', kpis);
        if (events.onKPIUpdate) {
          events.onKPIUpdate(kpis);
        }
      });

      // 2. Property Created Event
      socket.on('property:created', (property: PropertyListing) => {
        console.log('Received property created event:', property);
        if (events.onPropertyCreated) {
          events.onPropertyCreated(property);
        }
      });

      // 3. Property Updated Event
      socket.on('property:updated', (data: { propertyId: string; property: PropertyListing }) => {
        console.log('Received property updated event:', data);
        if (events.onPropertyUpdated) {
          events.onPropertyUpdated(data.propertyId, data.property);
        }
      });

      // 4. Property Deleted Event
      socket.on('property:deleted', (data: { propertyId: string }) => {
        console.log('Received property deleted event:', data);
        if (events.onPropertyDeleted) {
          events.onPropertyDeleted(data.propertyId);
        }
      });

      // 5. Property Status Changed Event
      socket.on(
        'property:status-changed',
        (data: { propertyId: string; oldStatus: string; newStatus: string }) => {
          console.log('Received property status changed event:', data);
          if (events.onStatusChanged) {
            events.onStatusChanged(data.propertyId, data.oldStatus, data.newStatus);
          }
        }
      );
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
      handleReconnect();
    }
  }, [userId, enabled, connectionStatus, events, handleConnectionFailed, handleReconnect]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    hasInitializedRef.current = false;

    // Stop polling if active
    if (connectionStatus === 'polling') {
      stopPropertyPolling();
    }

    setConnectionStatus('disconnected');
  }, [connectionStatus]);

  /**
   * Refresh function to manually trigger reconnection
   */
  const refresh = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connectWebSocket();
    }, 100);
  }, [disconnect, connectWebSocket]);

  /**
   * Set up WebSocket connection on mount
   */
  useEffect(() => {
    if (enabled && userId) {
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, userId, connectWebSocket, disconnect]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isPolling: connectionStatus === 'polling',
    isReconnecting: connectionStatus === 'reconnecting',
    refresh,
  };
};
