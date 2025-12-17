// Mock uuid before importing other modules
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-value'),
}));

// Mock ioredis with proper state tracking
const mockRedisStorage = new Map();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    setex: jest.fn((key, ttl, value) => {
      mockRedisStorage.set(key, value);
      return Promise.resolve('OK');
    }),
    get: jest.fn((key) => {
      const value = mockRedisStorage.get(key);
      return Promise.resolve(value || null);
    }),
    del: jest.fn((key) => {
      mockRedisStorage.delete(key);
      return Promise.resolve(1);
    }),
    keys: jest.fn(() => Promise.resolve(Array.from(mockRedisStorage.keys()))),
    quit: jest.fn(() => Promise.resolve('OK')),
    on: jest.fn(),
  }));
});

// Mock pg Pool
jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mPool = {
    connect: jest.fn(() => mClient),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

import { PasswordService } from '../../../services/auth/PasswordService';
import { JwtService } from '../../../services/auth/JwtService';
import { RefreshTokenService } from '../../../services/auth/RefreshTokenService';
import { TokenBlacklistService } from '../../../services/auth/TokenBlacklistService';
import { CsrfService } from '../../../services/auth/CsrfService';
import { UserRole } from '../../../types';

describe('Authentication Services', () => {
  beforeEach(() => {
    // Clear Redis mock storage before each test
    mockRedisStorage.clear();
  });

  describe('PasswordService', () => {
    let passwordService: PasswordService;

    beforeEach(() => {
      passwordService = new PasswordService();
    });

    it('should hash password with bcrypt cost factor 10', async () => {
      const password = 'Test123!';
      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      // bcrypt hashes start with $2b$ for bcrypt and include the cost factor
      expect(hash.startsWith('$2b$10$') || hash.startsWith('$2a$10$')).toBe(true);
    });

    it('should verify valid password successfully', async () => {
      const password = 'Test123!';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject invalid password', async () => {
      const password = 'Test123!';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });

    it('should validate password strength requirements', () => {
      // Valid passwords
      expect(passwordService.validatePasswordStrength('Test123!')).toBe(true);
      expect(passwordService.validatePasswordStrength('Abcdef1!')).toBe(true);
      expect(passwordService.validatePasswordStrength('Pass123@')).toBe(true);

      // Invalid passwords
      expect(passwordService.validatePasswordStrength('test123!')).toBe(false); // No uppercase
      expect(passwordService.validatePasswordStrength('TEST123!')).toBe(false); // No lowercase
      expect(passwordService.validatePasswordStrength('Testtest!')).toBe(false); // No number
      expect(passwordService.validatePasswordStrength('Test1234')).toBe(false); // No special char
      expect(passwordService.validatePasswordStrength('Test1!')).toBe(false); // Too short
    });
  });

  describe('JwtService', () => {
    let jwtService: JwtService;

    beforeEach(() => {
      jwtService = new JwtService();
    });

    it('should generate access token with correct payload', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const role = UserRole.TENANT;

      const token = jwtService.generateAccessToken(userId, email, role);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should validate and decode access token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const role = UserRole.TENANT;

      const token = jwtService.generateAccessToken(userId, email, role);
      const decoded = jwtService.verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(userId);
      expect(decoded?.email).toBe(email);
      expect(decoded?.role).toBe(role);
      expect(decoded?.iat).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });

    it('should return null for invalid access token', () => {
      const decoded = jwtService.verifyAccessToken('invalid.token.here');

      expect(decoded).toBeNull();
    });

    it('should set token expiry to 15 minutes', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const role = UserRole.TENANT;

      const token = jwtService.generateAccessToken(userId, email, role);
      const decoded = jwtService.verifyAccessToken(token);

      expect(decoded).toBeDefined();
      if (decoded) {
        const expiryDuration = decoded.exp - decoded.iat;
        expect(expiryDuration).toBe(15 * 60); // 15 minutes in seconds
      }
    });
  });

  describe('RefreshTokenService', () => {
    let refreshTokenService: RefreshTokenService;

    beforeEach(() => {
      refreshTokenService = new RefreshTokenService();
    });

    it('should generate cryptographically secure refresh token', () => {
      const token1 = refreshTokenService.generateRefreshToken();
      const token2 = refreshTokenService.generateRefreshToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      // 64 bytes = 128 hex characters
      expect(token1.length).toBe(128);
    });

    it('should hash refresh token with SHA256', () => {
      const token = refreshTokenService.generateRefreshToken();
      const hash = refreshTokenService.hashToken(token);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(token);
      // SHA256 produces 64 hex characters
      expect(hash.length).toBe(64);
    });

    it('should calculate correct expiry for remember me enabled', () => {
      const expiresAt = refreshTokenService.calculateExpiry(true);
      const now = new Date();
      const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(30);
    });

    it('should calculate correct expiry for remember me disabled', () => {
      const expiresAt = refreshTokenService.calculateExpiry(false);
      const now = new Date();
      const diffHours = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));

      expect(diffHours).toBe(24);
    });
  });

  describe('TokenBlacklistService', () => {
    let blacklistService: TokenBlacklistService;

    beforeEach(() => {
      blacklistService = new TokenBlacklistService();
    });

    it('should blacklist token successfully', async () => {
      const token = 'test.jwt.token';
      await blacklistService.blacklistToken(token, 900); // 15 minutes

      const isBlacklisted = await blacklistService.isBlacklisted(token);
      expect(isBlacklisted).toBe(true);
    });

    it('should return false for non-blacklisted token', async () => {
      const token = 'non.blacklisted.token';

      const isBlacklisted = await blacklistService.isBlacklisted(token);
      expect(isBlacklisted).toBe(false);
    });
  });

  describe('CsrfService', () => {
    let csrfService: CsrfService;

    beforeEach(() => {
      csrfService = new CsrfService();
    });

    it('should generate cryptographically random CSRF token', () => {
      const token1 = csrfService.generateToken();
      const token2 = csrfService.generateToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(0);
    });

    it('should validate matching CSRF tokens', () => {
      const token = csrfService.generateToken();
      const isValid = csrfService.validateToken(token, token);

      expect(isValid).toBe(true);
    });

    it('should reject mismatched CSRF tokens', () => {
      const token1 = csrfService.generateToken();
      const token2 = csrfService.generateToken();
      const isValid = csrfService.validateToken(token1, token2);

      expect(isValid).toBe(false);
    });
  });
});
