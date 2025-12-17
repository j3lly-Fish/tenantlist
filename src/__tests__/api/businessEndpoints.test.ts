import { Pool } from 'pg';
import pool from '../../config/database';
import { AuthController } from '../../controllers/AuthController';
import { AuthService } from '../../services/auth/AuthService';
import { BusinessModel } from '../../database/models/Business';
import { BusinessLocationModel } from '../../database/models/BusinessLocation';
import { BusinessMetricsModel } from '../../database/models/BusinessMetrics';
import { UserRole, BusinessStatus } from '../../types';
import request from 'supertest';
import app from '../../app';

/**
 * Business API Endpoints Tests
 * Tests for Task Group 3: Backend API - Business Endpoints
 *
 * Test Coverage:
 * - GET /api/businesses with authentication
 * - GET /api/businesses with pagination
 * - GET /api/businesses/:id authorization
 * - Role-based access control (tenant only)
 * - Business filtering and search
 * - Location endpoints with authorization
 */

describe('Business API Endpoints', () => {
  let authController: AuthController;
  let authService: AuthService;
  let businessModel: BusinessModel;
  let businessLocationModel: BusinessLocationModel;
  let businessMetricsModel: BusinessMetricsModel;

  let tenantUserId: string;
  let tenantAccessToken: string;
  let landlordUserId: string;
  let landlordAccessToken: string;
  let businessId1: string;
  let businessId2: string;
  let locationId1: string;

  beforeAll(async () => {
    // Initialize services and controllers
    authService = new AuthService(pool);
    authController = new AuthController(authService);
    businessModel = new BusinessModel(pool);
    businessLocationModel = new BusinessLocationModel(pool);
    businessMetricsModel = new BusinessMetricsModel(pool);

    // Create test users
    const tenantSignup = {
      email: 'tenant@business.com',
      password: 'SecurePass123!',
      role: UserRole.TENANT,
      firstName: 'Test',
      lastName: 'Tenant',
      phone: '+12125551234',
    };

    const tenantResult = await authController.signup(tenantSignup, '192.168.1.1');
    tenantUserId = tenantResult.user.id;
    tenantAccessToken = tenantResult.tokens.accessToken;

    const landlordSignup = {
      email: 'landlord@business.com',
      password: 'SecurePass123!',
      role: UserRole.LANDLORD,
      firstName: 'Test',
      lastName: 'Landlord',
      phone: '+12125555678',
    };

    const landlordResult = await authController.signup(landlordSignup, '192.168.1.2');
    landlordUserId = landlordResult.user.id;
    landlordAccessToken = landlordResult.tokens.accessToken;

    // Create test businesses for tenant
    const business1 = await businessModel.create({
      user_id: tenantUserId,
      name: 'Coffee Shop Downtown',
      category: 'F&B',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });
    businessId1 = business1.id;

    const business2 = await businessModel.create({
      user_id: tenantUserId,
      name: 'Retail Store Uptown',
      category: 'Retail',
      status: BusinessStatus.PENDING_VERIFICATION,
      is_verified: false,
    });
    businessId2 = business2.id;

    // Create location for business1
    const location1 = await businessLocationModel.create({
      business_id: businessId1,
      city: 'New York',
      state: 'NY',
      address: '123 Main St',
    });
    locationId1 = location1.id;

    // Create metrics for business1
    await businessMetricsModel.create({
      business_id: businessId1,
      demand_listing_id: locationId1,
      metric_date: new Date(),
      views_count: 100,
      clicks_count: 50,
      messages_count: 10,
    });
  });

  afterAll(async () => {
    // Clean up database
    await pool.query('DELETE FROM business_metrics');
    await pool.query('DELETE FROM business_locations');
    await pool.query('DELETE FROM businesses');
    await pool.query('DELETE FROM user_profiles');
    await pool.query('DELETE FROM password_reset_tokens');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM users');
    await pool.end();
  });

  describe('GET /api/businesses - List businesses with authentication', () => {
    it('should return businesses for authenticated tenant user', async () => {
      const response = await request(app)
        .get('/api/businesses')
        .set('Authorization', `Bearer ${tenantAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.businesses).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.businesses[0].name).toBe('Retail Store Uptown'); // DESC order
      expect(response.body.data.businesses[1].name).toBe('Coffee Shop Downtown');
    });

    it('should reject request without authentication token', async () => {
      const response = await request(app)
        .get('/api/businesses')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request from non-tenant role (landlord)', async () => {
      const response = await request(app)
        .get('/api/businesses')
        .set('Authorization', `Bearer ${landlordAccessToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/businesses - Pagination and filtering', () => {
    it('should support pagination with limit and page parameters', async () => {
      const response = await request(app)
        .get('/api/businesses?page=1&limit=1')
        .set('Authorization', `Bearer ${tenantAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.businesses).toHaveLength(1);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(1);
      expect(response.body.data.hasMore).toBe(true);
    });

    it('should filter businesses by status', async () => {
      const response = await request(app)
        .get('/api/businesses?status=active')
        .set('Authorization', `Bearer ${tenantAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.businesses).toHaveLength(1);
      expect(response.body.data.businesses[0].status).toBe('active');
    });

    it('should search businesses by name', async () => {
      const response = await request(app)
        .get('/api/businesses?search=Coffee')
        .set('Authorization', `Bearer ${tenantAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.businesses).toHaveLength(1);
      expect(response.body.data.businesses[0].name).toBe('Coffee Shop Downtown');
    });
  });

  describe('GET /api/businesses/:id - Get single business with authorization', () => {
    it('should return business details with locations for owner', async () => {
      const response = await request(app)
        .get(`/api/businesses/${businessId1}`)
        .set('Authorization', `Bearer ${tenantAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.business.id).toBe(businessId1);
      expect(response.body.data.business.name).toBe('Coffee Shop Downtown');
      expect(response.body.data.locations).toHaveLength(1);
      expect(response.body.data.locations[0].city).toBe('New York');
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.metrics.total_views).toBe(100);
    });

    it('should return 404 for non-existent business', async () => {
      const response = await request(app)
        .get('/api/businesses/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${tenantAccessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 403 when accessing another user\'s business', async () => {
      const response = await request(app)
        .get(`/api/businesses/${businessId1}`)
        .set('Authorization', `Bearer ${landlordAccessToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/businesses/:id/locations - List business locations', () => {
    it('should return locations for business owner', async () => {
      const response = await request(app)
        .get(`/api/businesses/${businessId1}/locations`)
        .set('Authorization', `Bearer ${tenantAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locations).toHaveLength(1);
      expect(response.body.data.locations[0].city).toBe('New York');
      expect(response.body.data.locations[0].state).toBe('NY');
    });

    it('should return 403 for non-owner access', async () => {
      const response = await request(app)
        .get(`/api/businesses/${businessId1}/locations`)
        .set('Authorization', `Bearer ${landlordAccessToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/businesses/:id/locations/:locationId/metrics - Location metrics', () => {
    it('should return metrics for specific location', async () => {
      const response = await request(app)
        .get(`/api/businesses/${businessId1}/locations/${locationId1}/metrics`)
        .set('Authorization', `Bearer ${tenantAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.metrics.length).toBeGreaterThan(0);
      expect(response.body.data.metrics[0].views_count).toBe(100);
    });

    it('should return 403 for non-owner access to location metrics', async () => {
      const response = await request(app)
        .get(`/api/businesses/${businessId1}/locations/${locationId1}/metrics`)
        .set('Authorization', `Bearer ${landlordAccessToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
