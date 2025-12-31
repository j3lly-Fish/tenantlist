import { PropertyDashboardEventService } from '../../services/PropertyDashboardEventService';
import { PropertyKPIService } from '../../services/PropertyKPIService';
import { getDashboardSocket } from '../../websocket/dashboardSocket';
import { PropertyListing } from '../../types';

// Mock the dependencies
jest.mock('../../websocket/dashboardSocket');
jest.mock('../../services/PropertyKPIService');

describe('PropertyDashboardEventService', () => {
  let eventService: PropertyDashboardEventService;
  let mockKPIService: jest.Mocked<PropertyKPIService>;
  let mockSocketServer: any;

  const mockUserId = 'user-123';
  const mockPropertyId = 'property-456';
  const mockProperty: Partial<PropertyListing> = {
    id: mockPropertyId,
    user_id: mockUserId,
    title: 'Test Property',
    status: 'active' as any,
    city: 'New York',
    state: 'NY',
  };

  const mockKPIs = {
    totalListings: { value: 10, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
    activeListings: { value: 8, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
    avgDaysOnMarket: { value: 30, trend: { value: 5, direction: 'down' as const, period: 'vs last week' } },
    responseRate: { value: 15.5, trend: { value: 1.2, direction: 'up' as const, period: 'vs last week' } },
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock socket server
    mockSocketServer = {
      isUserConnected: jest.fn().mockResolvedValue(true),
      emitPropertyCreated: jest.fn(),
      emitPropertyUpdated: jest.fn(),
      emitPropertyDeleted: jest.fn(),
      emitStatusChanged: jest.fn(),
      emitKPIUpdate: jest.fn(),
    };

    // Mock getDashboardSocket to return mock server
    (getDashboardSocket as jest.Mock).mockReturnValue(mockSocketServer);

    // Create mock KPI service
    mockKPIService = {
      invalidateCache: jest.fn().mockResolvedValue(undefined),
      getKPIs: jest.fn().mockResolvedValue(mockKPIs),
    } as any;

    // Create event service with mock KPI service
    eventService = new PropertyDashboardEventService(mockKPIService);
  });

  describe('onPropertyCreated', () => {
    it('should emit property-created event and invalidate cache', async () => {
      await eventService.onPropertyCreated(mockUserId, mockProperty as PropertyListing);

      // Should invalidate cache
      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);

      // Should check if user is connected
      expect(mockSocketServer.isUserConnected).toHaveBeenCalledWith(mockUserId);

      // Should recalculate KPIs
      expect(mockKPIService.getKPIs).toHaveBeenCalledWith(mockUserId);

      // Should emit property created event
      expect(mockSocketServer.emitPropertyCreated).toHaveBeenCalledWith(mockUserId, mockProperty);

      // Should emit KPI update
      expect(mockSocketServer.emitKPIUpdate).toHaveBeenCalledWith(mockUserId, mockKPIs);
    });

    it('should not emit events if user is not connected', async () => {
      mockSocketServer.isUserConnected.mockResolvedValue(false);

      await eventService.onPropertyCreated(mockUserId, mockProperty as PropertyListing);

      // Should still invalidate cache
      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);

      // Should not emit events
      expect(mockSocketServer.emitPropertyCreated).not.toHaveBeenCalled();
      expect(mockSocketServer.emitKPIUpdate).not.toHaveBeenCalled();
    });
  });

  describe('onPropertyUpdated', () => {
    it('should emit property-updated event and invalidate cache', async () => {
      await eventService.onPropertyUpdated(mockUserId, mockPropertyId, mockProperty as PropertyListing);

      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);
      expect(mockSocketServer.emitPropertyUpdated).toHaveBeenCalledWith(mockUserId, mockPropertyId, mockProperty);
      expect(mockSocketServer.emitKPIUpdate).toHaveBeenCalledWith(mockUserId, mockKPIs);
    });
  });

  describe('onPropertyDeleted', () => {
    it('should emit property-deleted event and invalidate cache', async () => {
      await eventService.onPropertyDeleted(mockUserId, mockPropertyId);

      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);
      expect(mockSocketServer.emitPropertyDeleted).toHaveBeenCalledWith(mockUserId, mockPropertyId);
      expect(mockSocketServer.emitKPIUpdate).toHaveBeenCalledWith(mockUserId, mockKPIs);
    });
  });

  describe('onStatusChanged', () => {
    it('should emit status-changed event and invalidate cache', async () => {
      const oldStatus = 'active';
      const newStatus = 'leased';

      await eventService.onStatusChanged(mockUserId, mockPropertyId, oldStatus, newStatus);

      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);
      expect(mockSocketServer.emitStatusChanged).toHaveBeenCalledWith(
        mockUserId,
        mockPropertyId,
        oldStatus,
        newStatus
      );
      expect(mockSocketServer.emitKPIUpdate).toHaveBeenCalledWith(mockUserId, mockKPIs);
    });
  });

  describe('triggerKPIUpdate', () => {
    it('should recalculate and emit KPI update', async () => {
      await eventService.triggerKPIUpdate(mockUserId);

      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);
      expect(mockKPIService.getKPIs).toHaveBeenCalledWith(mockUserId);
      expect(mockSocketServer.emitKPIUpdate).toHaveBeenCalledWith(mockUserId, mockKPIs);
    });
  });

  describe('error handling', () => {
    it('should handle WebSocket server not initialized', async () => {
      (getDashboardSocket as jest.Mock).mockReturnValue(null);

      // Should not throw error
      await expect(
        eventService.onPropertyCreated(mockUserId, mockProperty as PropertyListing)
      ).resolves.not.toThrow();

      // Should still invalidate cache
      expect(mockKPIService.invalidateCache).toHaveBeenCalled();
    });

    it('should handle cache invalidation errors gracefully', async () => {
      mockKPIService.invalidateCache.mockRejectedValue(new Error('Redis error'));

      // Should not throw error, but log it
      await expect(
        eventService.onPropertyCreated(mockUserId, mockProperty as PropertyListing)
      ).resolves.not.toThrow();
    });
  });
});
