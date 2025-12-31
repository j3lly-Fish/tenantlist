import { BrokerDashboardEventService } from '../../services/BrokerDashboardEventService';
import { BrokerKPIService, BrokerKPIData } from '../../services/BrokerKPIService';
import { getDashboardSocket } from '../../websocket/dashboardSocket';

// Mock getDashboardSocket
jest.mock('../../websocket/dashboardSocket', () => ({
  getDashboardSocket: jest.fn(),
}));

describe('BrokerDashboardEventService', () => {
  let eventService: BrokerDashboardEventService;
  let mockSocketServer: any;
  let mockKPIService: jest.Mocked<BrokerKPIService>;

  const mockUserId = 'broker-user-123';
  const mockBrokerDeal = {
    id: 'deal-123',
    broker_user_id: mockUserId,
    tenant_business_id: 'tenant-456',
    property_id: 'property-789',
    status: 'touring',
    estimated_commission: 5000.0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockKPIs: BrokerKPIData = {
    activeDeals: { value: 8, trend: { value: 20.0, direction: 'up', period: 'vs last week' } },
    commissionPipeline: { value: 45000.0, trend: { value: 15.5, direction: 'up', period: 'vs last week' } },
    responseRate: { value: 85, trend: { value: 5.0, direction: 'up', period: 'vs last week' } },
    propertiesMatched: { value: 12, trend: { value: 10.0, direction: 'up', period: 'vs last week' } },
  };

  beforeEach(() => {
    // Mock socket server
    mockSocketServer = {
      isUserConnected: jest.fn().mockResolvedValue(true),
      emitBrokerDealCreated: jest.fn(),
      emitBrokerDealUpdated: jest.fn(),
      emitKPIUpdate: jest.fn(),
    };

    (getDashboardSocket as jest.Mock).mockReturnValue(mockSocketServer);

    // Mock KPI service
    mockKPIService = {
      invalidateCache: jest.fn().mockResolvedValue(undefined),
      getKPIs: jest.fn().mockResolvedValue(mockKPIs),
    } as any;

    eventService = new BrokerDashboardEventService(mockKPIService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onDealCreated', () => {
    it('should emit deal-created event and invalidate cache when user is connected', async () => {
      await eventService.onDealCreated(mockUserId, mockBrokerDeal);

      // Should invalidate cache
      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);

      // Should check if user is connected
      expect(mockSocketServer.isUserConnected).toHaveBeenCalledWith(mockUserId);

      // Should fetch fresh KPIs
      expect(mockKPIService.getKPIs).toHaveBeenCalledWith(mockUserId);

      // Should emit both events
      expect(mockSocketServer.emitBrokerDealCreated).toHaveBeenCalledWith(mockUserId, mockBrokerDeal);
      expect(mockSocketServer.emitKPIUpdate).toHaveBeenCalledWith(mockUserId, mockKPIs);
    });

    it('should not emit events when user is not connected', async () => {
      mockSocketServer.isUserConnected.mockResolvedValue(false);

      await eventService.onDealCreated(mockUserId, mockBrokerDeal);

      // Should still invalidate cache
      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);

      // Should NOT emit events
      expect(mockSocketServer.emitBrokerDealCreated).not.toHaveBeenCalled();
      expect(mockSocketServer.emitKPIUpdate).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully when WebSocket server not initialized', async () => {
      (getDashboardSocket as jest.Mock).mockReturnValue(null);

      // Should not throw
      await expect(eventService.onDealCreated(mockUserId, mockBrokerDeal)).resolves.not.toThrow();

      // Should still invalidate cache
      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('onDealUpdated', () => {
    it('should emit deal-updated event and invalidate cache when user is connected', async () => {
      await eventService.onDealUpdated(mockUserId, mockBrokerDeal);

      // Should invalidate cache
      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);

      // Should check if user is connected
      expect(mockSocketServer.isUserConnected).toHaveBeenCalledWith(mockUserId);

      // Should fetch fresh KPIs
      expect(mockKPIService.getKPIs).toHaveBeenCalledWith(mockUserId);

      // Should emit both events
      expect(mockSocketServer.emitBrokerDealUpdated).toHaveBeenCalledWith(mockUserId, mockBrokerDeal);
      expect(mockSocketServer.emitKPIUpdate).toHaveBeenCalledWith(mockUserId, mockKPIs);
    });

    it('should not emit events when user is not connected', async () => {
      mockSocketServer.isUserConnected.mockResolvedValue(false);

      await eventService.onDealUpdated(mockUserId, mockBrokerDeal);

      // Should still invalidate cache
      expect(mockKPIService.invalidateCache).toHaveBeenCalledWith(mockUserId);

      // Should NOT emit events
      expect(mockSocketServer.emitBrokerDealUpdated).not.toHaveBeenCalled();
      expect(mockSocketServer.emitKPIUpdate).not.toHaveBeenCalled();
    });
  });

  describe('triggerKPIUpdate', () => {
    it('should emit KPI update when user is connected', async () => {
      await eventService.triggerKPIUpdate(mockUserId);

      // Should check if user is connected
      expect(mockSocketServer.isUserConnected).toHaveBeenCalledWith(mockUserId);

      // Should fetch KPIs
      expect(mockKPIService.getKPIs).toHaveBeenCalledWith(mockUserId);

      // Should emit KPI update
      expect(mockSocketServer.emitKPIUpdate).toHaveBeenCalledWith(mockUserId, mockKPIs);
    });

    it('should not emit when user is not connected', async () => {
      mockSocketServer.isUserConnected.mockResolvedValue(false);

      await eventService.triggerKPIUpdate(mockUserId);

      // Should NOT emit
      expect(mockSocketServer.emitKPIUpdate).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully when KPI fetch fails', async () => {
      mockKPIService.getKPIs.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(eventService.triggerKPIUpdate(mockUserId)).resolves.not.toThrow();

      // Should NOT emit on error
      expect(mockSocketServer.emitKPIUpdate).not.toHaveBeenCalled();
    });
  });
});
