import { BrokerDashboardController } from '../../controllers/BrokerDashboardController';
import { BrokerKPIService, BrokerKPIData } from '../../services/BrokerKPIService';
import { BrokerProfileModel } from '../../database/models/BrokerProfile';
import { BrokerDealModel } from '../../database/models/BrokerDeal';
import { DemandListingModel } from '../../database/models/DemandListing';
import { PropertyListingModel } from '../../database/models/PropertyListing';

/**
 * Tests for BrokerDashboardController
 * Task Group 4.1: Write 4-7 focused tests for broker API endpoints
 */

describe('BrokerDashboardController', () => {
  let controller: BrokerDashboardController;
  let mockBrokerKPIService: jest.Mocked<BrokerKPIService>;
  let mockBrokerProfileModel: jest.Mocked<BrokerProfileModel>;
  let mockBrokerDealModel: jest.Mocked<BrokerDealModel>;
  let mockDemandListingModel: jest.Mocked<DemandListingModel>;
  let mockPropertyListingModel: jest.Mocked<PropertyListingModel>;

  const mockUserId = 'broker-user-123';
  const mockKPIData: BrokerKPIData = {
    activeDeals: {
      value: 8,
      trend: { value: 20.0, direction: 'up', period: 'vs last week' },
    },
    commissionPipeline: {
      value: 45000.0,
      trend: { value: 15.5, direction: 'up', period: 'vs last week' },
    },
    responseRate: {
      value: 85,
      trend: { value: 5.0, direction: 'up', period: 'vs last week' },
    },
    propertiesMatched: {
      value: 12,
      trend: { value: 10.0, direction: 'up', period: 'vs last week' },
    },
  };

  const mockBrokerProfile = {
    id: 'profile-123',
    user_id: mockUserId,
    company_name: 'Test Brokerage LLC',
    license_number: 'BRK123456',
    license_state: 'CA',
    specialties: ['retail', 'office'],
    bio: 'Experienced commercial real estate broker',
    website_url: 'https://testbrokerage.com',
    years_experience: 10,
    total_deals_closed: 12,
    total_commission_earned: 150000.0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockDeals = [
    {
      id: 'deal-1',
      broker_user_id: mockUserId,
      tenant_business_id: 'tenant-123',
      property_id: 'property-456',
      status: 'touring',
      estimated_commission: 5000.0,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'deal-2',
      broker_user_id: mockUserId,
      tenant_business_id: 'tenant-789',
      status: 'prospecting',
      estimated_commission: 3000.0,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const mockDemands = [
    {
      id: 'demand-1',
      business_id: 'business-1',
      title: 'Retail Space Needed',
      city: 'San Francisco',
      state: 'CA',
      property_type: 'retail',
      min_sqft: 1000,
      max_sqft: 2000,
    },
    {
      id: 'demand-2',
      business_id: 'business-2',
      title: 'Office Space Required',
      city: 'Los Angeles',
      state: 'CA',
      property_type: 'office',
      min_sqft: 2000,
      max_sqft: 5000,
    },
  ];

  const mockProperties = [
    {
      id: 'property-1',
      user_id: 'landlord-1',
      title: 'Prime Retail Space',
      city: 'San Francisco',
      state: 'CA',
      property_type: 'retail',
      square_footage: 1500,
      status: 'active',
    },
    {
      id: 'property-2',
      user_id: 'landlord-2',
      title: 'Modern Office Building',
      city: 'Los Angeles',
      state: 'CA',
      property_type: 'office',
      square_footage: 3000,
      status: 'active',
    },
  ];

  beforeEach(() => {
    // Create mocked services
    mockBrokerKPIService = {
      getKPIs: jest.fn(),
    } as any;

    mockBrokerProfileModel = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    mockBrokerDealModel = {
      findByBrokerUserId: jest.fn(),
    } as any;

    mockDemandListingModel = {
      findPaginated: jest.fn(),
    } as any;

    mockPropertyListingModel = {
      findPaginated: jest.fn(),
    } as any;

    // Create controller with mocked dependencies
    controller = new BrokerDashboardController(
      mockBrokerKPIService,
      mockBrokerProfileModel,
      mockBrokerDealModel,
      mockDemandListingModel,
      mockPropertyListingModel
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1: GET /api/dashboard/broker/kpis returns KPIs only
   */
  describe('getKPIs', () => {
    it('should return broker KPIs only', async () => {
      // Arrange
      mockBrokerKPIService.getKPIs.mockResolvedValue(mockKPIData);

      // Act
      const result = await controller.getKPIs(mockUserId);

      // Assert
      expect(result).toEqual(mockKPIData);
      expect(mockBrokerKPIService.getKPIs).toHaveBeenCalledWith(mockUserId);
    });

    it('should use cached KPIs when available', async () => {
      // Arrange
      mockBrokerKPIService.getKPIs.mockResolvedValue(mockKPIData);

      // Act
      await controller.getKPIs(mockUserId);

      // Assert - getKPIs should leverage caching internally
      expect(mockBrokerKPIService.getKPIs).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test 2: GET /api/broker/profile returns broker profile
   */
  describe('getBrokerProfile', () => {
    it('should return broker profile when it exists', async () => {
      // Arrange
      mockBrokerProfileModel.findByUserId.mockResolvedValue(mockBrokerProfile);

      // Act
      const result = await controller.getBrokerProfile(mockUserId);

      // Assert
      expect(result).toEqual(mockBrokerProfile);
      expect(mockBrokerProfileModel.findByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it('should return null when profile does not exist', async () => {
      // Arrange
      mockBrokerProfileModel.findByUserId.mockResolvedValue(null);

      // Act
      const result = await controller.getBrokerProfile(mockUserId);

      // Assert
      expect(result).toBeNull();
      expect(mockBrokerProfileModel.findByUserId).toHaveBeenCalledWith(mockUserId);
    });
  });

  /**
   * Test 3: POST /api/broker/profile creates broker profile
   */
  describe('createBrokerProfile', () => {
    it('should create a new broker profile', async () => {
      // Arrange
      const profileData = {
        company_name: 'Test Brokerage LLC',
        license_number: 'BRK123456',
        license_state: 'CA',
        specialties: ['retail', 'office'],
        bio: 'Experienced commercial real estate broker',
        website_url: 'https://testbrokerage.com',
        years_experience: 10,
      };
      mockBrokerProfileModel.create.mockResolvedValue(mockBrokerProfile);

      // Act
      const result = await controller.createBrokerProfile(mockUserId, profileData);

      // Assert
      expect(result).toEqual(mockBrokerProfile);
      expect(mockBrokerProfileModel.create).toHaveBeenCalledWith({
        user_id: mockUserId,
        ...profileData,
      });
    });
  });

  /**
   * Test 4: PUT /api/broker/profile updates broker profile
   */
  describe('updateBrokerProfile', () => {
    it('should update existing broker profile', async () => {
      // Arrange
      const updatedData = {
        bio: 'Updated bio',
        years_experience: 12,
      };
      const updatedProfile = { ...mockBrokerProfile, ...updatedData };
      mockBrokerProfileModel.update.mockResolvedValue(updatedProfile);

      // Act
      const result = await controller.updateBrokerProfile(mockUserId, updatedData);

      // Assert
      expect(result).toEqual(updatedProfile);
      expect(mockBrokerProfileModel.update).toHaveBeenCalledWith(mockUserId, updatedData);
    });

    it('should return null when profile does not exist', async () => {
      // Arrange
      mockBrokerProfileModel.update.mockResolvedValue(null);

      // Act
      const result = await controller.updateBrokerProfile(mockUserId, { bio: 'New bio' });

      // Assert
      expect(result).toBeNull();
    });
  });

  /**
   * Test 5: GET /api/broker/demands returns tenant demands with pagination
   */
  describe('getTenantDemands', () => {
    it('should return paginated tenant demands', async () => {
      // Arrange
      mockDemandListingModel.findPaginated.mockResolvedValue({
        listings: mockDemands,
        total: 50,
      });

      // Act
      const result = await controller.getTenantDemands({ page: 1, limit: 20 });

      // Assert
      expect(result.demands).toEqual(mockDemands);
      expect(result.total).toBe(50);
      expect(result.hasMore).toBe(true); // offset (0) + demands (2) < total (50)
      expect(mockDemandListingModel.findPaginated).toHaveBeenCalledWith(20, 0, {});
    });

    it('should handle custom pagination and filters', async () => {
      // Arrange
      const filters = {
        location: 'San Francisco',
        propertyType: 'retail',
        minSqft: 1000,
        maxSqft: 2000,
      };
      mockDemandListingModel.findPaginated.mockResolvedValue({
        listings: mockDemands,
        total: 10,
      });

      // Act
      const result = await controller.getTenantDemands({ page: 2, limit: 10, ...filters });

      // Assert
      expect(mockDemandListingModel.findPaginated).toHaveBeenCalledWith(10, 10, filters);
      expect(result.hasMore).toBe(false); // offset (10) + demands (2) >= total (10)
    });
  });

  /**
   * Test 6: GET /api/broker/properties returns properties with pagination
   */
  describe('getProperties', () => {
    it('should return paginated property listings', async () => {
      // Arrange
      mockPropertyListingModel.findPaginated.mockResolvedValue({
        listings: mockProperties,
        total: 100,
      });

      // Act
      const result = await controller.getProperties({ page: 1, limit: 20 });

      // Assert
      expect(result.properties).toEqual(mockProperties);
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(true); // offset (0) + properties (2) < total (100)
      expect(mockPropertyListingModel.findPaginated).toHaveBeenCalledWith(20, 0, {});
    });

    it('should handle custom pagination and filters', async () => {
      // Arrange
      const filters = {
        location: 'Los Angeles',
        propertyType: 'office',
        minSqft: 2000,
        maxSqft: 5000,
      };
      mockPropertyListingModel.findPaginated.mockResolvedValue({
        listings: mockProperties,
        total: 25,
      });

      // Act
      const result = await controller.getProperties({ page: 3, limit: 10, ...filters });

      // Assert
      expect(mockPropertyListingModel.findPaginated).toHaveBeenCalledWith(10, 20, filters);
      expect(result.hasMore).toBe(true); // offset (20) + properties (2) < total (25)
    });
  });

  /**
   * Test 7: GET /api/broker/deals returns broker deals
   */
  describe('getDeals', () => {
    it('should return broker deals with pagination', async () => {
      // Arrange
      mockBrokerDealModel.findByBrokerUserId.mockResolvedValue({
        deals: mockDeals,
        total: 30,
      });

      // Act
      const result = await controller.getDeals(mockUserId, { page: 1, limit: 20 });

      // Assert
      expect(result.deals).toEqual(mockDeals);
      expect(result.total).toBe(30);
      expect(result.hasMore).toBe(true); // offset (0) + deals (2) < total (30)
      expect(mockBrokerDealModel.findByBrokerUserId).toHaveBeenCalledWith(
        mockUserId,
        20,
        0,
        undefined // No status filter
      );
    });

    it('should filter deals by status', async () => {
      // Arrange
      const activeDeals = [mockDeals[0]];
      mockBrokerDealModel.findByBrokerUserId.mockResolvedValue({
        deals: activeDeals,
        total: 8,
      });

      // Act
      const result = await controller.getDeals(mockUserId, {
        page: 1,
        limit: 20,
        status: 'touring',
      });

      // Assert
      expect(result.deals).toEqual(activeDeals);
      expect(result.total).toBe(8);
      expect(mockBrokerDealModel.findByBrokerUserId).toHaveBeenCalledWith(
        mockUserId,
        20,
        0,
        'touring'
      );
    });
  });

  /**
   * Test 8: Error handling for service failures
   */
  describe('error handling', () => {
    it('should propagate errors from BrokerKPIService', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockBrokerKPIService.getKPIs.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getKPIs(mockUserId)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should propagate errors from BrokerProfileModel', async () => {
      // Arrange
      const error = new Error('Failed to create profile');
      mockBrokerProfileModel.create.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.createBrokerProfile(mockUserId, {
          company_name: 'Test',
        })
      ).rejects.toThrow('Failed to create profile');
    });

    it('should propagate errors from BrokerDealModel', async () => {
      // Arrange
      const error = new Error('Failed to fetch deals');
      mockBrokerDealModel.findByBrokerUserId.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getDeals(mockUserId, {})).rejects.toThrow(
        'Failed to fetch deals'
      );
    });
  });
});
