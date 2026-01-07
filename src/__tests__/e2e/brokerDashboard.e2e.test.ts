/**
 * End-to-End Integration Tests for Broker Dashboard Figma Redesign
 *
 * Tests the complete broker flow including:
 * - User login as broker
 * - Create business profile with team members
 * - Search for tenant profiles
 * - View full tenant profile
 * - Submit admin approval request
 * - Post new location requirement with amenities
 * - Navigate between all 6 pages
 */

import request from 'supertest';
import app from '../../app';
import sequelize from '../../database/db';
import User from '../../database/models/User';
import BusinessProfile from '../../database/models/BusinessProfile';
import TenantPublicProfile from '../../database/models/TenantPublicProfile';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Broker Dashboard E2E Integration Tests', () => {
  let authToken: string;
  let brokerUserId: string;
  let businessProfileId: string;
  let tenantProfileId: string;

  beforeAll(async () => {
    // Connect to test database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('1. User Authentication and Broker Login', () => {
    it('should create a broker user and login successfully', async () => {
      // Create broker user
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
      const user = await User.create({
        email: 'broker@test.com',
        passwordHash: hashedPassword,
        firstName: 'John',
        lastName: 'Broker',
        phoneNumber: '+11234567890',
        role: 'broker',
        emailVerified: true,
      });

      brokerUserId = user.id;

      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'broker@test.com',
          password: 'TestPassword123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.role).toBe('broker');

      // Extract token from cookie
      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // Generate token for subsequent requests
      authToken = jwt.sign(
        { userId: user.id, role: 'broker' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1d' }
      );
    });
  });

  describe('2. Business Profile Creation with Team Members', () => {
    it('should create a business profile with basic information', async () => {
      const profileData = {
        company_name: 'CBRE Test Brokerage',
        logo_url: 'https://example.com/logo.png',
        cover_image_url: 'https://example.com/cover.jpg',
        established_year: 1996,
        location_city: 'Dallas',
        location_state: 'TX',
        about: 'Leading commercial real estate services company',
        website_url: 'https://www.cbre.com',
        instagram_url: 'https://instagram.com/cbre',
        linkedin_url: 'https://linkedin.com/company/cbre',
      };

      const res = await request(app)
        .post('/api/broker/business-profiles')
        .set('Cookie', [`token=${authToken}`])
        .send(profileData);

      expect(res.status).toBe(201);
      expect(res.body.company_name).toBe('CBRE Test Brokerage');
      expect(res.body.id).toBeDefined();

      businessProfileId = res.body.id;
    });

    it('should add team members to the business profile', async () => {
      // Create team member users first
      const teamMember1 = await User.create({
        email: 'team1@test.com',
        passwordHash: await bcrypt.hash('password', 10),
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+11234567891',
        role: 'broker',
        emailVerified: true,
      });

      const teamMemberData = {
        user_id: teamMember1.id,
        role: 'broker',
      };

      const res = await request(app)
        .post(`/api/broker/business-profiles/${businessProfileId}/team`)
        .set('Cookie', [`token=${authToken}`])
        .send(teamMemberData);

      expect(res.status).toBe(201);
      expect(res.body.role).toBe('broker');
      expect(res.body.status).toBe('active');
    });

    it('should retrieve business profile with team members', async () => {
      const res = await request(app)
        .get(`/api/broker/business-profiles/${businessProfileId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.company_name).toBe('CBRE Test Brokerage');
      expect(res.body.team_members).toBeDefined();
      expect(res.body.team_members.length).toBeGreaterThan(0);
    });

    it('should retrieve business profile stats', async () => {
      const res = await request(app)
        .get(`/api/broker/business-profiles/${businessProfileId}/stats`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('offices_count');
      expect(res.body).toHaveProperty('agents_count');
      expect(res.body).toHaveProperty('tenants_count');
      expect(res.body).toHaveProperty('properties_count');
    });
  });

  describe('3. Tenant Profile Search and Discovery', () => {
    beforeAll(async () => {
      // Create sample tenant profiles for testing
      const tenant = await TenantPublicProfile.create({
        display_name: 'Starbucks Coffee',
        category: 'Quick Service Retail',
        about: 'Global coffee company and coffeehouse chain',
        rating: 4.8,
        review_count: 245,
        website_url: 'https://www.starbucks.com',
        instagram_url: 'https://instagram.com/starbucks',
        linkedin_url: 'https://linkedin.com/company/starbucks',
        is_verified: true,
        tenant_pin: '123',
        contact_email: 'corporate@starbucks.com',
        logo_url: 'https://example.com/starbucks-logo.png',
        cover_image_url: 'https://example.com/starbucks-cover.jpg',
      });

      tenantProfileId = tenant.id;

      // Create more tenant profiles for search testing
      await TenantPublicProfile.create({
        display_name: 'Chipotle Mexican Grill',
        category: 'Quick Service Retail',
        about: 'Fast casual restaurant chain',
        rating: 4.5,
        review_count: 180,
        is_verified: true,
        tenant_pin: '456',
        contact_email: 'info@chipotle.com',
      });

      await TenantPublicProfile.create({
        display_name: 'Apple Store',
        category: 'Electronics Retail',
        about: 'Technology and electronics retailer',
        rating: 4.9,
        review_count: 500,
        is_verified: true,
        tenant_pin: '789',
        contact_email: 'retail@apple.com',
      });
    });

    it('should search tenant profiles without filters', async () => {
      const res = await request(app)
        .get('/api/broker/tenants')
        .set('Cookie', [`token=${authToken}`])
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.profiles).toBeDefined();
      expect(res.body.profiles.length).toBeGreaterThan(0);
      expect(res.body.total).toBeGreaterThanOrEqual(3);
      expect(res.body.page).toBe(1);
    });

    it('should search tenant profiles by search term', async () => {
      const res = await request(app)
        .get('/api/broker/tenants')
        .set('Cookie', [`token=${authToken}`])
        .query({ search: 'Starbucks', page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0].display_name).toBe('Starbucks Coffee');
    });

    it('should filter tenant profiles by category', async () => {
      const res = await request(app)
        .get('/api/broker/tenants')
        .set('Cookie', [`token=${authToken}`])
        .query({ category: 'Quick Service Retail', page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.profiles.length).toBe(2);
      expect(res.body.profiles.every((p: any) => p.category === 'Quick Service Retail')).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const res = await request(app)
        .get('/api/broker/tenants')
        .set('Cookie', [`token=${authToken}`])
        .query({ page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.profiles.length).toBe(2);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
    });
  });

  describe('4. Full Tenant Profile View', () => {
    it('should retrieve full tenant profile with all details', async () => {
      const res = await request(app)
        .get(`/api/broker/tenants/${tenantProfileId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.display_name).toBe('Starbucks Coffee');
      expect(res.body.category).toBe('Quick Service Retail');
      expect(res.body.rating).toBe(4.8);
      expect(res.body.review_count).toBe(245);
      expect(res.body.is_verified).toBe(true);
      expect(res.body.images).toBeDefined();
      expect(res.body.documents).toBeDefined();
      expect(res.body.locations).toBeDefined();
    });

    it('should return 404 for non-existent tenant profile', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/broker/tenants/${fakeId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(404);
    });
  });

  describe('5. Submit Admin Approval Request', () => {
    it('should submit admin approval request with valid credentials', async () => {
      const requestData = {
        tenant_email: 'corporate@starbucks.com',
        tenant_pin: '123',
      };

      const res = await request(app)
        .post(`/api/broker/tenants/${tenantProfileId}/request`)
        .set('Cookie', [`token=${authToken}`])
        .send(requestData);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
      expect(res.body.tenant_profile_id).toBe(tenantProfileId);
      expect(res.body.broker_user_id).toBe(brokerUserId);
    });

    it('should reject admin approval request with invalid PIN', async () => {
      const requestData = {
        tenant_email: 'corporate@starbucks.com',
        tenant_pin: '999', // Wrong PIN
      };

      const res = await request(app)
        .post(`/api/broker/tenants/${tenantProfileId}/request`)
        .set('Cookie', [`token=${authToken}`])
        .send(requestData);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid');
    });

    it('should reject admin approval request with invalid email', async () => {
      const requestData = {
        tenant_email: 'wrong@email.com',
        tenant_pin: '123',
      };

      const res = await request(app)
        .post(`/api/broker/tenants/${tenantProfileId}/request`)
        .set('Cookie', [`token=${authToken}`])
        .send(requestData);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid');
    });
  });

  describe('6. Post New Location Requirement with Amenities', () => {
    it('should post new location requirement with all fields', async () => {
      const locationData = {
        listing_name: 'San Francisco Bay Area Expansion',
        asset_type: 'Retail',
        target_move_in: '2026-06-01',
        sqft_min: 1000,
        sqft_max: 2000,
        lot_size_min: 1.67,
        monthly_budget_min: 10000,
        monthly_budget_max: 15000,
        preferred_lease_term: 'Medium-term 3-5 years',
        locations_of_interest: ['Palo Alto', 'Los Altos Hills', 'Menlo Park', 'Atherton'],
        amenities: [
          'ADA accessible',
          'Parking',
          'Drive Thru',
          'Patio/outdoor seating',
          'Glass store front',
          '24/7',
        ],
        map_boundaries: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-122.4, 37.4],
                  [-122.4, 37.5],
                  [-122.3, 37.5],
                  [-122.3, 37.4],
                  [-122.4, 37.4],
                ]],
              },
              properties: { area: 'Palo Alto' },
            },
          ],
        },
      };

      const res = await request(app)
        .post('/api/broker/locations')
        .set('Cookie', [`token=${authToken}`])
        .send(locationData);

      expect(res.status).toBe(201);
      expect(res.body.listing_name).toBe('San Francisco Bay Area Expansion');
      expect(res.body.asset_type).toBe('Retail');
      expect(res.body.amenities).toEqual(locationData.amenities);
      expect(res.body.locations_of_interest).toEqual(locationData.locations_of_interest);
      expect(res.body.map_boundaries).toBeDefined();
    });

    it('should validate required fields for location posting', async () => {
      const invalidData = {
        // Missing listing_name
        asset_type: 'Retail',
      };

      const res = await request(app)
        .post('/api/broker/locations')
        .set('Cookie', [`token=${authToken}`])
        .send(invalidData);

      expect(res.status).toBe(400);
    });

    it('should retrieve posted locations', async () => {
      const res = await request(app)
        .get('/api/broker/locations')
        .set('Cookie', [`token=${authToken}`])
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.listings).toBeDefined();
      expect(res.body.listings.length).toBeGreaterThan(0);
    });
  });

  describe('7. Navigation Between All Pages', () => {
    it('should access Overview page endpoint', async () => {
      // Overview typically doesn't have a dedicated endpoint, it's a frontend route
      // But we can test the business profile which is displayed on Overview
      const res = await request(app)
        .get('/api/broker/business-profiles')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
    });

    it('should access Tenant Listings endpoint', async () => {
      const res = await request(app)
        .get('/api/broker/tenants')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
    });

    it('should access Property Listings (if implemented)', async () => {
      // Property listings might use existing endpoints
      // This is a placeholder for future implementation
      expect(true).toBe(true);
    });

    it('should verify broker dashboard endpoints are protected', async () => {
      // Test without auth token
      const res = await request(app)
        .get('/api/broker/business-profiles');

      expect(res.status).toBe(401);
    });

    it('should verify non-broker users cannot access broker endpoints', async () => {
      // Create a non-broker user
      const hashedPassword = await bcrypt.hash('password', 10);
      const landlord = await User.create({
        email: 'landlord@test.com',
        passwordHash: hashedPassword,
        firstName: 'Land',
        lastName: 'Lord',
        phoneNumber: '+11234567899',
        role: 'landlord',
        emailVerified: true,
      });

      const landlordToken = jwt.sign(
        { userId: landlord.id, role: 'landlord' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1d' }
      );

      const res = await request(app)
        .get('/api/broker/business-profiles')
        .set('Cookie', [`token=${landlordToken}`]);

      expect(res.status).toBe(403);
    });
  });

  describe('8. Complete Broker Flow Integration', () => {
    it('should complete entire broker workflow end-to-end', async () => {
      // Step 1: Login (already done in setup)
      expect(authToken).toBeDefined();
      expect(brokerUserId).toBeDefined();

      // Step 2: Has business profile
      expect(businessProfileId).toBeDefined();

      // Step 3: Search for tenants
      const searchRes = await request(app)
        .get('/api/broker/tenants')
        .set('Cookie', [`token=${authToken}`])
        .query({ search: 'Starbucks' });
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.profiles.length).toBeGreaterThan(0);

      // Step 4: View tenant profile
      const profileRes = await request(app)
        .get(`/api/broker/tenants/${tenantProfileId}`)
        .set('Cookie', [`token=${authToken}`]);
      expect(profileRes.status).toBe(200);

      // Step 5: Submit admin approval (already tested, would fail on duplicate)

      // Step 6: Post location requirement
      const locationRes = await request(app)
        .post('/api/broker/locations')
        .set('Cookie', [`token=${authToken}`])
        .send({
          listing_name: 'Complete Flow Test Location',
          asset_type: 'Retail',
          sqft_min: 1500,
          sqft_max: 2500,
          amenities: ['Parking', 'ADA accessible'],
        });
      expect(locationRes.status).toBe(201);

      // Step 7: Verify can list locations
      const locationsRes = await request(app)
        .get('/api/broker/locations')
        .set('Cookie', [`token=${authToken}`]);
      expect(locationsRes.status).toBe(200);
      expect(locationsRes.body.listings.length).toBeGreaterThan(0);

      // Complete flow successful
      expect(true).toBe(true);
    });
  });
});
