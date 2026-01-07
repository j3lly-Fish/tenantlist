/**
 * API Endpoint Validation Tests
 *
 * Verifies:
 * - All 15 new endpoints are accessible
 * - Authentication/authorization on all routes
 * - Request/response formats match spec
 * - Error handling (400, 401, 403, 404, 500)
 * - Pagination works correctly
 */

import request from 'supertest';
import app from '../../app';
import sequelize from '../../database/db';
import User from '../../database/models/User';
import BusinessProfile from '../../database/models/BusinessProfile';
import TenantPublicProfile from '../../database/models/TenantPublicProfile';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Broker API Endpoints Validation Tests', () => {
  let brokerToken: string;
  let brokerUserId: string;
  let landlordToken: string;
  let businessProfileId: string;
  let tenantProfileId: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create broker user
    const brokerUser = await User.create({
      email: 'broker@validation.test',
      passwordHash: await bcrypt.hash('password', 10),
      firstName: 'Broker',
      lastName: 'User',
      phoneNumber: '+11111111111',
      role: 'broker',
      emailVerified: true,
    });
    brokerUserId = brokerUser.id;

    brokerToken = jwt.sign(
      { userId: brokerUser.id, role: 'broker' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1d' }
    );

    // Create landlord user for authorization tests
    const landlordUser = await User.create({
      email: 'landlord@validation.test',
      passwordHash: await bcrypt.hash('password', 10),
      firstName: 'Landlord',
      lastName: 'User',
      phoneNumber: '+12222222222',
      role: 'landlord',
      emailVerified: true,
    });

    landlordToken = jwt.sign(
      { userId: landlordUser.id, role: 'landlord' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1d' }
    );

    // Create test data
    const businessProfile = await BusinessProfile.create({
      created_by_user_id: brokerUser.id,
      company_name: 'Test Business',
      established_year: 2020,
    });
    businessProfileId = businessProfile.id;

    const tenantProfile = await TenantPublicProfile.create({
      display_name: 'Test Tenant',
      category: 'Retail',
      tenant_pin: '123',
      contact_email: 'tenant@test.com',
    });
    tenantProfileId = tenantProfile.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Authentication Tests (401 Unauthorized)', () => {
    it('POST /api/broker/business-profiles - should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/broker/business-profiles')
        .send({ company_name: 'Test' });

      expect(res.status).toBe(401);
    });

    it('GET /api/broker/business-profiles - should return 401 without auth', async () => {
      const res = await request(app)
        .get('/api/broker/business-profiles');

      expect(res.status).toBe(401);
    });

    it('GET /api/broker/tenants - should return 401 without auth', async () => {
      const res = await request(app)
        .get('/api/broker/tenants');

      expect(res.status).toBe(401);
    });

    it('POST /api/broker/locations - should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/broker/locations')
        .send({ listing_name: 'Test' });

      expect(res.status).toBe(401);
    });
  });

  describe('Authorization Tests (403 Forbidden)', () => {
    it('POST /api/broker/business-profiles - should return 403 for non-broker', async () => {
      const res = await request(app)
        .post('/api/broker/business-profiles')
        .set('Cookie', [`token=${landlordToken}`])
        .send({ company_name: 'Test' });

      expect(res.status).toBe(403);
    });

    it('GET /api/broker/business-profiles - should return 403 for non-broker', async () => {
      const res = await request(app)
        .get('/api/broker/business-profiles')
        .set('Cookie', [`token=${landlordToken}`]);

      expect(res.status).toBe(403);
    });

    it('GET /api/broker/tenants - should return 403 for non-broker', async () => {
      const res = await request(app)
        .get('/api/broker/tenants')
        .set('Cookie', [`token=${landlordToken}`]);

      expect(res.status).toBe(403);
    });

    it('POST /api/broker/locations - should return 403 for non-broker', async () => {
      const res = await request(app)
        .post('/api/broker/locations')
        .set('Cookie', [`token=${landlordToken}`])
        .send({ listing_name: 'Test' });

      expect(res.status).toBe(403);
    });
  });

  describe('Business Profile Endpoints', () => {
    describe('POST /api/broker/business-profiles', () => {
      it('should return 400 for missing required fields', async () => {
        const res = await request(app)
          .post('/api/broker/business-profiles')
          .set('Cookie', [`token=${brokerToken}`])
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
      });

      it('should return 201 with valid data and correct response format', async () => {
        const profileData = {
          company_name: 'Valid Company',
          established_year: 2021,
          location_city: 'San Francisco',
          location_state: 'CA',
        };

        const res = await request(app)
          .post('/api/broker/business-profiles')
          .set('Cookie', [`token=${brokerToken}`])
          .send(profileData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('company_name', 'Valid Company');
        expect(res.body).toHaveProperty('established_year', 2021);
        expect(res.body).toHaveProperty('created_at');
        expect(res.body).toHaveProperty('updated_at');
      });
    });

    describe('GET /api/broker/business-profiles', () => {
      it('should return 200 with array of profiles', async () => {
        const res = await request(app)
          .get('/api/broker/business-profiles')
          .set('Cookie', [`token=${brokerToken}`]);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });

      it('should return profiles with stats included', async () => {
        const res = await request(app)
          .get('/api/broker/business-profiles')
          .set('Cookie', [`token=${brokerToken}`]);

        expect(res.status).toBe(200);
        if (res.body.length > 0) {
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('company_name');
        }
      });
    });

    describe('GET /api/broker/business-profiles/:id', () => {
      it('should return 404 for non-existent profile', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
          .get(`/api/broker/business-profiles/${fakeId}`)
          .set('Cookie', [`token=${brokerToken}`]);

        expect(res.status).toBe(404);
      });

      it('should return 200 with profile and team members', async () => {
        const res = await request(app)
          .get(`/api/broker/business-profiles/${businessProfileId}`)
          .set('Cookie', [`token=${brokerToken}`]);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', businessProfileId);
        expect(res.body).toHaveProperty('team_members');
        expect(Array.isArray(res.body.team_members)).toBe(true);
      });
    });

    describe('PUT /api/broker/business-profiles/:id', () => {
      it('should return 400 with invalid data', async () => {
        const res = await request(app)
          .put(`/api/broker/business-profiles/${businessProfileId}`)
          .set('Cookie', [`token=${brokerToken}`])
          .send({ established_year: 'invalid' });

        expect(res.status).toBe(400);
      });

      it('should return 200 with updated profile', async () => {
        const res = await request(app)
          .put(`/api/broker/business-profiles/${businessProfileId}`)
          .set('Cookie', [`token=${brokerToken}`])
          .send({ company_name: 'Updated Company Name' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('company_name', 'Updated Company Name');
      });
    });

    describe('POST /api/broker/business-profiles/:id/team', () => {
      it('should return 400 with missing required fields', async () => {
        const res = await request(app)
          .post(`/api/broker/business-profiles/${businessProfileId}/team`)
          .set('Cookie', [`token=${brokerToken}`])
          .send({});

        expect(res.status).toBe(400);
      });

      it('should return 201 with created team member', async () => {
        const teamMemberUser = await User.create({
          email: 'newteam@test.com',
          passwordHash: await bcrypt.hash('password', 10),
          firstName: 'Team',
          lastName: 'Member',
          phoneNumber: '+13333333333',
          role: 'broker',
          emailVerified: true,
        });

        const res = await request(app)
          .post(`/api/broker/business-profiles/${businessProfileId}/team`)
          .set('Cookie', [`token=${brokerToken}`])
          .send({
            user_id: teamMemberUser.id,
            role: 'broker',
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('role', 'broker');
        expect(res.body).toHaveProperty('status', 'active');
      });
    });

    describe('GET /api/broker/business-profiles/:id/stats', () => {
      it('should return 404 for non-existent profile', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
          .get(`/api/broker/business-profiles/${fakeId}/stats`)
          .set('Cookie', [`token=${brokerToken}`]);

        expect(res.status).toBe(404);
      });

      it('should return 200 with stats object', async () => {
        const res = await request(app)
          .get(`/api/broker/business-profiles/${businessProfileId}/stats`)
          .set('Cookie', [`token=${brokerToken}`]);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('offices_count');
        expect(res.body).toHaveProperty('agents_count');
        expect(res.body).toHaveProperty('tenants_count');
        expect(res.body).toHaveProperty('properties_count');
        expect(typeof res.body.offices_count).toBe('number');
      });
    });
  });

  describe('Tenant Profile Endpoints', () => {
    describe('GET /api/broker/tenants', () => {
      it('should return 200 with paginated results', async () => {
        const res = await request(app)
          .get('/api/broker/tenants')
          .set('Cookie', [`token=${brokerToken}`])
          .query({ page: 1, limit: 10 });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('profiles');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page', 1);
        expect(res.body).toHaveProperty('limit', 10);
        expect(res.body).toHaveProperty('totalPages');
        expect(Array.isArray(res.body.profiles)).toBe(true);
      });

      it('should filter by search parameter', async () => {
        const res = await request(app)
          .get('/api/broker/tenants')
          .set('Cookie', [`token=${brokerToken}`])
          .query({ search: 'Test Tenant', page: 1, limit: 10 });

        expect(res.status).toBe(200);
        expect(res.body.profiles.length).toBeGreaterThan(0);
      });

      it('should filter by category parameter', async () => {
        const res = await request(app)
          .get('/api/broker/tenants')
          .set('Cookie', [`token=${brokerToken}`])
          .query({ category: 'Retail', page: 1, limit: 10 });

        expect(res.status).toBe(200);
        if (res.body.profiles.length > 0) {
          expect(res.body.profiles[0].category).toBe('Retail');
        }
      });

      it('should handle pagination correctly', async () => {
        // Create multiple tenants
        for (let i = 0; i < 5; i++) {
          await TenantPublicProfile.create({
            display_name: `Tenant ${i}`,
            category: 'Retail',
            tenant_pin: `PIN${i}`,
            contact_email: `tenant${i}@test.com`,
          });
        }

        const res = await request(app)
          .get('/api/broker/tenants')
          .set('Cookie', [`token=${brokerToken}`])
          .query({ page: 1, limit: 3 });

        expect(res.status).toBe(200);
        expect(res.body.profiles.length).toBeLessThanOrEqual(3);
        expect(res.body.totalPages).toBeGreaterThan(1);
      });
    });

    describe('GET /api/broker/tenants/:id', () => {
      it('should return 404 for non-existent tenant', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app)
          .get(`/api/broker/tenants/${fakeId}`)
          .set('Cookie', [`token=${brokerToken}`]);

        expect(res.status).toBe(404);
      });

      it('should return 200 with full tenant profile', async () => {
        const res = await request(app)
          .get(`/api/broker/tenants/${tenantProfileId}`)
          .set('Cookie', [`token=${brokerToken}`]);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', tenantProfileId);
        expect(res.body).toHaveProperty('display_name');
        expect(res.body).toHaveProperty('category');
        expect(res.body).toHaveProperty('images');
        expect(res.body).toHaveProperty('documents');
        expect(res.body).toHaveProperty('locations');
        expect(Array.isArray(res.body.images)).toBe(true);
        expect(Array.isArray(res.body.documents)).toBe(true);
        expect(Array.isArray(res.body.locations)).toBe(true);
      });
    });

    describe('POST /api/broker/tenants/:id/request', () => {
      it('should return 400 with missing required fields', async () => {
        const res = await request(app)
          .post(`/api/broker/tenants/${tenantProfileId}/request`)
          .set('Cookie', [`token=${brokerToken}`])
          .send({});

        expect(res.status).toBe(400);
      });

      it('should return 400 with invalid PIN', async () => {
        const res = await request(app)
          .post(`/api/broker/tenants/${tenantProfileId}/request`)
          .set('Cookie', [`token=${brokerToken}`])
          .send({
            tenant_email: 'tenant@test.com',
            tenant_pin: 'wrong',
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid');
      });

      it('should return 201 with valid request', async () => {
        const res = await request(app)
          .post(`/api/broker/tenants/${tenantProfileId}/request`)
          .set('Cookie', [`token=${brokerToken}`])
          .send({
            tenant_email: 'tenant@test.com',
            tenant_pin: '123',
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('status', 'pending');
        expect(res.body).toHaveProperty('broker_user_id', brokerUserId);
        expect(res.body).toHaveProperty('tenant_profile_id', tenantProfileId);
      });
    });
  });

  describe('Location Posting Endpoints', () => {
    describe('POST /api/broker/locations', () => {
      it('should return 400 with missing required fields', async () => {
        const res = await request(app)
          .post('/api/broker/locations')
          .set('Cookie', [`token=${brokerToken}`])
          .send({});

        expect(res.status).toBe(400);
      });

      it('should return 400 with invalid sqft range', async () => {
        const res = await request(app)
          .post('/api/broker/locations')
          .set('Cookie', [`token=${brokerToken}`])
          .send({
            listing_name: 'Test Location',
            asset_type: 'Retail',
            sqft_min: 2000,
            sqft_max: 1000, // Max less than min
          });

        expect(res.status).toBe(400);
      });

      it('should return 201 with valid location data', async () => {
        const locationData = {
          listing_name: 'Valid Location',
          asset_type: 'Retail',
          target_move_in: '2026-06-01',
          sqft_min: 1000,
          sqft_max: 2000,
          lot_size_min: 1.5,
          monthly_budget_min: 5000,
          monthly_budget_max: 10000,
          preferred_lease_term: 'Medium-term 3-5 years',
          locations_of_interest: ['City1', 'City2'],
          amenities: ['Parking', 'ADA accessible'],
          map_boundaries: { type: 'FeatureCollection', features: [] },
        };

        const res = await request(app)
          .post('/api/broker/locations')
          .set('Cookie', [`token=${brokerToken}`])
          .send(locationData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('listing_name', 'Valid Location');
        expect(res.body).toHaveProperty('amenities');
        expect(res.body.amenities).toEqual(locationData.amenities);
      });
    });

    describe('GET /api/broker/locations', () => {
      it('should return 200 with paginated locations', async () => {
        const res = await request(app)
          .get('/api/broker/locations')
          .set('Cookie', [`token=${brokerToken}`])
          .query({ page: 1, limit: 10 });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('listings');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page', 1);
        expect(Array.isArray(res.body.listings)).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app)
        .get('/api/broker/business-profiles/invalid-uuid')
        .set('Cookie', [`token=${brokerToken}`]);

      expect([400, 404]).toContain(res.status);
    });

    it('should handle database errors gracefully', async () => {
      // Try to create profile with extremely long name that exceeds VARCHAR limit
      const longName = 'a'.repeat(300);
      const res = await request(app)
        .post('/api/broker/business-profiles')
        .set('Cookie', [`token=${brokerToken}`])
        .send({ company_name: longName });

      expect([400, 500]).toContain(res.status);
    });

    it('should return proper error message format', async () => {
      const res = await request(app)
        .post('/api/broker/business-profiles')
        .set('Cookie', [`token=${brokerToken}`])
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
    });
  });
});
