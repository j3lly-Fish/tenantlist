// Mock ioredis with proper state tracking
const mockRedisStorage = new Map();
const mockRedisTTL = new Map();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn((key) => {
      const value = mockRedisStorage.get(key);
      return Promise.resolve(value || null);
    }),
    incr: jest.fn((key) => {
      const current = mockRedisStorage.get(key);
      const newValue = current ? parseInt(current, 10) + 1 : 1;
      mockRedisStorage.set(key, newValue.toString());
      return Promise.resolve(newValue);
    }),
    expire: jest.fn((key, seconds) => {
      mockRedisTTL.set(key, seconds);
      return Promise.resolve(1);
    }),
    ttl: jest.fn((key) => {
      const ttl = mockRedisTTL.get(key) || 900; // Default 15 minutes
      return Promise.resolve(ttl);
    }),
    del: jest.fn((key) => {
      mockRedisStorage.delete(key);
      mockRedisTTL.delete(key);
      return Promise.resolve(1);
    }),
    quit: jest.fn(() => Promise.resolve('OK')),
    on: jest.fn(),
  }));
});

import { RateLimitService, RateLimitType } from '../../services/auth/RateLimitService';
import {
  IpRateLimitMiddleware,
  EmailRateLimitMiddleware,
  PasswordResetRateLimitMiddleware,
  LoginRateLimitMiddleware,
} from '../../middleware/rateLimitMiddleware';
import { CsrfService } from '../../services/auth/CsrfService';
import {
  CsrfValidationMiddleware,
  HttpsEnforcementMiddleware,
} from '../../middleware/securityMiddleware';

describe('Rate Limiting & Security Features', () => {
  beforeEach(() => {
    // Clear Redis mock storage before each test
    mockRedisStorage.clear();
    mockRedisTTL.clear();
  });

  describe('IP-based Rate Limiting', () => {
    it('should allow requests under the threshold', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new IpRateLimitMiddleware(rateLimitService);

      const req = {
        ip: '192.168.1.100',
        headers: {},
        body: {},
      };

      const result = await middleware.check(req);

      expect(result.allowed).toBe(true);
      expect(result.headers).toBeDefined();
      expect(result.headers?.['X-RateLimit-Limit']).toBe('10');
      expect(result.headers?.['X-RateLimit-Remaining']).toBe('9');

      await rateLimitService.disconnect();
    });

    it('should trigger rate limit after threshold exceeded', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new IpRateLimitMiddleware(rateLimitService);

      const req = {
        ip: '192.168.1.101',
        headers: {},
        body: {},
      };

      // Make 10 requests (threshold)
      for (let i = 0; i < 10; i++) {
        await middleware.check(req);
      }

      // 11th request should be blocked
      const result = await middleware.check(req);

      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(429);
      expect(result.error?.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.error?.message).toContain('15 minutes');

      await rateLimitService.disconnect();
    });

    it('should return correct rate limit headers', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new IpRateLimitMiddleware(rateLimitService);

      const req = {
        ip: '192.168.1.102',
        headers: {},
        body: {},
      };

      const result = await middleware.check(req);

      expect(result.headers).toBeDefined();
      expect(result.headers?.['X-RateLimit-Limit']).toBe('10');
      expect(result.headers?.['X-RateLimit-Remaining']).toBe('9');
      expect(result.headers?.['X-RateLimit-Reset']).toBeDefined();

      await rateLimitService.disconnect();
    });
  });

  describe('Email-based Rate Limiting', () => {
    it('should allow requests under the threshold', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new EmailRateLimitMiddleware(rateLimitService);

      const result = await middleware.check('test@example.com');

      expect(result.allowed).toBe(true);
      expect(result.headers).toBeDefined();
      expect(result.headers?.['X-RateLimit-Limit']).toBe('5');

      await rateLimitService.disconnect();
    });

    it('should trigger rate limit after threshold exceeded', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new EmailRateLimitMiddleware(rateLimitService);

      const email = 'user@example.com';

      // Make 5 requests (threshold)
      for (let i = 0; i < 5; i++) {
        await middleware.check(email);
      }

      // 6th request should be blocked
      const result = await middleware.check(email);

      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(429);
      expect(result.error?.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.error?.message).toContain('15 minutes');

      await rateLimitService.disconnect();
    });

    it('should normalize email addresses', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new EmailRateLimitMiddleware(rateLimitService);

      // Make requests with different casing
      await middleware.check('Test@Example.com');
      await middleware.check('test@example.com');
      await middleware.check('TEST@EXAMPLE.COM');

      const result = await middleware.check('test@example.com');

      // All should count towards the same limit
      expect(result.headers?.['X-RateLimit-Remaining']).toBe('1');

      await rateLimitService.disconnect();
    });
  });

  describe('Password Reset Rate Limiting', () => {
    it('should allow requests under the threshold', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new PasswordResetRateLimitMiddleware(rateLimitService);

      const result = await middleware.check('reset@example.com');

      expect(result.allowed).toBe(true);
      expect(result.headers?.['X-RateLimit-Limit']).toBe('3');

      await rateLimitService.disconnect();
    });

    it('should trigger rate limit after 3 requests per hour', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new PasswordResetRateLimitMiddleware(rateLimitService);

      const email = 'reset@example.com';

      // Make 3 requests (threshold)
      for (let i = 0; i < 3; i++) {
        await middleware.check(email);
      }

      // 4th request should be blocked
      const result = await middleware.check(email);

      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(429);
      expect(result.error?.message).toContain('1 hour');

      await rateLimitService.disconnect();
    });
  });

  describe('Combined Login Rate Limiting', () => {
    it('should check both IP and email rate limits', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new LoginRateLimitMiddleware(rateLimitService);

      const req = {
        ip: '192.168.1.200',
        headers: {},
        body: { email: 'login@example.com' },
      };

      const result = await middleware.check(req);

      expect(result.allowed).toBe(true);
      // Should include headers from both checks
      expect(result.headers).toBeDefined();

      await rateLimitService.disconnect();
    });

    it('should block if email limit exceeded even if IP limit not exceeded', async () => {
      const rateLimitService = new RateLimitService();
      const middleware = new LoginRateLimitMiddleware(rateLimitService);

      const email = 'limited@example.com';

      // Exceed email limit (5 attempts)
      for (let i = 0; i < 5; i++) {
        await middleware.check({
          ip: `192.168.1.${200 + i}`, // Different IPs
          headers: {},
          body: { email },
        });
      }

      // Next request should be blocked
      const result = await middleware.check({
        ip: '192.168.1.250',
        headers: {},
        body: { email },
      });

      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(429);

      await rateLimitService.disconnect();
    });
  });

  describe('CSRF Token Validation', () => {
    it('should validate matching CSRF tokens', () => {
      const csrfService = new CsrfService();
      const token = csrfService.generateToken();

      const isValid = csrfService.validateToken(token, token);

      expect(isValid).toBe(true);
    });

    it('should reject mismatched CSRF tokens', () => {
      const csrfService = new CsrfService();
      const token1 = csrfService.generateToken();
      const token2 = csrfService.generateToken();

      const isValid = csrfService.validateToken(token1, token2);

      expect(isValid).toBe(false);
    });

    it('should block requests with invalid CSRF token', async () => {
      const middleware = new CsrfValidationMiddleware();

      const req = {
        method: 'POST',
        path: '/api/auth/login',
        headers: {
          'x-csrf-token': 'invalid-token',
        },
        cookies: {
          csrfToken: 'valid-token',
        },
      };

      const result = await middleware.check(req);

      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(result.error?.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('should allow GET requests without CSRF token', async () => {
      const middleware = new CsrfValidationMiddleware();

      const req = {
        method: 'GET',
        path: '/api/auth/me',
        headers: {},
        cookies: {},
      };

      const result = await middleware.check(req);

      expect(result.allowed).toBe(true);
    });

    it('should skip CSRF check for OAuth callback', async () => {
      const middleware = new CsrfValidationMiddleware();

      const req = {
        method: 'GET',
        path: '/api/auth/oauth/google/callback',
        headers: {},
        cookies: {},
      };

      const result = await middleware.check(req);

      expect(result.allowed).toBe(true);
    });
  });

  describe('HTTPS Enforcement', () => {
    it('should redirect HTTP to HTTPS in production', async () => {
      const middleware = new HttpsEnforcementMiddleware();

      const req = {
        protocol: 'http',
        hostname: 'app.zyx.com',
        originalUrl: '/api/auth/login',
        headers: {},
      };

      const result = await middleware.check(req, 'production');

      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(301);
      expect(result.redirect).toBe('https://app.zyx.com/api/auth/login');
    });

    it('should allow HTTP in development environment', async () => {
      const middleware = new HttpsEnforcementMiddleware();

      const req = {
        protocol: 'http',
        hostname: 'localhost',
        originalUrl: '/api/auth/login',
        headers: {},
      };

      const result = await middleware.check(req, 'development');

      expect(result.allowed).toBe(true);
    });

    it('should set HSTS header for HTTPS requests in production', async () => {
      const middleware = new HttpsEnforcementMiddleware();

      const req = {
        protocol: 'https',
        hostname: 'app.zyx.com',
        originalUrl: '/api/auth/login',
        headers: {},
      };

      const result = await middleware.check(req, 'production');

      expect(result.allowed).toBe(true);
      expect(result.headers?.['Strict-Transport-Security']).toBe(
        'max-age=31536000; includeSubDomains'
      );
    });
  });
});
