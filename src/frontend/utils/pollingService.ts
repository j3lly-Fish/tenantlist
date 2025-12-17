import { getDashboardData } from './apiClient';
import { DashboardData } from '@types';

/**
 * Polling Service for Dashboard Data
 *
 * Fallback mechanism when WebSocket connection fails
 * - Polls GET /api/dashboard/tenant every 30 seconds
 * - Starts when WebSocket fails after 3 reconnection attempts
 * - Stops when WebSocket reconnects successfully
 */
class PollingService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private pollingIntervalMs = 30000; // 30 seconds
  private onDataCallback: ((data: DashboardData) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  /**
   * Start polling for dashboard data
   * @param onData - Callback when data is received
   * @param onError - Callback when polling fails
   */
  startPolling(
    onData: (data: DashboardData) => void,
    onError?: (error: Error) => void
  ): void {
    if (this.isPolling) {
      console.log('Polling already active');
      return;
    }

    console.log('Starting polling fallback (30s interval)');
    this.isPolling = true;
    this.onDataCallback = onData;
    this.onErrorCallback = onError || null;

    // Perform initial poll immediately
    this.poll();

    // Set up interval for subsequent polls
    this.pollingInterval = setInterval(() => {
      this.poll();
    }, this.pollingIntervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (!this.isPolling) {
      return;
    }

    console.log('Stopping polling fallback');
    this.isPolling = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.onDataCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * Perform a single poll
   */
  private async poll(): Promise<void> {
    try {
      const data = await getDashboardData();

      if (this.onDataCallback) {
        this.onDataCallback(data);
      }
    } catch (error) {
      console.error('Polling error:', error);

      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }

      // If error is 401 (unauthorized), stop polling
      // User needs to re-authenticate
      if ((error as any)?.status === 401) {
        console.log('Authentication failed, stopping polling');
        this.stopPolling();
      }
    }
  }

  /**
   * Check if currently polling
   */
  isActive(): boolean {
    return this.isPolling;
  }

  /**
   * Update polling interval
   * @param intervalMs - New interval in milliseconds
   */
  setPollingInterval(intervalMs: number): void {
    this.pollingIntervalMs = intervalMs;

    // If currently polling, restart with new interval
    if (this.isPolling && this.onDataCallback) {
      const onData = this.onDataCallback;
      const onError = this.onErrorCallback || undefined;
      this.stopPolling();
      this.startPolling(onData, onError);
    }
  }
}

// Export singleton instance
const pollingService = new PollingService();

// Export convenience functions
export const startPolling = (
  onData: (data: DashboardData) => void,
  onError?: (error: Error) => void
): void => {
  pollingService.startPolling(onData, onError);
};

export const stopPolling = (): void => {
  pollingService.stopPolling();
};

export { pollingService };
export default pollingService;
