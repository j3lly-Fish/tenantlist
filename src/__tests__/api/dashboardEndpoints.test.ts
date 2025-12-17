import request from 'supertest';
import { createApp } from '../../app';
import { Express } from 'express';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, BusinessStatus } from '../../types';
import { JwtService } from '../../services/auth/JwtService';
import { io as ioClient, Socket } from 'socket.io-client';
import http from 'http';
import { initializeDashboardSocket } from '../../websocket/dashboardSocket';

// Mock Redis for testing
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
      keys.forEach(key => {
        mockRedisStorage.delete(key);
        mockRedisTTL.delete(key);
      });
      return Promise.resolve(keys.length);
    }),
  },
}));

describe('Dashboard API Endpoints', () => {
  let app: Express;
  let server: http.Server;
  let testUserId: string;
  let testUserEmail: string;
  let accessToken: string;
  let jwtService: JwtService;
  let testBusinessId1: string;
  let testBusinessId2: string;

  beforeAll(async () => {
    // Create Express app and HTTP server
    app = createApp();
    server = http.createServer(app);

    // Initialize WebSocket server
    initializeDashboardSocket(server);

    // Start server
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });

    jwtService = new JwtService();

    // Create test user
    testUserId = uuidv4();
    testUserEmail = `dashboard-test-${Date.now()}@example.com`;

    await pool.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testUserId, testUserEmail, 'hash', UserRole.TENANT, true, true]
    );

    // Generate access token
    accessToken = jwtService.generateAccessToken(
      testUserId,
      testUserEmail,
      UserRole.TENANT
    );

    // Create test businesses
    testBusinessId1 = uuidv4();
    testBusinessId2 = uuidv4();

    await pool.query(
      `INSERT INTO businesses (id, user_id, name, category, status, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testBusinessId1, testUserId, 'Test Business 1', 'F&B', BusinessStatus.ACTIVE, true]
    );

    await pool.query(
      `INSERT INTO businesses (id, user_id, name, category, status, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testBusinessId2, testUserId, 'Test Business 2', 'Retail', BusinessStatus.ACTIVE, false]
    );

    // Create test metrics
    const today = new Date();
    await pool.query(
      `INSERT INTO business_metrics (
        id, business_id, demand_listing_id, metric_date,
        views_count, clicks_count, property_invites_count,
        declined_count, messages_count, qfps_submitted_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [uuidv4(), testBusinessId1, null, today, 100, 50, 10, 2, 25, 5]
    );

    await pool.query(
      `INSERT INTO business_metrics (
        id, business_id, demand_listing_id, metric_date,
        views_count, clicks_count, property_invites_count,
        declined_count, messages_count, qfps_submitted_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [uuidv4(), testBusinessId2, null, today, 75, 30, 5, 1, 15, 3]
    );
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM business_metrics WHERE business_id = $1 OR business_id = $2', [
      testBusinessId1,
      testBusinessId2,
    ]);
    await pool.query('DELETE FROM businesses WHERE id = $1 OR id = $2', [
      testBusinessId1,
      testBusinessId2,
    ]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);

    // Clear Redis mock
    mockRedisStorage.clear();
    mockRedisTTL.clear();

    // Close server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    // Clear Redis cache before each test
    mockRedisStorage.clear();
    mockRedisTTL.clear();
  });

  describe('GET /api/dashboard/tenant', () => {
    it('should return dashboard data with KPIs and businesses', async () => {
      const response = await request(app)
        .get('/api/dashboard/tenant')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('kpis');
      expect(response.body.data).toHaveProperty('businesses');
      expect(response.body.data).toHaveProperty('total');

      // Verify KPIs structure
      const { kpis } = response.body.data;
      expect(kpis).toHaveProperty('activeBusinesses');
      expect(kpis).toHaveProperty('responseRate');
      expect(kpis).toHaveProperty('landlordViews');
      expect(kpis).toHaveProperty('messagesTotal');

      // Verify KPI values
      expect(kpis.activeBusinesses).toBe(2); // Both businesses are active
      expect(kpis.landlordViews).toBe(175); // 100 + 75
      expect(kpis.messagesTotal).toBe(40); // 25 + 15

      // Verify businesses array
      expect(Array.isArray(response.body.data.businesses)).toBe(true);
      expect(response.body.data.total).toBe(2);
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/dashboard/tenant')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should cache KPI calculations in Redis', async () => {
      // First request - should calculate and cache
      await request(app)
        .get('/api/dashboard/tenant')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      // Verify cache was set
      const cacheKey = `dashboard:kpis:${testUserId}`;
      expect(mockRedisStorage.has(cacheKey)).toBe(true);
      expect(mockRedisTTL.get(cacheKey)).toBe(300); // 5 minutes

      // Second request - should use cache
      const response = await request(app)
        .get('/api/dashboard/tenant')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect(response.body.data.kpis.activeBusinesses).toBe(2);
    });
  });

  describe('GET /api/dashboard/tenant/kpis', () => {
    it('should return only KPIs without businesses list', async () => {
      const response = await request(app)
        .get('/api/dashboard/tenant/kpis')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('activeBusinesses');
      expect(response.body.data).toHaveProperty('responseRate');
      expect(response.body.data).toHaveProperty('landlordViews');
      expect(response.body.data).toHaveProperty('messagesTotal');

      // Should not have businesses array
      expect(response.body.data).not.toHaveProperty('businesses');
      expect(response.body.data).not.toHaveProperty('total');
    });

    it('should handle users with no businesses', async () => {
      // Create a user with no businesses
      const emptyUserId = uuidv4();
      const emptyUserEmail = `empty-${Date.now()}@example.com`;

      await pool.query(
        `INSERT INTO users (id, email, password_hash, role, email_verified, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [emptyUserId, emptyUserEmail, 'hash', UserRole.TENANT, true, true]
      );

      const emptyToken = jwtService.generateAccessToken(
        emptyUserId,
        emptyUserEmail,
        UserRole.TENANT
      );

      const response = await request(app)
        .get('/api/dashboard/tenant/kpis')
        .set('Cookie', `accessToken=${emptyToken}`)
        .expect(200);

      expect(response.body.data.activeBusinesses).toBe(0);
      expect(response.body.data.landlordViews).toBe(0);
      expect(response.body.data.messagesTotal).toBe(0);
      expect(response.body.data.responseRate).toBe(0);

      // Clean up
      await pool.query('DELETE FROM users WHERE id = $1', [emptyUserId]);
    });
  });

  describe('WebSocket Authentication', () => {
    it('should authenticate WebSocket connection with valid JWT', (done) => {
      const port = (server.address() as any).port;
      const socket = ioClient(`http://localhost:${port}/dashboard`, {
        auth: {
          token: accessToken,
        },
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should reject WebSocket connection without token', (done) => {
      const port = (server.address() as any).port;
      const socket = ioClient(`http://localhost:${port}/dashboard`);

      socket.on('connect', () => {
        socket.disconnect();
        done(new Error('Should not connect without token'));
      });

      socket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication token required');
        socket.disconnect();
        done();
      });
    });

    it('should reject WebSocket connection with invalid token', (done) => {
      const port = (server.address() as any).port;
      const socket = ioClient(`http://localhost:${port}/dashboard`, {
        auth: {
          token: 'invalid-token',
        },
      });

      socket.on('connect', () => {
        socket.disconnect();
        done(new Error('Should not connect with invalid token'));
      });

      socket.on('connect_error', (error) => {
        expect(error.message).toContain('Invalid authentication token');
        socket.disconnect();
        done();
      });
    });
  });

  describe('WebSocket Real-time Updates', () => {
    it('should receive reconnected event on reconnection', (done) => {
      const port = (server.address() as any).port;
      const socket = ioClient(`http://localhost:${port}/dashboard`, {
        auth: {
          token: accessToken,
        },
      });

      socket.on('connect', () => {
        socket.emit('request:current-state');
      });

      socket.on('reconnected', (data) => {
        expect(data).toHaveProperty('timestamp');
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });
  });
});
