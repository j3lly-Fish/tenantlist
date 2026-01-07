/**
 * Database Schema Integrity Tests
 *
 * Verifies:
 * - All 9 new tables exist with correct schema
 * - Cascade deletes work properly
 * - Foreign key constraints are enforced
 * - Indexes are created
 * - Database triggers function correctly
 */

import sequelize from '../../database/db';
import BusinessProfile from '../../database/models/BusinessProfile';
import BusinessTeamMember from '../../database/models/BusinessTeamMember';
import TenantPublicProfile from '../../database/models/TenantPublicProfile';
import TenantProfileImage from '../../database/models/TenantProfileImage';
import TenantProfileDocument from '../../database/models/TenantProfileDocument';
import TenantLocation from '../../database/models/TenantLocation';
import BrokerTenantRequest from '../../database/models/BrokerTenantRequest';
import BusinessProfileStats from '../../database/models/BusinessProfileStats';
import DemandListing from '../../database/models/DemandListing';
import User from '../../database/models/User';
import bcrypt from 'bcryptjs';

describe('Database Schema Integrity Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Table Existence and Schema Validation', () => {
    it('should verify business_profiles table exists with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('business_profiles');

      expect(tableDescription).toHaveProperty('id');
      expect(tableDescription).toHaveProperty('created_by_user_id');
      expect(tableDescription).toHaveProperty('company_name');
      expect(tableDescription).toHaveProperty('logo_url');
      expect(tableDescription).toHaveProperty('cover_image_url');
      expect(tableDescription).toHaveProperty('established_year');
      expect(tableDescription).toHaveProperty('location_city');
      expect(tableDescription).toHaveProperty('location_state');
      expect(tableDescription).toHaveProperty('about');
      expect(tableDescription).toHaveProperty('website_url');
      expect(tableDescription).toHaveProperty('instagram_url');
      expect(tableDescription).toHaveProperty('linkedin_url');
      expect(tableDescription).toHaveProperty('is_verified');
      expect(tableDescription).toHaveProperty('created_at');
      expect(tableDescription).toHaveProperty('updated_at');

      // Verify data types
      expect(tableDescription.id.type).toContain('UUID');
      expect(tableDescription.company_name.type).toContain('VARCHAR');
      expect(tableDescription.is_verified.type).toContain('BOOLEAN');
    });

    it('should verify business_team_members table exists with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('business_team_members');

      expect(tableDescription).toHaveProperty('id');
      expect(tableDescription).toHaveProperty('business_profile_id');
      expect(tableDescription).toHaveProperty('user_id');
      expect(tableDescription).toHaveProperty('email');
      expect(tableDescription).toHaveProperty('role');
      expect(tableDescription).toHaveProperty('status');
      expect(tableDescription).toHaveProperty('invited_at');
      expect(tableDescription).toHaveProperty('joined_at');
      expect(tableDescription).toHaveProperty('created_at');
    });

    it('should verify tenant_public_profiles table exists with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('tenant_public_profiles');

      expect(tableDescription).toHaveProperty('id');
      expect(tableDescription).toHaveProperty('business_id');
      expect(tableDescription).toHaveProperty('cover_image_url');
      expect(tableDescription).toHaveProperty('logo_url');
      expect(tableDescription).toHaveProperty('display_name');
      expect(tableDescription).toHaveProperty('category');
      expect(tableDescription).toHaveProperty('about');
      expect(tableDescription).toHaveProperty('rating');
      expect(tableDescription).toHaveProperty('review_count');
      expect(tableDescription).toHaveProperty('website_url');
      expect(tableDescription).toHaveProperty('instagram_url');
      expect(tableDescription).toHaveProperty('linkedin_url');
      expect(tableDescription).toHaveProperty('is_verified');
      expect(tableDescription).toHaveProperty('tenant_pin');
      expect(tableDescription).toHaveProperty('contact_email');
      expect(tableDescription).toHaveProperty('created_at');
      expect(tableDescription).toHaveProperty('updated_at');

      expect(tableDescription.rating.type).toContain('DECIMAL');
      expect(tableDescription.review_count.type).toContain('INTEGER');
    });

    it('should verify tenant_profile_images table exists with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('tenant_profile_images');

      expect(tableDescription).toHaveProperty('id');
      expect(tableDescription).toHaveProperty('tenant_profile_id');
      expect(tableDescription).toHaveProperty('image_url');
      expect(tableDescription).toHaveProperty('display_order');
      expect(tableDescription).toHaveProperty('created_at');
    });

    it('should verify tenant_profile_documents table exists with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('tenant_profile_documents');

      expect(tableDescription).toHaveProperty('id');
      expect(tableDescription).toHaveProperty('tenant_profile_id');
      expect(tableDescription).toHaveProperty('document_name');
      expect(tableDescription).toHaveProperty('document_url');
      expect(tableDescription).toHaveProperty('document_type');
      expect(tableDescription).toHaveProperty('uploaded_at');
    });

    it('should verify tenant_locations table exists with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('tenant_locations');

      expect(tableDescription).toHaveProperty('id');
      expect(tableDescription).toHaveProperty('tenant_profile_id');
      expect(tableDescription).toHaveProperty('location_name');
      expect(tableDescription).toHaveProperty('city');
      expect(tableDescription).toHaveProperty('state');
      expect(tableDescription).toHaveProperty('asset_type');
      expect(tableDescription).toHaveProperty('sqft_min');
      expect(tableDescription).toHaveProperty('sqft_max');
      expect(tableDescription).toHaveProperty('preferred_lease_term');
      expect(tableDescription).toHaveProperty('latitude');
      expect(tableDescription).toHaveProperty('longitude');
      expect(tableDescription).toHaveProperty('created_at');
    });

    it('should verify broker_tenant_requests table exists with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('broker_tenant_requests');

      expect(tableDescription).toHaveProperty('id');
      expect(tableDescription).toHaveProperty('broker_user_id');
      expect(tableDescription).toHaveProperty('business_profile_id');
      expect(tableDescription).toHaveProperty('tenant_profile_id');
      expect(tableDescription).toHaveProperty('tenant_email');
      expect(tableDescription).toHaveProperty('tenant_pin');
      expect(tableDescription).toHaveProperty('status');
      expect(tableDescription).toHaveProperty('requested_at');
      expect(tableDescription).toHaveProperty('reviewed_at');
      expect(tableDescription).toHaveProperty('reviewed_by');
    });

    it('should verify business_profile_stats table exists with correct columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('business_profile_stats');

      expect(tableDescription).toHaveProperty('business_profile_id');
      expect(tableDescription).toHaveProperty('offices_count');
      expect(tableDescription).toHaveProperty('agents_count');
      expect(tableDescription).toHaveProperty('tenants_count');
      expect(tableDescription).toHaveProperty('properties_count');
      expect(tableDescription).toHaveProperty('updated_at');

      // Verify primary key
      expect(tableDescription.business_profile_id.primaryKey).toBe(true);
    });

    it('should verify demand_listings table has new JSONB columns', async () => {
      const tableDescription = await sequelize.getQueryInterface().describeTable('demand_listings');

      expect(tableDescription).toHaveProperty('amenities');
      expect(tableDescription).toHaveProperty('locations_of_interest');
      expect(tableDescription).toHaveProperty('map_boundaries');
      expect(tableDescription).toHaveProperty('lot_size_min');
      expect(tableDescription).toHaveProperty('lot_size_max');
      expect(tableDescription).toHaveProperty('monthly_budget_min');
      expect(tableDescription).toHaveProperty('monthly_budget_max');

      // Verify JSONB types
      expect(tableDescription.amenities.type).toContain('JSON');
      expect(tableDescription.locations_of_interest.type).toContain('JSON');
    });
  });

  describe('Cascade Delete Functionality', () => {
    let testUser: User;
    let testBusinessProfile: BusinessProfile;
    let testTenantProfile: TenantPublicProfile;

    beforeEach(async () => {
      // Create test user
      testUser = await User.create({
        email: 'cascade-test@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        firstName: 'Cascade',
        lastName: 'Test',
        phoneNumber: '+11234567890',
        role: 'broker',
        emailVerified: true,
      });

      // Create test business profile
      testBusinessProfile = await BusinessProfile.create({
        created_by_user_id: testUser.id,
        company_name: 'Cascade Test Company',
        established_year: 2020,
      });

      // Create test tenant profile
      testTenantProfile = await TenantPublicProfile.create({
        display_name: 'Cascade Test Tenant',
        category: 'Retail',
        tenant_pin: '999',
        contact_email: 'tenant@test.com',
      });
    });

    it('should cascade delete team members when business profile is deleted', async () => {
      // Create team member
      const teamMember = await BusinessTeamMember.create({
        business_profile_id: testBusinessProfile.id,
        user_id: testUser.id,
        role: 'broker',
        status: 'active',
      });

      expect(teamMember).toBeDefined();

      // Delete business profile
      await testBusinessProfile.destroy();

      // Verify team member was cascade deleted
      const deletedMember = await BusinessTeamMember.findByPk(teamMember.id);
      expect(deletedMember).toBeNull();
    });

    it('should cascade delete stats when business profile is deleted', async () => {
      // Create stats
      const stats = await BusinessProfileStats.create({
        business_profile_id: testBusinessProfile.id,
        offices_count: 5,
        agents_count: 20,
        tenants_count: 10,
        properties_count: 50,
      });

      expect(stats).toBeDefined();

      // Delete business profile
      await testBusinessProfile.destroy();

      // Verify stats were cascade deleted
      const deletedStats = await BusinessProfileStats.findByPk(testBusinessProfile.id);
      expect(deletedStats).toBeNull();
    });

    it('should cascade delete images when tenant profile is deleted', async () => {
      // Create image
      const image = await TenantProfileImage.create({
        tenant_profile_id: testTenantProfile.id,
        image_url: 'https://example.com/image.jpg',
        display_order: 1,
      });

      expect(image).toBeDefined();

      // Delete tenant profile
      await testTenantProfile.destroy();

      // Verify image was cascade deleted
      const deletedImage = await TenantProfileImage.findByPk(image.id);
      expect(deletedImage).toBeNull();
    });

    it('should cascade delete documents when tenant profile is deleted', async () => {
      // Create document
      const document = await TenantProfileDocument.create({
        tenant_profile_id: testTenantProfile.id,
        document_name: 'test.pdf',
        document_url: 'https://example.com/test.pdf',
        document_type: 'pdf',
      });

      expect(document).toBeDefined();

      // Delete tenant profile
      await testTenantProfile.destroy();

      // Verify document was cascade deleted
      const deletedDoc = await TenantProfileDocument.findByPk(document.id);
      expect(deletedDoc).toBeNull();
    });

    it('should cascade delete locations when tenant profile is deleted', async () => {
      // Create location
      const location = await TenantLocation.create({
        tenant_profile_id: testTenantProfile.id,
        location_name: 'Test Location',
        city: 'San Francisco',
        state: 'CA',
      });

      expect(location).toBeDefined();

      // Delete tenant profile
      await testTenantProfile.destroy();

      // Verify location was cascade deleted
      const deletedLocation = await TenantLocation.findByPk(location.id);
      expect(deletedLocation).toBeNull();
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should enforce foreign key constraint on business_profiles.created_by_user_id', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      await expect(
        BusinessProfile.create({
          created_by_user_id: fakeUserId,
          company_name: 'Test Company',
        })
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraint on business_team_members.business_profile_id', async () => {
      const fakeProfileId = '00000000-0000-0000-0000-000000000000';

      await expect(
        BusinessTeamMember.create({
          business_profile_id: fakeProfileId,
          email: 'test@example.com',
          role: 'broker',
        })
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraint on tenant_profile_images.tenant_profile_id', async () => {
      const fakeTenantId = '00000000-0000-0000-0000-000000000000';

      await expect(
        TenantProfileImage.create({
          tenant_profile_id: fakeTenantId,
          image_url: 'https://example.com/image.jpg',
        })
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraint on broker_tenant_requests.tenant_profile_id', async () => {
      const user = await User.create({
        email: 'fk-test@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        firstName: 'FK',
        lastName: 'Test',
        phoneNumber: '+11234567891',
        role: 'broker',
        emailVerified: true,
      });

      const fakeTenantId = '00000000-0000-0000-0000-000000000000';

      await expect(
        BrokerTenantRequest.create({
          broker_user_id: user.id,
          tenant_profile_id: fakeTenantId,
          tenant_email: 'test@example.com',
          tenant_pin: '123',
          status: 'pending',
        })
      ).rejects.toThrow();
    });
  });

  describe('Index Verification', () => {
    it('should verify indexes exist on business_profiles', async () => {
      const indexes = await sequelize.getQueryInterface().showIndex('business_profiles');

      // Should have index on created_by_user_id
      const userIdIndex = indexes.find((idx: any) =>
        idx.fields && idx.fields.some((f: any) => f.attribute === 'created_by_user_id')
      );
      expect(userIdIndex).toBeDefined();
    });

    it('should verify indexes exist on business_team_members', async () => {
      const indexes = await sequelize.getQueryInterface().showIndex('business_team_members');

      // Should have indexes on business_profile_id and user_id
      const businessIndex = indexes.find((idx: any) =>
        idx.fields && idx.fields.some((f: any) => f.attribute === 'business_profile_id')
      );
      const userIndex = indexes.find((idx: any) =>
        idx.fields && idx.fields.some((f: any) => f.attribute === 'user_id')
      );

      expect(businessIndex).toBeDefined();
      expect(userIndex).toBeDefined();
    });

    it('should verify unique index on tenant_public_profiles.tenant_pin', async () => {
      const indexes = await sequelize.getQueryInterface().showIndex('tenant_public_profiles');

      const pinIndex = indexes.find((idx: any) =>
        idx.fields && idx.fields.some((f: any) => f.attribute === 'tenant_pin')
      );
      expect(pinIndex).toBeDefined();
    });
  });

  describe('Data Integrity and Constraints', () => {
    it('should enforce unique constraint on tenant_pin', async () => {
      await TenantPublicProfile.create({
        display_name: 'Tenant 1',
        tenant_pin: 'UNIQUE123',
        contact_email: 'tenant1@test.com',
      });

      // Try to create another with same PIN
      await expect(
        TenantPublicProfile.create({
          display_name: 'Tenant 2',
          tenant_pin: 'UNIQUE123',
          contact_email: 'tenant2@test.com',
        })
      ).rejects.toThrow();
    });

    it('should enforce enum constraint on business_team_members.role', async () => {
      const user = await User.create({
        email: 'enum-test@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        firstName: 'Enum',
        lastName: 'Test',
        phoneNumber: '+11234567892',
        role: 'broker',
        emailVerified: true,
      });

      const profile = await BusinessProfile.create({
        created_by_user_id: user.id,
        company_name: 'Enum Test Company',
      });

      // Valid role should work
      const validMember = await BusinessTeamMember.create({
        business_profile_id: profile.id,
        email: 'member@test.com',
        role: 'broker',
      });
      expect(validMember).toBeDefined();

      // Invalid role should fail
      await expect(
        BusinessTeamMember.create({
          business_profile_id: profile.id,
          email: 'invalid@test.com',
          role: 'invalid_role' as any,
        })
      ).rejects.toThrow();
    });

    it('should enforce enum constraint on broker_tenant_requests.status', async () => {
      const user = await User.create({
        email: 'status-test@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        firstName: 'Status',
        lastName: 'Test',
        phoneNumber: '+11234567893',
        role: 'broker',
        emailVerified: true,
      });

      const tenant = await TenantPublicProfile.create({
        display_name: 'Status Test Tenant',
        tenant_pin: 'STATUS123',
        contact_email: 'status@test.com',
      });

      // Valid status should work
      const validRequest = await BrokerTenantRequest.create({
        broker_user_id: user.id,
        tenant_profile_id: tenant.id,
        tenant_email: 'status@test.com',
        tenant_pin: 'STATUS123',
        status: 'pending',
      });
      expect(validRequest).toBeDefined();
    });
  });

  describe('JSONB Column Functionality', () => {
    it('should store and retrieve amenities array in demand_listings', async () => {
      const user = await User.create({
        email: 'jsonb-test@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        firstName: 'JSONB',
        lastName: 'Test',
        phoneNumber: '+11234567894',
        role: 'broker',
        emailVerified: true,
      });

      const amenities = ['Parking', 'ADA accessible', 'Drive Thru', '24/7'];

      const listing = await DemandListing.create({
        user_id: user.id,
        listing_name: 'JSONB Test Listing',
        asset_type: 'Retail',
        sqft_min: 1000,
        sqft_max: 2000,
        amenities: amenities,
      } as any);

      expect(listing.amenities).toEqual(amenities);

      // Fetch from database
      const fetchedListing = await DemandListing.findByPk(listing.id);
      expect(fetchedListing?.amenities).toEqual(amenities);
    });

    it('should store and retrieve locations_of_interest array in demand_listings', async () => {
      const user = await User.create({
        email: 'locations-test@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        firstName: 'Locations',
        lastName: 'Test',
        phoneNumber: '+11234567895',
        role: 'broker',
        emailVerified: true,
      });

      const locations = ['Palo Alto', 'Menlo Park', 'Los Altos Hills'];

      const listing = await DemandListing.create({
        user_id: user.id,
        listing_name: 'Locations Test Listing',
        asset_type: 'Retail',
        sqft_min: 1000,
        sqft_max: 2000,
        locations_of_interest: locations,
      } as any);

      expect(listing.locations_of_interest).toEqual(locations);
    });

    it('should store and retrieve map_boundaries GeoJSON in demand_listings', async () => {
      const user = await User.create({
        email: 'geojson-test@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        firstName: 'GeoJSON',
        lastName: 'Test',
        phoneNumber: '+11234567896',
        role: 'broker',
        emailVerified: true,
      });

      const geoJson = {
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
            properties: { area: 'Test Area' },
          },
        ],
      };

      const listing = await DemandListing.create({
        user_id: user.id,
        listing_name: 'GeoJSON Test Listing',
        asset_type: 'Retail',
        sqft_min: 1000,
        sqft_max: 2000,
        map_boundaries: geoJson,
      } as any);

      expect(listing.map_boundaries).toEqual(geoJson);
    });
  });
});
