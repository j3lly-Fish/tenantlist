import { io, Socket } from 'socket.io-client';
import { DashboardKPIs, Business } from '@types';

/**
 * WebSocket event types
 */
export type KPIUpdateEvent = DashboardKPIs;
export type BusinessUpdateEvent = Business;
export type BusinessCreatedEvent = Business;
export type BusinessDeletedEvent = { businessId: string };

/**
 * WebSocket Client for Dashboard Real-time Updates
 *
 * Features:
 * - Connects to /dashboard namespace with JWT authentication
 * - Handles disconnection and reconnection with exponential backoff
 * - Provides typed event listeners for KPI and business updates
 */
class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelays = [1000, 2000, 4000, 8000]; // Exponential backoff: 1s, 2s, 4s, 8s
  private maxReconnectDelay = 30000; // Maximum 30 seconds
  private isConnecting = false;
  private eventHandlers: Map<string, Function[]> = new Map();

  /**
   * Connect to dashboard WebSocket namespace
   * @param onConnectionFailed - Callback when connection fails after max attempts
   */
  connectToDashboard(onConnectionFailed?: () => void): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    // Empty string means connect to same origin (works with nginx proxy in Docker)
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL ?? '';

    try {
      // Create socket connection to /dashboard namespace
      this.socket = io(`${wsBaseUrl}/dashboard`, {
        withCredentials: true, // Include httpOnly cookies for JWT authentication
        transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
        reconnection: false, // Manual reconnection with exponential backoff
        timeout: 10000, // 10 second connection timeout
      });

      // Connection successful
      this.socket.on('connect', () => {
        console.log('WebSocket connected to dashboard namespace');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      });

      // Connection error
      this.socket.on('connect_error', (error: Error) => {
        console.error('WebSocket connection error:', error.message);
        this.isConnecting = false;
        this.handleReconnect(onConnectionFailed);
      });

      // Disconnection
      this.socket.on('disconnect', (reason: string) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnecting = false;

        // Only attempt reconnection for unexpected disconnections
        if (reason !== 'io client disconnect') {
          this.handleReconnect(onConnectionFailed);
        }
      });

      // Authentication error
      this.socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        if (error?.message?.includes('authentication')) {
          console.error('WebSocket authentication failed');
          this.disconnect();
          if (onConnectionFailed) {
            onConnectionFailed();
          }
        }
      });

      // Re-attach event handlers after reconnection
      this.reattachEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.handleReconnect(onConnectionFailed);
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(onConnectionFailed?: () => void): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      if (onConnectionFailed) {
        onConnectionFailed();
      }
      return;
    }

    // Calculate delay with exponential backoff
    const delayIndex = Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1);
    const delay = Math.min(this.reconnectDelays[delayIndex], this.maxReconnectDelay);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connectToDashboard(onConnectionFailed);
    }, delay);
  }

  /**
   * Reattach event handlers after reconnection
   */
  private reattachEventHandlers(): void {
    if (!this.socket) return;

    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.on(event, handler as any);
      });
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.eventHandlers.clear();
  }

  /**
   * Listen for KPI updates
   */
  onKPIUpdate(callback: (kpis: KPIUpdateEvent) => void): () => void {
    if (!this.socket) {
      console.warn('Socket not connected. Call connectToDashboard first.');
      return () => {};
    }

    const handler = (data: KPIUpdateEvent) => {
      callback(data);
    };

    this.socket.on('kpi:update', handler);

    // Store handler for reattachment after reconnection
    if (!this.eventHandlers.has('kpi:update')) {
      this.eventHandlers.set('kpi:update', []);
    }
    this.eventHandlers.get('kpi:update')?.push(handler);

    // Return cleanup function
    return () => {
      this.socket?.off('kpi:update', handler);
      const handlers = this.eventHandlers.get('kpi:update');
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Listen for business created events
   */
  onBusinessCreated(callback: (business: BusinessCreatedEvent) => void): () => void {
    if (!this.socket) {
      console.warn('Socket not connected. Call connectToDashboard first.');
      return () => {};
    }

    const handler = (data: BusinessCreatedEvent) => {
      callback(data);
    };

    this.socket.on('business:created', handler);

    // Store handler
    if (!this.eventHandlers.has('business:created')) {
      this.eventHandlers.set('business:created', []);
    }
    this.eventHandlers.get('business:created')?.push(handler);

    return () => {
      this.socket?.off('business:created', handler);
      const handlers = this.eventHandlers.get('business:created');
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Listen for business updated events
   */
  onBusinessUpdate(callback: (business: BusinessUpdateEvent) => void): () => void {
    if (!this.socket) {
      console.warn('Socket not connected. Call connectToDashboard first.');
      return () => {};
    }

    const handler = (data: BusinessUpdateEvent) => {
      callback(data);
    };

    this.socket.on('business:updated', handler);

    // Store handler
    if (!this.eventHandlers.has('business:updated')) {
      this.eventHandlers.set('business:updated', []);
    }
    this.eventHandlers.get('business:updated')?.push(handler);

    return () => {
      this.socket?.off('business:updated', handler);
      const handlers = this.eventHandlers.get('business:updated');
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Listen for business deleted events
   */
  onBusinessDeleted(callback: (data: BusinessDeletedEvent) => void): () => void {
    if (!this.socket) {
      console.warn('Socket not connected. Call connectToDashboard first.');
      return () => {};
    }

    const handler = (data: BusinessDeletedEvent) => {
      callback(data);
    };

    this.socket.on('business:deleted', handler);

    // Store handler
    if (!this.eventHandlers.has('business:deleted')) {
      this.eventHandlers.set('business:deleted', []);
    }
    this.eventHandlers.get('business:deleted')?.push(handler);

    return () => {
      this.socket?.off('business:deleted', handler);
      const handlers = this.eventHandlers.get('business:deleted');
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current reconnection attempt count
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();

export default websocketClient;
