import { propertyPollingService, startPropertyPolling, stopPropertyPolling } from '../../services/propertyPollingService';
import { getLandlordKPIs } from '@utils/apiClient';

// Mock API client
jest.mock('@utils/apiClient', () => ({
  getLandlordKPIs: jest.fn(),
}));

describe('PropertyPollingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    stopPropertyPolling(); // Ensure clean state
  });

  afterEach(() => {
    stopPropertyPolling();
    jest.useRealTimers();
  });

  describe('startPolling', () => {
    it('should start polling and immediately fetch data', async () => {
      const mockKPIs = {
        totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
        activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
        avgDaysOnMarket: { value: 30, trend: { value: -5, direction: 'down' as const, period: 'vs last week' } },
        responseRate: { value: 75, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
      };

      (getLandlordKPIs as jest.Mock).mockResolvedValue(mockKPIs);

      const onData = jest.fn();
      const onError = jest.fn();

      startPropertyPolling(onData, onError);

      // Wait for initial poll promise
      await Promise.resolve();

      expect(getLandlordKPIs).toHaveBeenCalledTimes(1);
      expect(onData).toHaveBeenCalledWith(mockKPIs);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should poll at 30 second intervals', async () => {
      const mockKPIs = {
        totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
        activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
        avgDaysOnMarket: { value: 30, trend: { value: -5, direction: 'down' as const, period: 'vs last week' } },
        responseRate: { value: 75, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
      };

      (getLandlordKPIs as jest.Mock).mockResolvedValue(mockKPIs);

      const onData = jest.fn();

      startPropertyPolling(onData);

      // Initial poll
      await Promise.resolve();
      expect(getLandlordKPIs).toHaveBeenCalledTimes(1);

      // After 30 seconds
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
      expect(getLandlordKPIs).toHaveBeenCalledTimes(2);

      // After another 30 seconds
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
      expect(getLandlordKPIs).toHaveBeenCalledTimes(3);
    });

    it('should not start polling if already active', async () => {
      const mockKPIs = {
        totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
        activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
        avgDaysOnMarket: { value: 30, trend: { value: -5, direction: 'down' as const, period: 'vs last week' } },
        responseRate: { value: 75, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
      };

      (getLandlordKPIs as jest.Mock).mockResolvedValue(mockKPIs);

      const onData1 = jest.fn();
      const onData2 = jest.fn();

      startPropertyPolling(onData1);
      startPropertyPolling(onData2);

      await Promise.resolve();

      // Should only call first callback
      expect(onData1).toHaveBeenCalledWith(mockKPIs);
      expect(onData2).not.toHaveBeenCalled();
    });
  });

  describe('stopPolling', () => {
    it('should stop polling and clear interval', async () => {
      const mockKPIs = {
        totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
        activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
        avgDaysOnMarket: { value: 30, trend: { value: -5, direction: 'down' as const, period: 'vs last week' } },
        responseRate: { value: 75, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
      };

      (getLandlordKPIs as jest.Mock).mockResolvedValue(mockKPIs);

      const onData = jest.fn();

      startPropertyPolling(onData);
      await Promise.resolve();

      expect(getLandlordKPIs).toHaveBeenCalledTimes(1);

      stopPropertyPolling();

      // Advance time - should not poll anymore
      jest.advanceTimersByTime(60000);
      await Promise.resolve();

      expect(getLandlordKPIs).toHaveBeenCalledTimes(1); // Still just 1
    });

    it('should handle stopping when not active', () => {
      // Should not throw error
      expect(() => stopPropertyPolling()).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should call onError callback on API failure', async () => {
      const error = new Error('API Error');
      (getLandlordKPIs as jest.Mock).mockRejectedValue(error);

      const onData = jest.fn();
      const onError = jest.fn();

      startPropertyPolling(onData, onError);

      await Promise.resolve();

      expect(onData).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should stop polling on 401 authentication error', async () => {
      const error = { status: 401, message: 'Unauthorized' };
      (getLandlordKPIs as jest.Mock).mockRejectedValue(error);

      const onData = jest.fn();
      const onError = jest.fn();

      startPropertyPolling(onData, onError);

      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(error);

      // Should stop polling
      expect(propertyPollingService.isActive()).toBe(false);

      // Advance time - should not poll again
      (getLandlordKPIs as jest.Mock).mockClear();
      jest.advanceTimersByTime(60000);
      await Promise.resolve();

      expect(getLandlordKPIs).not.toHaveBeenCalled();
    });

    it('should continue polling on non-401 errors', async () => {
      const error = new Error('Network Error');
      (getLandlordKPIs as jest.Mock).mockRejectedValueOnce(error);

      const mockKPIs = {
        totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
        activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
        avgDaysOnMarket: { value: 30, trend: { value: -5, direction: 'down' as const, period: 'vs last week' } },
        responseRate: { value: 75, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
      };

      (getLandlordKPIs as jest.Mock).mockResolvedValue(mockKPIs);

      const onData = jest.fn();
      const onError = jest.fn();

      startPropertyPolling(onData, onError);

      // Initial poll fails
      await Promise.resolve();
      expect(onError).toHaveBeenCalledWith(error);

      // Next poll succeeds
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
      expect(onData).toHaveBeenCalledWith(mockKPIs);
    });
  });

  describe('isActive', () => {
    it('should return true when polling is active', () => {
      const mockKPIs = {
        totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
        activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
        avgDaysOnMarket: { value: 30, trend: { value: -5, direction: 'down' as const, period: 'vs last week' } },
        responseRate: { value: 75, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
      };

      (getLandlordKPIs as jest.Mock).mockResolvedValue(mockKPIs);

      expect(propertyPollingService.isActive()).toBe(false);

      startPropertyPolling(jest.fn());

      expect(propertyPollingService.isActive()).toBe(true);

      stopPropertyPolling();

      expect(propertyPollingService.isActive()).toBe(false);
    });
  });

  describe('setPollingInterval', () => {
    it('should update polling interval and restart if active', async () => {
      const mockKPIs = {
        totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
        activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
        avgDaysOnMarket: { value: 30, trend: { value: -5, direction: 'down' as const, period: 'vs last week' } },
        responseRate: { value: 75, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
      };

      (getLandlordKPIs as jest.Mock).mockResolvedValue(mockKPIs);

      const onData = jest.fn();

      startPropertyPolling(onData);
      await Promise.resolve();

      expect(getLandlordKPIs).toHaveBeenCalledTimes(1);

      // Change interval to 10 seconds (will restart, causing immediate poll)
      propertyPollingService.setPollingInterval(10000);
      await Promise.resolve();

      // Count is now 2 (1 initial + 1 from restart)
      expect(getLandlordKPIs).toHaveBeenCalledTimes(2);

      // Should poll after 10 seconds now
      jest.advanceTimersByTime(10000);
      await Promise.resolve();

      // Total count should be 3
      expect(getLandlordKPIs).toHaveBeenCalledTimes(3);
    });
  });
});
