import { Pool } from 'pg';
import pool from '../../config/database';
import { BusinessModel } from '../../database/models/Business';
import { UserModel } from '../../database/models/User';
import { BusinessStatus, UserRole } from '../../types';

/**
 * Business Search and User-Business Relationship Tests
 * Tests for Task Group 2: Database Schema and Models
 *
 * Test Coverage:
 * - Global business search with ILIKE query
 * - Duplicate business check returns correct boolean
 * - User-business relationship queries
 * - Business count calculation for user
 * - Multiple businesses per user support
 */

describe('Business Search and User-Business Relationships', () => {
  let businessModel: BusinessModel;
  let userModel: UserModel;
  let testUser1Id: string;
  let testUser2Id: string;
  let businessIds: string[] = [];

  beforeAll(async () => {
    // Initialize models
    businessModel = new BusinessModel(pool);
    userModel = new UserModel(pool);

    // Create test users
    const testUser1 = await userModel.create({
      email: `user1-${Date.now()}@example.com`,
      password_hash: 'test_hash_1',
      role: UserRole.TENANT,
      email_verified: true,
    });
    testUser1Id = testUser1.id;

    const testUser2 = await userModel.create({
      email: `user2-${Date.now()}@example.com`,
      password_hash: 'test_hash_2',
      role: UserRole.TENANT,
      email_verified: true,
    });
    testUser2Id = testUser2.id;

    // Create test businesses for user1
    const business1 = await businessModel.create({
      user_id: testUser1Id,
      name: 'Starbucks Coffee',
      category: 'F&B',
      logo_url: 'https://example.com/starbucks.png',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });
    businessIds.push(business1.id);

    const business2 = await businessModel.create({
      user_id: testUser1Id,
      name: 'Target Retail Store',
      category: 'Retail',
      logo_url: 'https://example.com/target.png',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });
    businessIds.push(business2.id);

    // Create test business for user2
    const business3 = await businessModel.create({
      user_id: testUser2Id,
      name: 'Coffee Bean & Tea Leaf',
      category: 'F&B',
      status: BusinessStatus.PENDING_VERIFICATION,
      is_verified: false,
    });
    businessIds.push(business3.id);

    const business4 = await businessModel.create({
      user_id: testUser2Id,
      name: 'Apple Store',
      category: 'Retail',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });
    businessIds.push(business4.id);
  });

  afterAll(async () => {
    // Clean up test data
    if (businessIds.length > 0) {
      await pool.query('DELETE FROM businesses WHERE id = ANY($1)', [businessIds]);
    }
    if (testUser1Id) {
      await userModel.delete(testUser1Id);
    }
    if (testUser2Id) {
      await userModel.delete(testUser2Id);
    }
  });

  test('should perform global business search with ILIKE query', async () => {
    const searchTerm = 'coffee';
    const results = await businessModel.findAllGlobal(searchTerm);

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(2); // Should find both coffee businesses

    // Verify search is case-insensitive
    const foundNames = results.map((b) => b.name.toLowerCase());
    expect(foundNames.some((name) => name.includes('coffee'))).toBe(true);

    // Verify it searches across all users (global search)
    const userIds = results.map((b) => b.user_id);
    const uniqueUserIds = [...new Set(userIds)];
    expect(uniqueUserIds.length).toBeGreaterThanOrEqual(1);
  });

  test('should return empty array when no businesses match search', async () => {
    const searchTerm = 'NonExistentBusinessXYZ123';
    const results = await businessModel.findAllGlobal(searchTerm);

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  test('should check for duplicate business and return true if exists', async () => {
    const existingBusinessName = 'Starbucks Coffee';
    const isDuplicate = await businessModel.checkDuplicate(existingBusinessName);

    expect(isDuplicate).toBe(true);
  });

  test('should check for duplicate business and return false if not exists', async () => {
    const nonExistentBusinessName = 'Unique Business Name That Does Not Exist';
    const isDuplicate = await businessModel.checkDuplicate(nonExistentBusinessName);

    expect(isDuplicate).toBe(false);
  });

  test('should perform case-insensitive duplicate check', async () => {
    const existingBusinessLowercase = 'starbucks coffee';
    const isDuplicate = await businessModel.checkDuplicate(existingBusinessLowercase);

    expect(isDuplicate).toBe(true);
  });

  test('should get all businesses for a specific user', async () => {
    const user1Businesses = await businessModel.findByUserId(testUser1Id);

    expect(user1Businesses).toBeDefined();
    expect(Array.isArray(user1Businesses)).toBe(true);
    expect(user1Businesses.length).toBe(2);

    // Verify all businesses belong to user1
    expect(user1Businesses.every((b) => b.user_id === testUser1Id)).toBe(true);

    // Verify business names
    const businessNames = user1Businesses.map((b) => b.name);
    expect(businessNames).toContain('Starbucks Coffee');
    expect(businessNames).toContain('Target Retail Store');
  });

  test('should calculate correct business count for user', async () => {
    // User1 should have 2 businesses
    const user1Businesses = await businessModel.findByUserId(testUser1Id);
    expect(user1Businesses.length).toBe(2);

    // User2 should have 2 businesses
    const user2Businesses = await businessModel.findByUserId(testUser2Id);
    expect(user2Businesses.length).toBe(2);
  });

  test('should support multiple businesses per user', async () => {
    // Create a third business for user1
    const business5 = await businessModel.create({
      user_id: testUser1Id,
      name: 'Third Business for User1',
      category: 'Office',
      status: BusinessStatus.ACTIVE,
      is_verified: false,
    });
    businessIds.push(business5.id);

    const user1Businesses = await businessModel.findByUserId(testUser1Id);

    expect(user1Businesses.length).toBe(3);
    expect(user1Businesses.every((b) => b.user_id === testUser1Id)).toBe(true);
  });
});
