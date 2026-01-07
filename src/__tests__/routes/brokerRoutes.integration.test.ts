import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app';
import { BusinessProfileService } from '../../services/BusinessProfileService';
import { TenantProfileService } from '../../services/TenantProfileService';
import { DemandListingService } from '../../services/DemandListingService';
import { JwtService } from '../../services/auth/JwtService';

/**
 * Integration tests for new broker routes (Figma Redesign)
 * Tests critical endpoints for business profiles, tenant profiles, and locations
 *
 * Scope: Tests 6 critical endpoint flows
 * - Business profile creation
 * - Business profile retrieval with team members
 * - Tenant profile search
 * - Tenant profile detail retrieval
 * - Admin approval request
 * - Location creation with amenities
 */
describe('Broker Routes Integration Tests', () => {
  let app: Express;
  let jwtService: JwtService;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    app = createApp();
    jwtService = new JwtService();

    // Create a test broker user token
    userId = 'test-broker-user-id-123';
    accessToken = jwtService.generateAccessToken({
      userId,
      email: 'broker@test.com',
      role: 'broker',
    });
  });

  describe('POST /api/broker/business-profiles', () => {
    it('should create a business profile with stats initialization', async () => {
      const profileData = {
        company_name: 'CBRE Test',
        established_year: 1996,
        location_city: 'Dallas',
        location_state: 'TX',
        about: 'Test brokerage firm',
        website_url: 'https://cbre.com',
      };

      const response = await request(app)
        .post('/api/broker/business-profiles')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.company_name).toBe(profileData.company_name);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.offices_count).toBe(0);
      expect(response.body.data.stats.agents_count).toBe(0);
    });

    it('should return 400 when company_name is missing', async () => {
      const response = await request(app)
        .post('/api/broker/business-profiles')
        .set('Cookie', `accessToken=${accessToken}`)
        .send({
          established_year: 1996,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.message).toContain('required');
    });

    it('should return 401 when no auth token provided', async () => {
      const response = await request(app)
        .post('/api/broker/business-profiles')
        .send({ company_name: 'Test' })
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/broker/business-profiles/:id', () => {
    let profileId: string;

    beforeAll(async () => {
      // Create a test profile first
      const service = new BusinessProfileService();
      const profile = await service.create(userId, {
        company_name: 'Test Brokerage for Retrieval',
        established_year: 2000,
      });
      profileId = profile.id;

      // Add a team member
      await service.addTeamMember(profileId, {
        email: 'agent@test.com',
        role: 'broker',
      });
    });

    it('should retrieve business profile with team members', async () => {
      const response = await request(app)
        .get(`/api/broker/business-profiles/${profileId}`)
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(profileId);
      expect(response.body.data.team_members).toBeDefined();
      expect(Array.isArray(response.body.data.team_members)).toBe(true);
      expect(response.body.data.team_members.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent profile', async () => {
      const response = await request(app)
        .get('/api/broker/business-profiles/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/broker/tenants', () => {
    beforeAll(async () => {
      // Create test tenant profiles
      const service = new TenantProfileService();
      await service.create({
        display_name: 'Starbucks Coffee',
        category: 'Quick Service Retail',
        about: 'Global coffee chain',
        tenant_pin: '123',
      });
      await service.create({
        display_name: 'Target Corporation',
        category: 'Retail',
        about: 'Retail department store',
        tenant_pin: '456',
      });
    });

    it('should search tenant profiles with pagination', async () => {
      const response = await request(app)
        .get('/api/broker/tenants')
        .set('Cookie', `accessToken=${accessToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profiles).toBeDefined();
      expect(Array.isArray(response.body.data.profiles)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(20);
    });

    it('should filter tenant profiles by search query', async () => {
      const response = await request(app)
        .get('/api/broker/tenants')
        .set('Cookie', `accessToken=${accessToken}`)
        .query({ search: 'Starbucks' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profiles.length).toBeGreaterThan(0);
      expect(response.body.data.profiles[0].display_name).toContain('Starbucks');
    });
  });

  describe('GET /api/broker/tenants/:id', () => {
    let tenantProfileId: string;

    beforeAll(async () => {
      // Create a test tenant profile with related data
      const service = new TenantProfileService();
      const profile = await service.create({
        display_name: 'Test Tenant for Detail View',
        category: 'Retail',
        about: 'Test tenant with full details',
        tenant_pin: '789',
      });
      tenantProfileId = profile.id;

      // Add images, documents, and locations
      await service.addImage(tenantProfileId, 'https://example.com/image1.jpg', 1);
      await service.addDocument(tenantProfileId, {
        document_name: 'Test Document',
        document_url: 'https://example.com/doc.pdf',
        document_type: 'pdf',
      });
      await service.addLocation(tenantProfileId, {
        location_name: 'Test Location',
        city: 'San Francisco',
        state: 'CA',
        asset_type: 'Retail',
      });
    });

    it('should retrieve full tenant profile with images, documents, and locations', async () => {
      const response = await request(app)
        .get(`/api/broker/tenants/${tenantProfileId}`)
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(tenantProfileId);
      expect(response.body.data.images).toBeDefined();
      expect(response.body.data.documents).toBeDefined();
      expect(response.body.data.locations).toBeDefined();
      expect(Array.isArray(response.body.data.images)).toBe(true);
      expect(Array.isArray(response.body.data.documents)).toBe(true);
      expect(Array.isArray(response.body.data.locations)).toBe(true);
    });
  });

  describe('POST /api/broker/tenants/:id/request', () => {
    let tenantProfileId: string;
    let businessProfileId: string;

    beforeAll(async () => {
      // Create test tenant profile
      const tenantService = new TenantProfileService();
      const tenant = await tenantService.create({
        display_name: 'Test Tenant for Approval',
        category: 'Retail',
        tenant_pin: '999',
        contact_email: 'tenant@test.com',
      });
      tenantProfileId = tenant.id;

      // Create test business profile
      const businessService = new BusinessProfileService();
      const business = await businessService.create(userId, {
        company_name: 'Test Brokerage for Approval',
      });
      businessProfileId = business.id;
    });

    it('should create admin approval request', async () => {
      const response = await request(app)
        .post(`/api/broker/tenants/${tenantProfileId}/request`)
        .set('Cookie', `accessToken=${accessToken}`)
        .send({
          business_profile_id: businessProfileId,
          tenant_email: 'tenant@test.com',
          tenant_pin: '999',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requestId).toBeDefined();
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.message).toContain('success');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post(`/api/broker/tenants/${tenantProfileId}/request`)
        .set('Cookie', `accessToken=${accessToken}`)
        .send({
          // Missing business_profile_id
          tenant_email: 'tenant@test.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('POST /api/broker/locations', () => {
    let businessProfileId: string;

    beforeAll(async () => {
      // Create test business profile
      const service = new BusinessProfileService();
      const profile = await service.create(userId, {
        company_name: 'Test Brokerage for Locations',
      });
      businessProfileId = profile.id;
    });

    it('should create location with amenities and map boundaries', async () => {
      const locationData = {
        business_profile_id: businessProfileId,
        location_name: 'San Francisco Area',
        asset_type: 'Retail',
        city: 'San Francisco',
        state: 'CA',
        sqft_min: 1000,
        sqft_max: 2000,
        monthly_budget_min: 10000,
        monthly_budget_max: 15000,
        preferred_lease_term: 'Medium-term 3-5 years',
        locations_of_interest: ['Palo Alto', 'Los Altos Hills', 'Menlo Park'],
        amenities: [
          'Corporate location',
          '24/7',
          'ADA accessible',
          'Glass storefront',
          'Parking',
        ],
        map_boundaries: {
          type: 'FeatureCollection',
          features: [],
        },
      };

      const response = await request(app)
        .post('/api/broker/locations')
        .set('Cookie', `accessToken=${accessToken}`)
        .send(locationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.location_name).toBe(locationData.location_name);
      expect(response.body.data.amenities).toEqual(locationData.amenities);
      expect(response.body.data.locations_of_interest).toEqual(locationData.locations_of_interest);
      expect(response.body.data.sqft_min).toBe(locationData.sqft_min);
      expect(response.body.data.sqft_max).toBe(locationData.sqft_max);
    });

    it('should return 400 when sqft_min is greater than sqft_max', async () => {
      const response = await request(app)
        .post('/api/broker/locations')
        .set('Cookie', `accessToken=${accessToken}`)
        .send({
          business_profile_id: businessProfileId,
          location_name: 'Invalid Location',
          asset_type: 'Retail',
          city: 'Test City',
          state: 'CA',
          sqft_min: 2000,
          sqft_max: 1000, // Invalid: min > max
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.message).toContain('cannot be greater');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/broker/locations')
        .set('Cookie', `accessToken=${accessToken}`)
        .send({
          // Missing required fields
          location_name: 'Test',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });
  });
});
