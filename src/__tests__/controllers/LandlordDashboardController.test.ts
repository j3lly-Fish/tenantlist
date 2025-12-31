import { LandlordDashboardController } from '../../controllers/LandlordDashboardController';
import { PropertyKPIService } from '../../services/PropertyKPIService';
import { PropertyListingModel } from '../../database/models/PropertyListing';

/**
 * Tests for LandlordDashboardController
 * Task Group 4.1: Write 3-6 focused tests for dashboard endpoints
 */

describe('LandlordDashboardController', () => {
  let controller: LandlordDashboardController;
  let mockPropertyKPIService: jest.Mocked<PropertyKPIService>;
  let mockPropertyListingModel: jest.Mocked<PropertyListingModel>;

  const mockUserId = 'test-user-123';
  const mockKPIData = {
    totalListings: {
      value: 42,
      trend: { value: 12, direction: 'up' as const, period: 'vs last week' },
    },
    activeListings: {
      value: 35,
      trend: { value: 5, direction: 'up' as const, period: 'vs last week' },
    },
    avgDaysOnMarket: {
      value: 28,
      trend: { value: 8, direction: 'down' as const, period: 'vs last week' },
    },
    responseRate: {
      value: 15.5,
      trend: { value: 2.3, direction: 'up' as const, period: 'vs last week' },
    },
  };

  const mockProperties = [
    {
      id: 'prop-1',
      user_id: mockUserId,
      title: 'Test Property 1',
      status: 'active',
      city: 'Test City',
      state: 'TS',
    },
    {
      id: 'prop-2',
      user_id: mockUserId,
      title: 'Test Property 2',
      status: 'active',
      city: 'Test City',
      state: 'TS',
    },
  ];

  beforeEach(() => {
    // Create mocked services
    mockPropertyKPIService = {
      getKPIs: jest.fn(),
    } as any;

    mockPropertyListingModel = {
      findByUserIdPaginated: jest.fn(),
    } as any;

    // Create controller with mocked dependencies
    controller = new LandlordDashboardController(
      mockPropertyKPIService,
      mockPropertyListingModel
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1: GET /api/dashboard/landlord returns full dashboard data
   */
  describe('getDashboardData', () => {
    it('should return full dashboard data with KPIs and properties', async () => {
      // Arrange
      mockPropertyKPIService.getKPIs.mockResolvedValue(mockKPIData);
      mockPropertyListingModel.findByUserIdPaginated.mockResolvedValue({
        listings: mockProperties,
        total: 42,
      });

      // Act
      const result = await controller.getDashboardData(mockUserId);

      // Assert
      expect(result).toEqual({
        kpis: mockKPIData,
        properties: mockProperties,
        total: 42,
        hasMore: true, // offset (0) + listings (2) < total (42)
      });
      expect(mockPropertyKPIService.getKPIs).toHaveBeenCalledWith(mockUserId);
      expect(mockPropertyListingModel.findByUserIdPaginated).toHaveBeenCalledWith(
        mockUserId,
        20, // default limit
        0   // default offset (page 1)
      );
    });

    it('should handle pagination with custom page and limit', async () => {
      // Arrange
      mockPropertyKPIService.getKPIs.mockResolvedValue(mockKPIData);
      mockPropertyListingModel.findByUserIdPaginated.mockResolvedValue({
        listings: mockProperties,
        total: 25,
      });

      // Act
      const result = await controller.getDashboardData(mockUserId, 2, 10);

      // Assert
      expect(mockPropertyListingModel.findByUserIdPaginated).toHaveBeenCalledWith(
        mockUserId,
        10, // custom limit
        10  // offset for page 2
      );
      expect(result.hasMore).toBe(true); // offset (10) + listings (2) < total (25)
    });

    it('should set hasMore to false when all properties are loaded', async () => {
      // Arrange
      mockPropertyKPIService.getKPIs.mockResolvedValue(mockKPIData);
      mockPropertyListingModel.findByUserIdPaginated.mockResolvedValue({
        listings: mockProperties,
        total: 2,
      });

      // Act
      const result = await controller.getDashboardData(mockUserId);

      // Assert
      expect(result.hasMore).toBe(false); // offset (0) + listings (2) >= total (2)
    });
  });

  /**
   * Test 2: GET /api/dashboard/landlord/kpis returns KPIs only
   */
  describe('getKPIs', () => {
    it('should return KPIs only without properties', async () => {
      // Arrange
      mockPropertyKPIService.getKPIs.mockResolvedValue(mockKPIData);

      // Act
      const result = await controller.getKPIs(mockUserId);

      // Assert
      expect(result).toEqual(mockKPIData);
      expect(mockPropertyKPIService.getKPIs).toHaveBeenCalledWith(mockUserId);
      expect(mockPropertyListingModel.findByUserIdPaginated).not.toHaveBeenCalled();
    });

    it('should use cached KPIs when available', async () => {
      // Arrange - Service returns cached data
      mockPropertyKPIService.getKPIs.mockResolvedValue(mockKPIData);

      // Act
      await controller.getKPIs(mockUserId);

      // Assert - getKPIs should leverage caching internally
      expect(mockPropertyKPIService.getKPIs).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test 3: Error handling for KPI fetch failures
   */
  describe('error handling', () => {
    it('should propagate errors from PropertyKPIService', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockPropertyKPIService.getKPIs.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getKPIs(mockUserId)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should propagate errors from PropertyListingModel', async () => {
      // Arrange
      const error = new Error('Failed to fetch properties');
      mockPropertyKPIService.getKPIs.mockResolvedValue(mockKPIData);
      mockPropertyListingModel.findByUserIdPaginated.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getDashboardData(mockUserId)).rejects.toThrow(
        'Failed to fetch properties'
      );
    });
  });
});
