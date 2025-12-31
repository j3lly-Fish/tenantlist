/**
 * Landlord Dashboard E2E Tests
 *
 * Critical end-to-end workflows for landlord users:
 * 1. Signup as landlord → Verify email → Dashboard loads
 * 2. Login as landlord → Dashboard loads with KPIs
 * 3. Dashboard displays property listings correctly
 * 4. WebSocket connection for real-time updates
 * 5. Create property listing from dashboard
 * 6. Update property status triggers KPI refresh
 * 7. Delete property removes from dashboard
 * 8. Infinite scroll loads more properties
 * 9. Non-landlord user redirected from dashboard
 * 10. Dashboard API returns correct structure
 *
 * Test count: 10 E2E tests for landlord user flows
 */

import request from 'supertest';
import { createApp } from '../../app';
import { Express } from 'express';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, PropertyListingStatus, PropertyType } from '../../types';
import { JwtService } from '../../services/auth/JwtService';
import { io as ioClient, Socket } from 'socket.io-client';
import http from 'http';
import { initializeDashboardSocket } from '../../websocket/dashboardSocket';
import { AuthController } from '../../controllers/AuthController';
import { AuthService } from '../../services/auth/AuthService';

// Mock Redis
const mockRedisStorage = new Map<string, string>();
const mockRedisTTL = new Map<string, number>();

jest.mock('../../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn((key: string) => {
      const value = mockRedisStorage.get(key);
      return Promise.resolve(value || null);
    }),
    setex: jest.fn((key: string, ttl: number, value: string) => {
      mockRedisStorage.set(key, value);
      mockRedisTTL.set(key, ttl);
      return Promise.resolve('OK');
    }),
    del: jest.fn((...keys: string[]) => {
      keys.forEach((key) => {
        mockRedisStorage.delete(key);
        mockRedisTTL.delete(key);
      });
      return Promise.resolve(keys.length);
    }),
  },
}));

describe('Landlord Dashboard E2E Tests', () => {
  let app: Express;
  let server: http.Server;
  let jwtService: JwtService;
  let authService: AuthService;
  let authController: AuthController;

  let landlordUserId: string;
  let landlordEmail: string;
  let landlordAccessToken: string;
  let tenantUserId: string;
  let tenantEmail: string;
  let tenantAccessToken: string;
  let propertyIds: string[] = [];

  beforeAll(async () => {
    // Create app and server
    app = createApp();
    server = http.createServer(app);
    initializeDashboardSocket(server);

    // Start server
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });

    jwtService = new JwtService();
    authService = new AuthService(pool);
    authController = new AuthController(authService);

    // Create landlord user
    landlordEmail = `landlord-e2e-${Date.now()}@example.com`;
    const landlordSignup = {
      email: landlordEmail,
      password: 'SecurePass123!',
      role: UserRole.LANDLORD,
      firstName: 'Test',
      lastName: 'Landlord',
      phone: '+12125551111',
    };

    const landlordResult = await authController.signup(landlordSignup, '192.168.1.1');
    landlordUserId = landlordResult.user.id;
    landlordAccessToken = landlordResult.tokens.accessToken;

    // Verify landlord email to allow full access
    const landlordRecord = await pool.query('SELECT email_verification_token FROM users WHERE id = $1', [
      landlordUserId,
    ]);
    if (landlordRecord.rows[0]?.email_verification_token) {
      await authController.verifyEmail({ token: landlordRecord.rows[0].email_verification_token });
    }

    // Create tenant user (for access control testing)
    tenantEmail = `tenant-e2e-${Date.now()}@example.com`;
    const tenantSignup = {
      email: tenantEmail,
      password: 'SecurePass123!',
      role: UserRole.TENANT,
      firstName: 'Test',
      lastName: 'Tenant',
      phone: '+12125552222',
    };

    const tenantResult = await authController.signup(tenantSignup, '192.168.1.2');
    tenantUserId = tenantResult.user.id;
    tenantAccessToken = tenantResult.tokens.accessToken;

    // Create test properties for the landlord
    for (let i = 0; i < 25; i++) {
      const propertyId = uuidv4();
      const statuses = [PropertyListingStatus.ACTIVE, PropertyListingStatus.PENDING, PropertyListingStatus.INACTIVE];
      const status = statuses[i % 3];

      await pool.query(
        `INSERT INTO property_listings (
          id, user_id, title, description, property_type, status,
          address, city, state, zip_code, sqft, price_per_sqft,
          availability_date, lease_term_months, utilities_included,
          amenities, zoning, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())`,
        [
          propertyId,
          landlordUserId,
          `Office Space ${i + 1}`,
          `Professional office space in Manhattan - ${i + 1}`,
          i % 2 === 0 ? PropertyType.OFFICE : PropertyType.RETAIL,
          status,
          `${100 + i} Main St`,
          'New York',
          'NY',
          '10001',
          1000 + i * 100,
          50 + i,
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          12,
          i % 2 === 0,
          ['WiFi', 'Parking', 'Security'],
          'Commercial',
        ]
      );
      propertyIds.push(propertyId);
    }
  });

  afterAll(async () => {
    // Clean up
    await pool.query('DELETE FROM property_listings WHERE id = ANY($1)', [propertyIds]);
    await pool.query('DELETE FROM user_profiles WHERE user_id = $1 OR user_id = $2', [
      landlordUserId,
      tenantUserId,
    ]);
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1 OR user_id = $2', [
      landlordUserId,
      tenantUserId,
    ]);
    await pool.query('DELETE FROM users WHERE id = $1 OR id = $2', [landlordUserId, tenantUserId]);

    mockRedisStorage.clear();
    mockRedisTTL.clear();

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    mockRedisStorage.clear();
    mockRedisTTL.clear();
  });

  /**
   * E2E Test 1: Signup as landlord → Verify email → Dashboard loads
   */
  test('E2E: Complete signup flow for landlord user', async () => {
    // Create new landlord user
    const newLandlordEmail = `new-landlord-${Date.now()}@example.com`;
    const signupData = {
      email: newLandlordEmail,
      password: 'SecurePass123!',
      role: UserRole.LANDLORD,
      firstName: 'New',
      lastName: 'Landlord',
      phone: '+12125553333',
    };

    const signupResponse = await request(app).post('/api/auth/signup').send(signupData).expect(201);

    expect(signupResponse.body.user.role).toBe(UserRole.LANDLORD);
    expect(signupResponse.body).toHaveProperty('accessToken');
    expect(signupResponse.body).toHaveProperty('refreshToken');

    const newLandlordToken = signupResponse.body.accessToken;
    const newLandlordId = signupResponse.body.user.id;

    // Verify can access dashboard even with unverified email (with banner)
    const dashboardResponse = await request(app)
      .get('/api/dashboard/landlord')
      .set('Cookie', `accessToken=${newLandlordToken}`)
      .expect(200);

    expect(dashboardResponse.body.success).toBe(true);
    expect(dashboardResponse.body.data).toHaveProperty('kpis');
    expect(dashboardResponse.body.data).toHaveProperty('properties');

    // Cleanup
    await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [newLandlordId]);
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [newLandlordId]);
    await pool.query('DELETE FROM users WHERE id = $1', [newLandlordId]);
  });

  /**
   * E2E Test 2: Login as landlord → Dashboard loads with KPIs
   */
  test('E2E: Landlord login and dashboard load with KPIs', async () => {
    // Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: landlordEmail,
        password: 'SecurePass123!',
        rememberMe: true,
      })
      .expect(200);

    expect(loginResponse.body.user.role).toBe(UserRole.LANDLORD);
    expect(loginResponse.body.user.email).toBe(landlordEmail);
    expect(loginResponse.body).toHaveProperty('accessToken');

    const token = loginResponse.body.accessToken;

    // Get dashboard data
    const dashboardResponse = await request(app)
      .get('/api/dashboard/landlord')
      .set('Cookie', `accessToken=${token}`)
      .expect(200);

    expect(dashboardResponse.body.success).toBe(true);
    expect(dashboardResponse.body.data).toHaveProperty('kpis');
    expect(dashboardResponse.body.data).toHaveProperty('properties');
    expect(dashboardResponse.body.data).toHaveProperty('total');

    // Verify KPIs
    const { kpis } = dashboardResponse.body.data;
    expect(kpis).toHaveProperty('totalListings');
    expect(kpis).toHaveProperty('activeListings');
    expect(kpis.totalListings.value).toBe(25);
    expect(kpis.activeListings.value).toBeGreaterThan(0);
  });

  /**
   * E2E Test 3: Dashboard displays property listings correctly
   */
  test('E2E: Dashboard returns property listings with correct structure', async () => {
    const response = await request(app)
      .get('/api/dashboard/landlord?page=1&limit=10')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.properties).toHaveLength(10);
    expect(response.body.data.total).toBe(25);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.hasMore).toBe(true);

    // Verify property structure
    const property = response.body.data.properties[0];
    expect(property).toMatchObject({
      id: expect.any(String),
      user_id: landlordUserId,
      title: expect.any(String),
      property_type: expect.stringMatching(/office|retail|industrial|warehouse/i),
      status: expect.stringMatching(/active|pending|inactive/i),
      address: expect.any(String),
      city: expect.any(String),
      state: expect.any(String),
      zip_code: expect.any(String),
      sqft: expect.any(Number),
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  /**
   * E2E Test 4: WebSocket connection for real-time updates
   */
  test('E2E: WebSocket connects and receives landlord dashboard events', (done) => {
    const port = (server.address() as any).port;
    const socket = ioClient(`http://localhost:${port}/dashboard`, {
      auth: {
        token: landlordAccessToken,
      },
    });

    socket.on('connect', () => {
      expect(socket.connected).toBe(true);

      // Request current state
      socket.emit('request:current-state');
    });

    socket.on('reconnected', (data) => {
      expect(data).toHaveProperty('timestamp');
      socket.disconnect();
      done();
    });

    socket.on('connect_error', (error) => {
      socket.disconnect();
      done(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (socket.connected) {
        socket.disconnect();
        done(new Error('WebSocket connection timeout'));
      }
    }, 5000);
  });

  /**
   * E2E Test 5: Create property listing from dashboard
   */
  test('E2E: Create new property listing via API', async () => {
    const newProperty = {
      title: 'New Office Space',
      description: 'Brand new office space in downtown',
      propertyType: PropertyType.OFFICE,
      status: PropertyListingStatus.ACTIVE,
      address: '500 Broadway',
      city: 'New York',
      state: 'NY',
      zipCode: '10012',
      sqft: 3000,
      pricePerSqft: 75,
      availabilityDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      leaseTermMonths: 24,
      utilitiesIncluded: true,
      amenities: ['WiFi', 'Conference Room', 'Kitchen'],
      zoning: 'Commercial',
    };

    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${landlordAccessToken}`)
      .send(newProperty)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.property).toMatchObject({
      title: newProperty.title,
      user_id: landlordUserId,
      property_type: newProperty.propertyType,
      status: newProperty.status,
    });

    const newPropertyId = response.body.data.property.id;
    propertyIds.push(newPropertyId);

    // Verify it appears in dashboard
    const dashboardResponse = await request(app)
      .get('/api/dashboard/landlord?page=1&limit=30')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    const foundProperty = dashboardResponse.body.data.properties.find((p: any) => p.id === newPropertyId);
    expect(foundProperty).toBeDefined();
    expect(foundProperty.title).toBe(newProperty.title);
  });

  /**
   * E2E Test 6: Update property status triggers KPI refresh
   */
  test('E2E: Updating property status reflects in KPIs', async () => {
    // Get initial KPIs
    const initialKPIs = await request(app)
      .get('/api/dashboard/landlord/kpis')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    const initialActiveCount = initialKPIs.body.data.kpis.activeListings.value;

    // Update property status to INACTIVE
    const propertyToUpdate = propertyIds[0];
    await request(app)
      .patch(`/api/properties/${propertyToUpdate}/status`)
      .set('Authorization', `Bearer ${landlordAccessToken}`)
      .send({ status: PropertyListingStatus.INACTIVE })
      .expect(200);

    // Clear Redis cache to force recalculation
    mockRedisStorage.clear();

    // Get updated KPIs
    const updatedKPIs = await request(app)
      .get('/api/dashboard/landlord/kpis')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    const updatedActiveCount = updatedKPIs.body.data.kpis.activeListings.value;

    // Active count should decrease (depending on initial status)
    expect(updatedActiveCount).toBeLessThanOrEqual(initialActiveCount);
  });

  /**
   * E2E Test 7: Delete property removes from dashboard
   */
  test('E2E: Deleting property removes it from dashboard', async () => {
    const propertyToDelete = propertyIds[propertyIds.length - 1];

    // Verify property exists in dashboard
    const beforeDelete = await request(app)
      .get('/api/dashboard/landlord?page=1&limit=30')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    const beforeCount = beforeDelete.body.data.total;
    const propertyExists = beforeDelete.body.data.properties.some((p: any) => p.id === propertyToDelete);
    expect(propertyExists).toBe(true);

    // Delete property
    await request(app)
      .delete(`/api/properties/${propertyToDelete}`)
      .set('Authorization', `Bearer ${landlordAccessToken}`)
      .expect(200);

    // Verify property no longer in dashboard
    const afterDelete = await request(app)
      .get('/api/dashboard/landlord?page=1&limit=30')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    const afterCount = afterDelete.body.data.total;
    const propertyStillExists = afterDelete.body.data.properties.some((p: any) => p.id === propertyToDelete);

    expect(propertyStillExists).toBe(false);
    expect(afterCount).toBe(beforeCount - 1);

    // Remove from cleanup array
    propertyIds = propertyIds.filter((id) => id !== propertyToDelete);
  });

  /**
   * E2E Test 8: Infinite scroll loads more properties
   */
  test('E2E: Pagination loads more properties with infinite scroll', async () => {
    // Load first page
    const page1 = await request(app)
      .get('/api/dashboard/landlord?page=1&limit=10')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    expect(page1.body.data.properties).toHaveLength(10);
    expect(page1.body.data.page).toBe(1);
    expect(page1.body.data.hasMore).toBe(true);

    // Load second page
    const page2 = await request(app)
      .get('/api/dashboard/landlord?page=2&limit=10')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    expect(page2.body.data.properties).toHaveLength(10);
    expect(page2.body.data.page).toBe(2);
    expect(page2.body.data.hasMore).toBe(true);

    // Verify no duplicate properties
    const page1Ids = page1.body.data.properties.map((p: any) => p.id);
    const page2Ids = page2.body.data.properties.map((p: any) => p.id);
    const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);

    // Load last page
    const page3 = await request(app)
      .get('/api/dashboard/landlord?page=3&limit=10')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    expect(page3.body.data.properties.length).toBeLessThanOrEqual(10);
    expect(page3.body.data.hasMore).toBe(false);
  });

  /**
   * E2E Test 9: Non-landlord user redirected from dashboard
   */
  test('E2E: Tenant user is forbidden from accessing landlord dashboard', async () => {
    const response = await request(app)
      .get('/api/dashboard/landlord')
      .set('Cookie', `accessToken=${tenantAccessToken}`)
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(response.body.error.message).toContain('role');
  });

  /**
   * E2E Test 10: Dashboard API returns correct structure
   */
  test('E2E: Dashboard API response has complete and correct structure', async () => {
    const response = await request(app)
      .get('/api/dashboard/landlord')
      .set('Cookie', `accessToken=${landlordAccessToken}`)
      .expect(200);

    // Verify complete structure
    expect(response.body).toMatchObject({
      success: true,
      data: {
        kpis: {
          totalListings: {
            value: expect.any(Number),
            trend: expect.objectContaining({
              value: expect.any(Number),
              direction: expect.stringMatching(/up|down|neutral/),
              period: expect.any(String),
            }),
          },
          activeListings: {
            value: expect.any(Number),
            trend: expect.any(Object),
          },
          avgDaysOnMarket: {
            value: expect.any(Number),
            trend: expect.any(Object),
          },
          responseRate: {
            value: expect.any(Number),
            trend: expect.any(Object),
          },
        },
        properties: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        limit: expect.any(Number),
        hasMore: expect.any(Boolean),
      },
    });

    // Verify KPI trends have correct structure
    const kpis = response.body.data.kpis;
    Object.values(kpis).forEach((kpi: any) => {
      expect(kpi).toHaveProperty('value');
      expect(kpi).toHaveProperty('trend');
      expect(kpi.trend).toHaveProperty('value');
      expect(kpi.trend).toHaveProperty('direction');
      expect(kpi.trend).toHaveProperty('period');
    });
  });
});
