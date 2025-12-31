import { renderHook, act, waitFor } from '@testing-library/react';
import { usePropertyDashboardWebSocket } from '../../hooks/usePropertyDashboardWebSocket';
import { startPropertyPolling, stopPropertyPolling } from '../../services/propertyPollingService';
import { io, Socket } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock polling service
jest.mock('../../services/propertyPollingService', () => ({
  startPropertyPolling: jest.fn(),
  stopPropertyPolling: jest.fn(),
}));

describe('usePropertyDashboardWebSocket', () => {
  let mockSocket: Partial<Socket>;
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock socket
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };

    (io as jest.Mock).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('WebSocket connection establishment', () => {
    it('should connect to WebSocket when enabled', () => {
      const events = {
        onKPIUpdate: jest.fn(),
      };

      renderHook(() => usePropertyDashboardWebSocket(mockUserId, true, events));

      expect(io).toHaveBeenCalledWith(
        '/dashboard',
        expect.objectContaining({
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnection: false,
          timeout: 10000,
        })
      );
    });

    it('should not connect when disabled', () => {
      const events = {
        onKPIUpdate: jest.fn(),
      };

      renderHook(() => usePropertyDashboardWebSocket(mockUserId, false, events));

      expect(io).not.toHaveBeenCalled();
    });

    it('should not connect when userId is undefined', () => {
      const events = {
        onKPIUpdate: jest.fn(),
      };

      renderHook(() => usePropertyDashboardWebSocket(undefined, true, events));

      expect(io).not.toHaveBeenCalled();
    });

    it('should update connection status to connected on successful connection', async () => {
      const events = {
        onKPIUpdate: jest.fn(),
      };

      const { result } = renderHook(() =>
        usePropertyDashboardWebSocket(mockUserId, true, events)
      );

      // Initially disconnected
      expect(result.current.connectionStatus).toBe('disconnected');

      // Simulate successful connection
      const connectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'connect'
      )?.[1];

      act(() => {
        connectHandler?.();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
        expect(result.current.isConnected).toBe(true);
      });
    });
  });

  describe('Event listener registration', () => {
    it('should register all 5 event types', () => {
      const events = {
        onKPIUpdate: jest.fn(),
        onPropertyCreated: jest.fn(),
        onPropertyUpdated: jest.fn(),
        onPropertyDeleted: jest.fn(),
        onStatusChanged: jest.fn(),
      };

      renderHook(() => usePropertyDashboardWebSocket(mockUserId, true, events));

      const registeredEvents = (mockSocket.on as jest.Mock).mock.calls.map(([event]) => event);

      expect(registeredEvents).toContain('kpi:update');
      expect(registeredEvents).toContain('property:created');
      expect(registeredEvents).toContain('property:updated');
      expect(registeredEvents).toContain('property:deleted');
      expect(registeredEvents).toContain('property:status-changed');
    });

    it('should call onKPIUpdate when kpi:update event is received', () => {
      const mockKPIs = {
        totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
        activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
        avgDaysOnMarket: { value: 30, trend: { value: -5, direction: 'down' as const, period: 'vs last week' } },
        responseRate: { value: 75, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
      };

      const events = {
        onKPIUpdate: jest.fn(),
      };

      renderHook(() => usePropertyDashboardWebSocket(mockUserId, true, events));

      // Find and trigger kpi:update handler
      const kpiHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'kpi:update'
      )?.[1];

      act(() => {
        kpiHandler?.(mockKPIs);
      });

      expect(events.onKPIUpdate).toHaveBeenCalledWith(mockKPIs);
    });

    it('should call onPropertyCreated when property:created event is received', () => {
      const mockProperty = {
        id: 'prop-1',
        title: 'Test Property',
        status: 'active',
      };

      const events = {
        onPropertyCreated: jest.fn(),
      };

      renderHook(() => usePropertyDashboardWebSocket(mockUserId, true, events));

      const handler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'property:created'
      )?.[1];

      act(() => {
        handler?.(mockProperty);
      });

      expect(events.onPropertyCreated).toHaveBeenCalledWith(mockProperty);
    });
  });

  describe('Auto-reconnection with exponential backoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should attempt reconnection with exponential backoff on disconnect', async () => {
      const events = {
        onKPIUpdate: jest.fn(),
      };

      const { result } = renderHook(() =>
        usePropertyDashboardWebSocket(mockUserId, true, events)
      );

      // Simulate disconnect
      const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'disconnect'
      )?.[1];

      act(() => {
        disconnectHandler?.('transport close');
      });

      expect(result.current.connectionStatus).toBe('disconnected');

      // Should update to reconnecting
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('reconnecting');
      });

      // First reconnect attempt (1 second delay)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockSocket.connect).toHaveBeenCalledTimes(1);

      // Simulate another disconnect
      act(() => {
        disconnectHandler?.('transport close');
      });

      // Second reconnect attempt (2 second delay)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockSocket.connect).toHaveBeenCalledTimes(2);

      // Third reconnect attempt (4 second delay)
      act(() => {
        disconnectHandler?.('transport close');
      });

      act(() => {
        jest.advanceTimersByTime(4000);
      });

      expect(mockSocket.connect).toHaveBeenCalledTimes(3);
    });

    it('should limit reconnection attempts to 3', async () => {
      const events = {
        onKPIUpdate: jest.fn(),
      };

      renderHook(() => usePropertyDashboardWebSocket(mockUserId, true, events));

      const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'disconnect'
      )?.[1];

      // Simulate 4 disconnects
      for (let i = 0; i < 4; i++) {
        act(() => {
          disconnectHandler?.('transport close');
        });

        act(() => {
          jest.advanceTimersByTime(5000);
        });
      }

      // Should only have 3 connect attempts (max)
      expect(mockSocket.connect).toHaveBeenCalledTimes(3);
    });
  });

  describe('Fallback to polling after failed reconnects', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start polling after 3 failed reconnection attempts', async () => {
      const mockKPIs = {
        totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
        activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
        avgDaysOnMarket: { value: 30, trend: { value: -5, direction: 'down' as const, period: 'vs last week' } },
        responseRate: { value: 75, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
      };

      const events = {
        onKPIUpdate: jest.fn(),
      };

      const { result } = renderHook(() =>
        usePropertyDashboardWebSocket(mockUserId, true, events)
      );

      const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'disconnect'
      )?.[1];

      // Simulate 4 disconnects (exceeding max attempts)
      for (let i = 0; i < 4; i++) {
        act(() => {
          disconnectHandler?.('transport close');
        });

        act(() => {
          jest.advanceTimersByTime(5000);
        });
      }

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('polling');
        expect(result.current.isPolling).toBe(true);
      });

      expect(startPropertyPolling).toHaveBeenCalled();

      // Verify polling callback works
      const pollingCallback = (startPropertyPolling as jest.Mock).mock.calls[0][0];
      pollingCallback(mockKPIs);

      expect(events.onKPIUpdate).toHaveBeenCalledWith(mockKPIs);
    });

    it('should stop polling when WebSocket reconnects successfully', async () => {
      const events = {
        onKPIUpdate: jest.fn(),
      };

      const { result } = renderHook(() =>
        usePropertyDashboardWebSocket(mockUserId, true, events)
      );

      const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'disconnect'
      )?.[1];

      // Simulate disconnects to trigger polling
      for (let i = 0; i < 4; i++) {
        act(() => {
          disconnectHandler?.('transport close');
        });

        act(() => {
          jest.advanceTimersByTime(5000);
        });
      }

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('polling');
      });

      // Simulate successful reconnection
      const connectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'connect'
      )?.[1];

      act(() => {
        connectHandler?.();
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
      });

      expect(stopPropertyPolling).toHaveBeenCalled();
    });
  });

  describe('Cleanup on unmount', () => {
    it('should disconnect WebSocket and stop polling on unmount', () => {
      const events = {
        onKPIUpdate: jest.fn(),
      };

      const { unmount } = renderHook(() =>
        usePropertyDashboardWebSocket(mockUserId, true, events)
      );

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});
