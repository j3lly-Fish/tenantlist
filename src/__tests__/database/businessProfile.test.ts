import { Pool } from 'pg';
import { BusinessProfileModel } from '../../database/models/BusinessProfile';
import { BusinessTeamMemberModel } from '../../database/models/BusinessTeamMember';
import { TenantPublicProfileModel } from '../../database/models/TenantPublicProfile';
import { BrokerTenantRequestModel } from '../../database/models/BrokerTenantRequest';
import { BusinessProfileStatsModel } from '../../database/models/BusinessProfileStats';
import { TenantProfileImageModel } from '../../database/models/TenantProfileImage';
import { TenantProfileDocumentModel } from '../../database/models/TenantProfileDocument';
import { TenantLocationModel } from '../../database/models/TenantLocation';

/**
 * Database layer tests for Broker Dashboard Figma Redesign
 * Testing critical behaviors only as specified in Task Group 1.1
 */
describe('Business Profile Database Layer', () => {
  let pool: Pool;
  let businessProfileModel: BusinessProfileModel;
  let teamMemberModel: BusinessTeamMemberModel;
  let tenantProfileModel: TenantPublicProfileModel;
  let brokerRequestModel: BrokerTenantRequestModel;
  let statsModel: BusinessProfileStatsModel;

  let testUserId: string;
  let testBusinessProfileId: string;

  beforeAll(async () => {
    // Note: Tests should use a test database instance
    // This is a placeholder - actual test pool setup needed
    pool = new Pool({
      connectionString: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    });

    businessProfileModel = new BusinessProfileModel(pool);
    teamMemberModel = new BusinessTeamMemberModel(pool);
    tenantProfileModel = new TenantPublicProfileModel(pool);
    brokerRequestModel = new BrokerTenantRequestModel(pool);
    statsModel = new BusinessProfileStatsModel(pool);

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (id, email, first_name, last_name, role, password_hash)
       VALUES (gen_random_uuid(), 'testbroker@test.com', 'Test', 'Broker', 'BROKER', 'hashed')
       RETURNING id`
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testBusinessProfileId) {
      await businessProfileModel.delete(testBusinessProfileId);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  /**
   * Test 1: Business profile creation with stats initialization
   */
  test('should create business profile and auto-initialize stats via trigger', async () => {
    const profile = await businessProfileModel.create({
      created_by_user_id: testUserId,
      company_name: 'Test Brokerage',
      established_year: 2020,
      location_city: 'Dallas',
      location_state: 'TX',
    });

    expect(profile).toBeDefined();
    expect(profile.company_name).toBe('Test Brokerage');
    expect(profile.is_verified).toBe(false);

    testBusinessProfileId = profile.id;

    // Verify stats row was auto-created by trigger
    const stats = await statsModel.findByBusinessProfileId(profile.id);
    expect(stats).toBeDefined();
    expect(stats?.offices_count).toBe(0);
    expect(stats?.agents_count).toBe(0);
    expect(stats?.tenants_count).toBe(0);
    expect(stats?.properties_count).toBe(0);
  });

  /**
   * Test 2: Team member uniqueness constraint
   */
  test('should enforce unique constraint on business_profile_id and user_id', async () => {
    // Add team member once
    const member = await teamMemberModel.create({
      business_profile_id: testBusinessProfileId,
      user_id: testUserId,
      role: 'admin',
      status: 'active',
    });

    expect(member).toBeDefined();

    // Attempt to add same user to same business profile again
    await expect(
      teamMemberModel.create({
        business_profile_id: testBusinessProfileId,
        user_id: testUserId,
        role: 'broker',
      })
    ).rejects.toThrow();

    // Cleanup
    await teamMemberModel.delete(member.id);
  });

  /**
   * Test 3: Tenant public profile PIN validation
   */
  test('should create tenant profile with unique PIN', async () => {
    const profile1 = await tenantProfileModel.create({
      display_name: 'Starbucks Coffee',
      category: 'Quick Service Retail',
      tenant_pin: '123456',
    });

    expect(profile1).toBeDefined();
    expect(profile1.tenant_pin).toBe('123456');

    // Attempt to create another profile with same PIN
    await expect(
      tenantProfileModel.create({
        display_name: 'Another Tenant',
        tenant_pin: '123456', // Duplicate PIN
      })
    ).rejects.toThrow();

    // Verify PIN lookup works
    const foundProfile = await tenantProfileModel.findByTenantPin('123456');
    expect(foundProfile?.id).toBe(profile1.id);

    // Cleanup
    await tenantProfileModel.delete(profile1.id);
  });

  /**
   * Test 4: Cascade delete for profile images
   */
  test('should cascade delete tenant profile images when profile is deleted', async () => {
    const imageModel = new TenantProfileImageModel(pool);

    // Create tenant profile
    const profile = await tenantProfileModel.create({
      display_name: 'Test Tenant',
      category: 'Retail',
    });

    // Add images
    const image1 = await imageModel.create({
      tenant_profile_id: profile.id,
      image_url: 'https://example.com/image1.jpg',
      display_order: 0,
    });

    const image2 = await imageModel.create({
      tenant_profile_id: profile.id,
      image_url: 'https://example.com/image2.jpg',
      display_order: 1,
    });

    // Verify images exist
    let images = await imageModel.findByTenantProfileId(profile.id);
    expect(images.length).toBe(2);

    // Delete profile
    await tenantProfileModel.delete(profile.id);

    // Verify images were cascaded deleted
    images = await imageModel.findByTenantProfileId(profile.id);
    expect(images.length).toBe(0);
  });

  /**
   * Test 5: Cascade delete for profile documents
   */
  test('should cascade delete tenant profile documents when profile is deleted', async () => {
    const documentModel = new TenantProfileDocumentModel(pool);

    // Create tenant profile
    const profile = await tenantProfileModel.create({
      display_name: 'Test Tenant Docs',
      category: 'Office',
    });

    // Add documents
    const doc1 = await documentModel.create({
      tenant_profile_id: profile.id,
      document_name: 'Floor Plan.pdf',
      document_url: 'https://example.com/floorplan.pdf',
      document_type: 'pdf',
    });

    // Verify document exists
    let docs = await documentModel.findByTenantProfileId(profile.id);
    expect(docs.length).toBe(1);

    // Delete profile
    await tenantProfileModel.delete(profile.id);

    // Verify documents were cascaded deleted
    docs = await documentModel.findByTenantProfileId(profile.id);
    expect(docs.length).toBe(0);
  });

  /**
   * Test 6: Cascade delete for tenant locations
   */
  test('should cascade delete tenant locations when profile is deleted', async () => {
    const locationModel = new TenantLocationModel(pool);

    // Create tenant profile
    const profile = await tenantProfileModel.create({
      display_name: 'Test Tenant Locations',
      category: 'Retail',
    });

    // Add location
    const location = await locationModel.create({
      tenant_profile_id: profile.id,
      location_name: 'Dallas Market',
      city: 'Dallas',
      state: 'TX',
      asset_type: 'Retail',
      sqft_min: 1000,
      sqft_max: 2000,
    });

    // Verify location exists
    let locations = await locationModel.findByTenantProfileId(profile.id);
    expect(locations.length).toBe(1);

    // Delete profile
    await tenantProfileModel.delete(profile.id);

    // Verify locations were cascaded deleted
    locations = await locationModel.findByTenantProfileId(profile.id);
    expect(locations.length).toBe(0);
  });

  /**
   * Test 7: Broker tenant request status workflow
   */
  test('should manage broker tenant request status workflow', async () => {
    // Create tenant profile
    const tenantProfile = await tenantProfileModel.create({
      display_name: 'Enterprise Tenant',
      category: 'Office',
      tenant_pin: '999888',
      contact_email: 'contact@enterprise.com',
    });

    // Create approval request
    const request = await brokerRequestModel.create({
      broker_user_id: testUserId,
      business_profile_id: testBusinessProfileId,
      tenant_profile_id: tenantProfile.id,
      tenant_email: 'contact@enterprise.com',
      tenant_pin: '999888',
    });

    expect(request.status).toBe('pending');
    expect(request.reviewed_at).toBeNull();

    // Approve request
    const approvedRequest = await brokerRequestModel.approve(request.id, testUserId);
    expect(approvedRequest?.status).toBe('approved');
    expect(approvedRequest?.reviewed_at).toBeDefined();
    expect(approvedRequest?.reviewed_by).toBe(testUserId);

    // Cleanup
    await brokerRequestModel.findById(request.id); // Verify it exists before delete
    await tenantProfileModel.delete(tenantProfile.id);
  });

  /**
   * Test 8: Business profile stats model validation
   */
  test('should validate business profile stats associations work', async () => {
    // Stats should already exist from Test 1
    const stats = await statsModel.findByBusinessProfileId(testBusinessProfileId);
    expect(stats).toBeDefined();

    // Increment agents count
    const updated = await statsModel.increment(testBusinessProfileId, 'agents_count', 2);
    expect(updated?.agents_count).toBe(2);

    // Decrement agents count
    const decremented = await statsModel.decrement(testBusinessProfileId, 'agents_count', 1);
    expect(decremented?.agents_count).toBe(1);

    // Verify cannot decrement below 0
    const decremented2 = await statsModel.decrement(testBusinessProfileId, 'agents_count', 5);
    expect(decremented2?.agents_count).toBe(0);
  });
});
