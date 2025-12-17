import request from 'supertest';
import { createApp } from '../../app';
import { JwtService } from '../../services/auth/JwtService';
import { UserRole } from '../../types';
import { Express } from 'express';

describe('Dashboard Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/dashboard', () => {
    it('should return tenant redirect path for tenant users', async () => {
      // Spy on JWT service methods
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue('valid-token');
      jest.spyOn(JwtService.prototype, 'verifyAccessToken').mockReturnValue({
        userId: 'user-123',
        email: 'tenant@example.com',
        role: UserRole.TENANT,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        redirectPath: '/dashboard/tenant',
        role: UserRole.TENANT,
        user: {
          id: 'user-123',
          email: 'tenant@example.com',
        },
      });
    });

    it('should return landlord redirect path for landlord users', async () => {
      // Spy on JWT service methods
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue('valid-token');
      jest.spyOn(JwtService.prototype, 'verifyAccessToken').mockReturnValue({
        userId: 'user-456',
        email: 'landlord@example.com',
        role: UserRole.LANDLORD,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        redirectPath: '/dashboard/landlord',
        role: UserRole.LANDLORD,
        user: {
          id: 'user-456',
          email: 'landlord@example.com',
        },
      });
    });

    it('should return broker redirect path for broker users', async () => {
      // Spy on JWT service methods
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue('valid-token');
      jest.spyOn(JwtService.prototype, 'verifyAccessToken').mockReturnValue({
        userId: 'user-789',
        email: 'broker@example.com',
        role: UserRole.BROKER,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        redirectPath: '/dashboard/broker',
        role: UserRole.BROKER,
        user: {
          id: 'user-789',
          email: 'broker@example.com',
        },
      });
    });

    it('should return 401 when no access token provided', async () => {
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue(null);

      const response = await request(app).get('/api/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/dashboard/tenant', () => {
    it('should return tenant dashboard data for tenant users', async () => {
      // Spy on JWT service methods
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue('valid-token');
      jest.spyOn(JwtService.prototype, 'verifyAccessToken').mockReturnValue({
        userId: 'user-123',
        email: 'tenant@example.com',
        role: UserRole.TENANT,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app)
        .get('/api/dashboard/tenant')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.dashboard.role).toBe(UserRole.TENANT);
      expect(response.body.dashboard.features).toContain('post_space_requirements');
      expect(response.body.dashboard.redirectPath).toBe('/dashboard/tenant');
    });

    it('should return 403 when landlord user tries to access tenant dashboard', async () => {
      // Spy on JWT service methods
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue('valid-token');
      jest.spyOn(JwtService.prototype, 'verifyAccessToken').mockReturnValue({
        userId: 'user-456',
        email: 'landlord@example.com',
        role: UserRole.LANDLORD,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app)
        .get('/api/dashboard/tenant')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/dashboard/landlord', () => {
    it('should return landlord dashboard data for landlord users', async () => {
      // Spy on JWT service methods
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue('valid-token');
      jest.spyOn(JwtService.prototype, 'verifyAccessToken').mockReturnValue({
        userId: 'user-456',
        email: 'landlord@example.com',
        role: UserRole.LANDLORD,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app)
        .get('/api/dashboard/landlord')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.dashboard.role).toBe(UserRole.LANDLORD);
      expect(response.body.dashboard.features).toContain('manage_properties');
      expect(response.body.dashboard.redirectPath).toBe('/dashboard/landlord');
    });

    it('should return 403 when tenant user tries to access landlord dashboard', async () => {
      // Spy on JWT service methods
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue('valid-token');
      jest.spyOn(JwtService.prototype, 'verifyAccessToken').mockReturnValue({
        userId: 'user-123',
        email: 'tenant@example.com',
        role: UserRole.TENANT,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app)
        .get('/api/dashboard/landlord')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/dashboard/broker', () => {
    it('should return broker dashboard data for broker users', async () => {
      // Spy on JWT service methods
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue('valid-token');
      jest.spyOn(JwtService.prototype, 'verifyAccessToken').mockReturnValue({
        userId: 'user-789',
        email: 'broker@example.com',
        role: UserRole.BROKER,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app)
        .get('/api/dashboard/broker')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.dashboard.role).toBe(UserRole.BROKER);
      expect(response.body.dashboard.features).toContain('dual_mode_access');
      expect(response.body.dashboard.redirectPath).toBe('/dashboard/broker');
    });

    it('should return 403 when tenant user tries to access broker dashboard', async () => {
      // Spy on JWT service methods
      jest.spyOn(JwtService.prototype, 'extractTokenFromHeader').mockReturnValue('valid-token');
      jest.spyOn(JwtService.prototype, 'verifyAccessToken').mockReturnValue({
        userId: 'user-123',
        email: 'tenant@example.com',
        role: UserRole.TENANT,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app)
        .get('/api/dashboard/broker')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
