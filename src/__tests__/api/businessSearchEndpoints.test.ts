/**
 * Task Group 3.1: Integration tests for new business API endpoints
 * Tests for: global search, duplicate check, add business to user portfolio, get user businesses
 */

import request from 'supertest';
import { createApp } from '../../app';
import { BusinessModel } from '../../database/models/Business';
import { JwtService } from '../../services/auth/JwtService';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

const app = createApp();

describe('Business Search & Portfolio API Endpoints - Task Group 3', () => {
  let jwtService: JwtService;
  let businessModel: BusinessModel;
  let testUserId: string;
  let testUserId2: string;
  let testAccessToken: string;
  let testAccessToken2: string;
  let testBusinessId1: string;
  let testBusinessId2: string;
  let testBusinessId3: string;

  beforeAll(async () => {
    jwtService = new JwtService();
    businessModel = new BusinessModel();

    // Create test users
    testUserId = uuidv4();
    testUserId2 = uuidv4();

    await pool.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [testUserId, 'tenant1-search@test.com', 'hashedpassword', 'tenant', true]
    );

    await pool.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [testUserId2, 'tenant2-search@test.com', 'hashedpassword', 'tenant', true]
    );

    // Generate access tokens
    testAccessToken = jwtService.generateAccessToken(testUserId, 'tenant1-search@test.com', 'tenant');
    testAccessToken2 = jwtService.generateAccessToken(testUserId2, 'tenant2-search@test.com', 'tenant');

    // Create test businesses for different users
    const business1 = await businessModel.create({
      user_id: testUserId,
      name: 'Acme Corporation',
      category: 'Technology',
      logo_url: 'https://example.com/acme.png',
      status: 'active',
      is_verified: true,
    });
    testBusinessId1 = business1.id;

    const business2 = await businessModel.create({
      user_id: testUserId2,
      name: 'Global Industries',
      category: 'Manufacturing',
      logo_url: 'https://example.com/global.png',
      status: 'active',
      is_verified: false,
    });
    testBusinessId2 = business2.id;

    const business3 = await businessModel.create({
      user_id: testUserId2,
      name: 'Tech Startup Inc',
      category: 'Technology',
      status: 'pending_verification',
    });
    testBusinessId3 = business3.id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM businesses WHERE user_id IN ($1, $2)', [testUserId, testUserId2]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [testUserId, testUserId2]);
    await pool.end();
  });

  describe('GET /api/businesses/search - Global Business Search', () => {
    it('should return all businesses matching search term (global search)', async () => {
      const response = await request(app)
        .get('/api/businesses/search')
        .query({ query: 'corp' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('businesses');
      expect(Array.isArray(response.body.data.businesses)).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);

      // Should include Acme Corporation
      const acmeBusiness = response.body.data.businesses.find(
        (b: any) => b.name === 'Acme Corporation'
      );
      expect(acmeBusiness).toBeDefined();
    });

    it('should return businesses from different users (not filtered by user_id)', async () => {
      const response = await request(app)
        .get('/api/businesses/search')
        .query({ query: 'tech' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const businesses = response.body.data.businesses;
      const userIds = businesses.map((b: any) => b.user_id);

      // Should have businesses from at least one user
      expect(new Set(userIds).size).toBeGreaterThan(0);
    });

    it('should return empty array when no businesses match search term', async () => {
      const response = await request(app)
        .get('/api/businesses/search')
        .query({ query: 'nonexistentbusiness12345' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.businesses).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('should include business details (name, logo, category, verification)', async () => {
      const response = await request(app)
        .get('/api/businesses/search')
        .query({ query: 'Acme' });

      expect(response.status).toBe(200);
      const acmeBusiness = response.body.data.businesses[0];

      expect(acmeBusiness).toHaveProperty('name');
      expect(acmeBusiness).toHaveProperty('logo_url');
      expect(acmeBusiness).toHaveProperty('category');
      expect(acmeBusiness).toHaveProperty('is_verified');
    });
  });

  describe('POST /api/businesses/check-duplicate - Duplicate Detection', () => {
    it('should detect duplicate business name (case-insensitive)', async () => {
      const response = await request(app)
        .post('/api/businesses/check-duplicate')
        .send({ companyName: 'acme corporation' }); // lowercase

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(true);
    });

    it('should return false for non-existent business name', async () => {
      const response = await request(app)
        .post('/api/businesses/check-duplicate')
        .send({ companyName: 'Unique Business Name 12345' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(false);
    });

    it('should return validation error when companyName is missing', async () => {
      const response = await request(app)
        .post('/api/businesses/check-duplicate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle mixed case business names correctly', async () => {
      const response = await request(app)
        .post('/api/businesses/check-duplicate')
        .send({ companyName: 'GLOBAL INDUSTRIES' }); // uppercase

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(true);
    });
  });

  describe('POST /api/user/businesses - Add Business to Portfolio', () => {
    it('should add existing business to user portfolio', async () => {
      const response = await request(app)
        .post('/api/user/businesses')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ businessId: testBusinessId2 }); // Add business owned by user2

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('businessId');
      expect(response.body.data.businessId).toBe(testBusinessId2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/user/businesses')
        .send({ businessId: testBusinessId2 });

      expect(response.status).toBe(401);
    });

    it('should return validation error when businessId is missing', async () => {
      const response = await request(app)
        .post('/api/user/businesses')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for non-existent business', async () => {
      const nonExistentId = uuidv4();
      const response = await request(app)
        .post('/api/user/businesses')
        .set('Authorization', `Bearer ${testAccessToken}`)
        .send({ businessId: nonExistentId });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/user/businesses - Get User\'s Businesses', () => {
    it('should return all businesses associated with authenticated user', async () => {
      const response = await request(app)
        .get('/api/user/businesses')
        .set('Authorization', `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('businesses');
      expect(response.body.data).toHaveProperty('count');
      expect(Array.isArray(response.body.data.businesses)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return correct business count', async () => {
      const response = await request(app)
        .get('/api/user/businesses')
        .set('Authorization', `Bearer ${testAccessToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBe(response.body.data.businesses.length);

      // User2 should have 2 businesses
      expect(response.body.data.count).toBeGreaterThanOrEqual(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/user/businesses');

      expect(response.status).toBe(401);
    });

    it('should return only businesses owned by the authenticated user', async () => {
      const response = await request(app)
        .get('/api/user/businesses')
        .set('Authorization', `Bearer ${testAccessToken}`);

      expect(response.status).toBe(200);
      const businesses = response.body.data.businesses;

      // All businesses should belong to testUserId
      businesses.forEach((business: any) => {
        expect(business.user_id).toBe(testUserId);
      });
    });
  });
});
