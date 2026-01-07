import { renderHook, act, waitFor } from '@testing-library/react';
import { useBrokerDashboardWebSocket } from '@hooks/useBrokerDashboardWebSocket';
import { io } from 'socket.io-client';
import * as apiClient from '@utils/apiClient';
import * as env from '@utils/env';

// Mock dependencies
jest.mock('socket.io-client');
jest.mock('@utils/apiClient');
jest.mock('@utils/env');

describe('useBrokerDashboardWebSocket', () => {
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock getEnv
    (env.getEnv as jest.Mock).mockReturnValue({
      VITE_WS_BASE_URL: 'http://localhost:4000',
    });

    // Mock socket
    mockSocket = {
      on: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };

    (io as jest.Mock).mockReturnValue(mockSocket);

    // Mock getBrokerKPIs for polling
    (apiClient.getBrokerKPIs as jest.Mock).mockResolvedValue({
      activeDeals: { value: 5, trend: { direction: 'up', percentage: 10 } },
      commissionPipeline: { value: 50000 },
      responseRate: { value: 85 },
      propertiesMatched: { value: 12 },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('creates socket connection when enabled', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
      onDealCreated: jest.fn(),
      onDealUpdated: jest.fn(),
    };

    renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    expect(io).toHaveBeenCalledWith('http://localhost:4000/dashboard', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10000,
    });
  });

  it('does not create socket when disabled', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    renderHook(() =>
      useBrokerDashboardWebSocket('user123', false, mockEvents)
    );

    expect(io).not.toHaveBeenCalled();
  });

  it('does not create socket when userId is undefined', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    renderHook(() =>
      useBrokerDashboardWebSocket(undefined, true, mockEvents)
    );

    expect(io).not.toHaveBeenCalled();
  });

  it('sets connection status to connected on connect event', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    const { result } = renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )[1];

    act(() => {
      connectHandler();
    });

    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.isConnected).toBe(true);
  });

  it('handles disconnect event and attempts reconnection', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    const { result } = renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    // Simulate disconnect event
    const disconnectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'disconnect'
    )[1];

    act(() => {
      disconnectHandler('transport close');
    });

    expect(result.current.connectionStatus).toBe('disconnected');

    // Should set reconnecting status
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.connectionStatus).toBe('reconnecting');
  });

  it('calls onKPIUpdate when broker:kpi-update event is received', () => {
    const mockKPIs = {
      activeDeals: { value: 10 },
      commissionPipeline: { value: 100000 },
    };

    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    // Find and call the KPI update handler
    const kpiUpdateHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'broker:kpi-update'
    )[1];

    act(() => {
      kpiUpdateHandler(mockKPIs);
    });

    expect(mockEvents.onKPIUpdate).toHaveBeenCalledWith(mockKPIs);
  });

  it('calls onDealCreated when broker:deal-created event is received', () => {
    const mockDeal = {
      id: 'deal1',
      status: 'prospecting',
      estimated_commission: 5000,
    };

    const mockEvents = {
      onKPIUpdate: jest.fn(),
      onDealCreated: jest.fn(),
    };

    renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    const dealCreatedHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'broker:deal-created'
    )[1];

    act(() => {
      dealCreatedHandler(mockDeal);
    });

    expect(mockEvents.onDealCreated).toHaveBeenCalledWith(mockDeal);
  });

  it('calls onDealUpdated when broker:deal-updated event is received', () => {
    const mockUpdate = {
      dealId: 'deal1',
      deal: { status: 'signed', estimated_commission: 5000 },
    };

    const mockEvents = {
      onKPIUpdate: jest.fn(),
      onDealUpdated: jest.fn(),
    };

    renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    const dealUpdatedHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'broker:deal-updated'
    )[1];

    act(() => {
      dealUpdatedHandler(mockUpdate);
    });

    expect(mockEvents.onDealUpdated).toHaveBeenCalledWith('deal1', mockUpdate.deal);
  });

  it('implements exponential backoff for reconnection', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    // Simulate connection error
    const errorHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect_error'
    )[1];

    // First attempt - 1 second delay
    act(() => {
      errorHandler(new Error('Connection failed'));
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockSocket.connect).toHaveBeenCalledTimes(1);

    // Second attempt - 2 second delay
    act(() => {
      errorHandler(new Error('Connection failed'));
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockSocket.connect).toHaveBeenCalledTimes(2);

    // Third attempt - 4 second delay
    act(() => {
      errorHandler(new Error('Connection failed'));
    });

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(mockSocket.connect).toHaveBeenCalledTimes(3);
  });

  it('falls back to polling after max reconnection attempts', async () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    const { result } = renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    const errorHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect_error'
    )[1];

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      act(() => {
        errorHandler(new Error('Connection failed'));
      });
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    }

    // Should fall back to polling
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('polling');
      expect(result.current.isPolling).toBe(true);
    });
  });

  it('starts polling with 30 second interval', async () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    const errorHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect_error'
    )[1];

    // Trigger fallback to polling
    for (let i = 0; i < 3; i++) {
      act(() => {
        errorHandler(new Error('Connection failed'));
      });
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    }

    // Wait for polling to start
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(apiClient.getBrokerKPIs).toHaveBeenCalled();
    });
  });

  it('stops polling when WebSocket reconnects', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    const { result } = renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    // Start in polling mode
    act(() => {
      // Manually set to polling state
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect_error'
      )[1];

      for (let i = 0; i < 3; i++) {
        errorHandler(new Error('Connection failed'));
        jest.advanceTimersByTime(5000);
      }
    });

    // Reconnect WebSocket
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any) => call[0] === 'connect'
    )[1];

    act(() => {
      connectHandler();
    });

    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.isPolling).toBe(false);
  });

  it('cleans up on unmount', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    const { unmount } = renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('does not create duplicate connections', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    const { rerender } = renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    // Rerender multiple times
    rerender();
    rerender();
    rerender();

    // Should only call io once
    expect(io).toHaveBeenCalledTimes(1);
  });

  it('provides refresh function', () => {
    const mockEvents = {
      onKPIUpdate: jest.fn(),
    };

    const { result } = renderHook(() =>
      useBrokerDashboardWebSocket('user123', true, mockEvents)
    );

    expect(typeof result.current.refresh).toBe('function');
  });
});
