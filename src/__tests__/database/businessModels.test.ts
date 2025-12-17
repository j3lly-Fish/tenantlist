import { Pool } from 'pg';
import pool from '../../config/database';
import { BusinessModel } from '../../database/models/Business';
import { BusinessLocationModel } from '../../database/models/BusinessLocation';
import { BusinessMetricsModel } from '../../database/models/BusinessMetrics';
import { UserModel } from '../../database/models/User';
import { BusinessStatus, UserRole } from '../../types';

/**
 * Business Models Database Tests
 * Tests for Task Group 2.1: Database Schema & Migrations
 *
 * Test Coverage:
 * - Business model creation with validations
 * - Business-user association
 * - Business_locations relationship
 * - Business_metrics aggregation
 */

describe('Business Database Models', () => {
  let businessModel: BusinessModel;
  let businessLocationModel: BusinessLocationModel;
  let businessMetricsModel: BusinessMetricsModel;
  let userModel: UserModel;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize models
    businessModel = new BusinessModel(pool);
    businessLocationModel = new BusinessLocationModel(pool);
    businessMetricsModel = new BusinessMetricsModel(pool);
    userModel = new UserModel(pool);

    // Create a test user
    const testUser = await userModel.create({
      email: `business-test-${Date.now()}@example.com`,
      password_hash: 'test_hash',
      role: UserRole.TENANT,
      email_verified: true,
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await userModel.delete(testUserId);
    }
  });

  test('should create a business with valid data', async () => {
    const business = await businessModel.create({
      user_id: testUserId,
      name: 'Test Restaurant',
      category: 'F&B',
      status: BusinessStatus.ACTIVE,
      is_verified: false,
    });

    expect(business).toBeDefined();
    expect(business.id).toBeDefined();
    expect(business.user_id).toBe(testUserId);
    expect(business.name).toBe('Test Restaurant');
    expect(business.category).toBe('F&B');
    expect(business.status).toBe(BusinessStatus.ACTIVE);
    expect(business.is_verified).toBe(false);
    expect(business.created_at).toBeDefined();
    expect(business.updated_at).toBeDefined();

    // Clean up
    await pool.query('DELETE FROM businesses WHERE id = $1', [business.id]);
  });

  test('should retrieve businesses by user_id', async () => {
    // Create multiple businesses
    const business1 = await businessModel.create({
      user_id: testUserId,
      name: 'Coffee Shop',
      category: 'F&B',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });

    const business2 = await businessModel.create({
      user_id: testUserId,
      name: 'Retail Store',
      category: 'Retail',
      status: BusinessStatus.PENDING_VERIFICATION,
      is_verified: false,
    });

    const businesses = await businessModel.findByUserId(testUserId);

    expect(businesses).toBeDefined();
    expect(businesses.length).toBeGreaterThanOrEqual(2);

    const businessIds = businesses.map((b) => b.id);
    expect(businessIds).toContain(business1.id);
    expect(businessIds).toContain(business2.id);

    // Clean up
    await pool.query('DELETE FROM businesses WHERE id = ANY($1)', [
      [business1.id, business2.id],
    ]);
  });

  test('should create business locations linked to business', async () => {
    // Create a business
    const business = await businessModel.create({
      user_id: testUserId,
      name: 'Multi-Location Store',
      category: 'Retail',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });

    // Create locations
    const location1 = await businessLocationModel.create({
      business_id: business.id,
      city: 'Miami',
      state: 'FL',
      address: '123 Main St, Miami, FL 33101',
    });

    const location2 = await businessLocationModel.create({
      business_id: business.id,
      city: 'New York',
      state: 'NY',
      address: null,
    });

    expect(location1).toBeDefined();
    expect(location1.business_id).toBe(business.id);
    expect(location1.city).toBe('Miami');
    expect(location1.state).toBe('FL');
    expect(location1.address).toBe('123 Main St, Miami, FL 33101');

    expect(location2).toBeDefined();
    expect(location2.business_id).toBe(business.id);
    expect(location2.address).toBeNull();

    // Retrieve locations for business
    const locations = await businessLocationModel.findByBusinessId(business.id);
    expect(locations.length).toBe(2);

    // Clean up (cascade should delete locations)
    await pool.query('DELETE FROM businesses WHERE id = $1', [business.id]);
  });

  test('should create and aggregate business metrics', async () => {
    // Create a business
    const business = await businessModel.create({
      user_id: testUserId,
      name: 'Metrics Test Business',
      category: 'Office',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });

    // Create a location
    const location = await businessLocationModel.create({
      business_id: business.id,
      city: 'Buffalo',
      state: 'NY',
      address: null,
    });

    // Create metrics for different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const metrics1 = await businessMetricsModel.create({
      business_id: business.id,
      demand_listing_id: location.id,
      metric_date: today,
      views_count: 150,
      clicks_count: 45,
      property_invites_count: 10,
      declined_count: 2,
      messages_count: 8,
      qfps_submitted_count: 3,
    });

    const metrics2 = await businessMetricsModel.create({
      business_id: business.id,
      demand_listing_id: location.id,
      metric_date: yesterday,
      views_count: 120,
      clicks_count: 30,
      property_invites_count: 5,
      declined_count: 1,
      messages_count: 4,
      qfps_submitted_count: 2,
    });

    expect(metrics1).toBeDefined();
    expect(metrics1.views_count).toBe(150);
    expect(metrics2).toBeDefined();
    expect(metrics2.views_count).toBe(120);

    // Aggregate metrics for business
    const aggregated = await businessMetricsModel.aggregateByBusinessId(business.id);
    expect(aggregated).toBeDefined();
    expect(aggregated.totalViews).toBe(270); // 150 + 120
    expect(aggregated.totalClicks).toBe(75); // 45 + 30
    expect(aggregated.totalMessages).toBe(12); // 8 + 4

    // Clean up (cascade should delete metrics and locations)
    await pool.query('DELETE FROM businesses WHERE id = $1', [business.id]);
  });

  test('should enforce foreign key constraints on delete', async () => {
    // Create a business
    const business = await businessModel.create({
      user_id: testUserId,
      name: 'FK Test Business',
      category: 'F&B',
      status: BusinessStatus.ACTIVE,
      is_verified: false,
    });

    // Create a location
    const location = await businessLocationModel.create({
      business_id: business.id,
      city: 'Test City',
      state: 'TS',
      address: null,
    });

    // Delete business (should cascade delete location)
    await pool.query('DELETE FROM businesses WHERE id = $1', [business.id]);

    // Verify location was deleted
    const locations = await businessLocationModel.findByBusinessId(business.id);
    expect(locations.length).toBe(0);
  });

  test('should filter businesses by status', async () => {
    // Create businesses with different statuses
    const activeBusiness = await businessModel.create({
      user_id: testUserId,
      name: 'Active Business',
      category: 'F&B',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });

    const pendingBusiness = await businessModel.create({
      user_id: testUserId,
      name: 'Pending Business',
      category: 'Retail',
      status: BusinessStatus.PENDING_VERIFICATION,
      is_verified: false,
    });

    const stealthBusiness = await businessModel.create({
      user_id: testUserId,
      name: 'Stealth Business',
      category: 'Office',
      status: BusinessStatus.STEALTH_MODE,
      is_verified: false,
    });

    // Filter by status
    const activeBusinesses = await businessModel.findByUserIdAndStatus(
      testUserId,
      BusinessStatus.ACTIVE
    );

    const pendingBusinesses = await businessModel.findByUserIdAndStatus(
      testUserId,
      BusinessStatus.PENDING_VERIFICATION
    );

    expect(activeBusinesses.length).toBeGreaterThanOrEqual(1);
    expect(
      activeBusinesses.every((b) => b.status === BusinessStatus.ACTIVE)
    ).toBe(true);

    expect(pendingBusinesses.length).toBeGreaterThanOrEqual(1);
    expect(
      pendingBusinesses.every((b) => b.status === BusinessStatus.PENDING_VERIFICATION)
    ).toBe(true);

    // Clean up
    await pool.query('DELETE FROM businesses WHERE id = ANY($1)', [
      [activeBusiness.id, pendingBusiness.id, stealthBusiness.id],
    ]);
  });
});
