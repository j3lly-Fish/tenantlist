import request from 'supertest';
import express, { Express } from 'express';

/**
 * Integration tests for landlord dashboard routes
 * Task Group 4.1: Testing authentication, authorization, and data structure
 *
 * These tests verify the landlord endpoints integrated into dashboardRoutes.ts
 */

// Define mock data first
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
    user_id: 'test-landlord-123',
    title: 'Office Space Downtown',
    status: 'active',
  },
];

// Mock controller instance methods
const mockGetDashboardData = jest.fn().mockResolvedValue({
  kpis: mockKPIData,
  properties: mockProperties,
  total: 42,
  hasMore: true,
});

const mockGetKPIs = jest.fn().mockResolvedValue(mockKPIData);

// Mock the controllers BEFORE importing routes
jest.mock('../../controllers/LandlordDashboardController', () => {
  return {
    LandlordDashboardController: jest.fn().mockImplementation(() => ({
      getDashboardData: mockGetDashboardData,
      getKPIs: mockGetKPIs,
    })),
  };
});

jest.mock('../../controllers/DashboardController', () => {
  return {
    DashboardController: jest.fn().mockImplementation(() => ({
      getTenantDashboard: jest.fn(),
      getKPIsOnly: jest.fn(),
    })),
  };
});

// Mock middleware
jest.mock('../../middleware/roleGuardMiddleware', () => {
  return {
    RoleGuardMiddleware: jest.fn().mockImplementation(() => ({
      requireLandlord: jest.fn(() => (req: any, res: any, next: any) => {
        // Simulate authenticated landlord
        if (req.headers.authorization === 'Bearer valid-landlord-token') {
          req.user = {
            userId: 'test-landlord-123',
            email: 'landlord@test.com',
            role: 'LANDLORD',
          };
          next();
        } else {
          res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          });
        }
      }),
      requireTenant: jest.fn(() => (req: any, res: any, next: any) => {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Landlord role required' },
        });
      }),
      authenticate: jest.fn(() => (req: any, res: any, next: any) => {
        if (req.headers.authorization) {
          req.user = { userId: 'test-user', email: 'test@test.com', role: 'LANDLORD' };
          next();
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      }),
      requireBroker: jest.fn(() => (req: any, res: any, next: any) => {
        if (req.headers.authorization === 'Bearer valid-broker-token') {
          req.user = { userId: 'test-broker', email: 'broker@test.com', role: 'BROKER' };
          next();
        } else {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Broker role required' },
          });
        }
      }),
    })),
  };
});

jest.mock('../../middleware/ProfileCompletionGuard', () => {
  return {
    ProfileCompletionGuard: jest.fn().mockImplementation(() => ({
      check: jest.fn(() => (req: any, res: any, next: any) => next()),
    })),
  };
});

// Import routes AFTER mocks are set up
import dashboardRoutes from '../../routes/dashboardRoutes';

describe('Landlord Dashboard Routes Integration Tests', () => {
  let app: Express;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/dashboard', dashboardRoutes);

    // Reset mocks to default behavior
    mockGetDashboardData.mockClear();
    mockGetDashboardData.mockResolvedValue({
      kpis: mockKPIData,
      properties: mockProperties,
      total: 42,
      hasMore: true,
    });

    mockGetKPIs.mockClear();
    mockGetKPIs.mockResolvedValue(mockKPIData);
  });

  /**
   * Test 1: GET /api/dashboard/landlord returns full data
   */
  describe('GET /api/dashboard/landlord', () => {
    it('should return full dashboard data with correct structure', async () => {
      // Act
      const response = await request(app)
        .get('/api/dashboard/landlord')
        .set('Authorization', 'Bearer valid-landlord-token')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('kpis');
      expect(response.body.data).toHaveProperty('properties');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('hasMore');
    });

    it('should handle pagination query parameters', async () => {
      // Act
      const response = await request(app)
        .get('/api/dashboard/landlord?page=2&limit=10')
        .set('Authorization', 'Bearer valid-landlord-token')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
    });
  });

  /**
   * Test 2: GET /api/dashboard/landlord/kpis returns KPIs only
   */
  describe('GET /api/dashboard/landlord/kpis', () => {
    it('should return KPIs only with correct structure', async () => {
      // Act
      const response = await request(app)
        .get('/api/dashboard/landlord/kpis')
        .set('Authorization', 'Bearer valid-landlord-token')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalListings');
      expect(response.body.data).toHaveProperty('activeListings');
      expect(response.body.data).toHaveProperty('avgDaysOnMarket');
      expect(response.body.data).toHaveProperty('responseRate');
    });
  });

  /**
   * Test 3: Authentication requirement (401 without auth)
   */
  describe('Authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      // Act
      const response = await request(app)
        .get('/api/dashboard/landlord')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for KPIs endpoint without auth', async () => {
      // Act
      const response = await request(app)
        .get('/api/dashboard/landlord/kpis')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  /**
   * Test 4: Error handling
   */
  describe('Error Handling', () => {
    it('should handle controller errors gracefully for dashboard', async () => {
      // Arrange - configure mock to throw error
      mockGetDashboardData.mockRejectedValueOnce(new Error('Database error'));

      // Act
      const response = await request(app)
        .get('/api/dashboard/landlord')
        .set('Authorization', 'Bearer valid-landlord-token')
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle KPI fetch errors', async () => {
      // Arrange - configure mock to throw error
      mockGetKPIs.mockRejectedValueOnce(new Error('Redis error'));

      // Act
      const response = await request(app)
        .get('/api/dashboard/landlord/kpis')
        .set('Authorization', 'Bearer valid-landlord-token')
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
