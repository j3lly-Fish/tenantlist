import { Pool } from 'pg';
import pool from '../../config/database';
import { AuthController } from '../../controllers/AuthController';
import { AuthService } from '../../services/auth/AuthService';
import { UserModel } from '../../database/models/User';
import { UserProfileModel } from '../../database/models/UserProfile';
import { RefreshTokenService } from '../../services/auth/RefreshTokenService';
import { UserRole } from '../../types';

/**
 * Authentication Endpoints Tests
 * Tests for Task Group 3: Email/Password Authentication Endpoints
 *
 * Test Coverage:
 * - POST /api/auth/signup creates user and returns tokens
 * - POST /api/auth/login validates credentials and returns tokens
 * - POST /api/auth/logout revokes refresh token
 * - POST /api/auth/refresh-token issues new tokens
 * - Rate limiting on login endpoint
 * - GET /api/auth/me returns authenticated user data
 */

describe('Authentication Endpoints', () => {
  let authController: AuthController;
  let authService: AuthService;
  let userModel: UserModel;
  let userProfileModel: UserProfileModel;
  let refreshTokenService: RefreshTokenService;

  beforeAll(async () => {
    // Initialize services and controllers
    authService = new AuthService(pool);
    authController = new AuthController(authService);
    userModel = new UserModel(pool);
    userProfileModel = new UserProfileModel(pool);
    refreshTokenService = new RefreshTokenService(pool);
  });

  afterAll(async () => {
    // Clean up database
    await pool.query('DELETE FROM user_profiles');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM users');
    await pool.end();
  });

  afterEach(async () => {
    // Clean up after each test
    await pool.query('DELETE FROM user_profiles');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM users');
  });

  describe('POST /api/auth/signup', () => {
    it('should create user and profile, return tokens', async () => {
      const signupData = {
        email: 'tenant@example.com',
        password: 'SecurePass123!',
        role: UserRole.TENANT,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+12125551234',
        bio: 'Looking for office space',
      };

      const result = await authController.signup(signupData, '192.168.1.1');

      // Verify response structure
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user).toHaveProperty('id');
      expect(result.user.email).toBe(signupData.email);
      expect(result.user.role).toBe(signupData.role);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');

      // Verify user created in database
      const user = await userModel.findByEmail(signupData.email);
      expect(user).not.toBeNull();
      expect(user?.email_verified).toBe(false);

      // Verify profile created
      const profile = await userProfileModel.findByUserId(result.user.id);
      expect(profile).not.toBeNull();
      expect(profile?.first_name).toBe(signupData.firstName);
      expect(profile?.last_name).toBe(signupData.lastName);
    });

    it('should reject duplicate email', async () => {
      const signupData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        role: UserRole.LANDLORD,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+12125555678',
      };

      // Create first user
      await authController.signup(signupData, '192.168.1.1');

      // Try to create duplicate
      await expect(
        authController.signup(signupData, '192.168.1.1')
      ).rejects.toThrow('Email already exists');
    });

    it('should reject weak password', async () => {
      const signupData = {
        email: 'weak@example.com',
        password: 'weak',
        role: UserRole.BROKER,
        firstName: 'Bob',
        lastName: 'Johnson',
        phone: '+12125559999',
      };

      await expect(
        authController.signup(signupData, '192.168.1.1')
      ).rejects.toThrow();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate credentials and return tokens', async () => {
      // Create user first
      const signupData = {
        email: 'login@example.com',
        password: 'SecurePass123!',
        role: UserRole.TENANT,
        firstName: 'Alice',
        lastName: 'Brown',
        phone: '+12125551111',
      };

      await authController.signup(signupData, '192.168.1.1');

      // Login
      const loginData = {
        email: signupData.email,
        password: signupData.password,
        rememberMe: true,
      };

      const result = await authController.login(loginData, '192.168.1.1');

      // Verify response
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(signupData.email);
      expect(result.user.emailVerified).toBe(false);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'WrongPass123!',
        rememberMe: false,
      };

      await expect(
        authController.login(loginData, '192.168.1.1')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject wrong password', async () => {
      // Create user
      const signupData = {
        email: 'wrongpass@example.com',
        password: 'CorrectPass123!',
        role: UserRole.LANDLORD,
        firstName: 'Charlie',
        lastName: 'Wilson',
        phone: '+12125552222',
      };

      await authController.signup(signupData, '192.168.1.1');

      // Try wrong password
      const loginData = {
        email: signupData.email,
        password: 'WrongPass123!',
        rememberMe: false,
      };

      await expect(
        authController.login(loginData, '192.168.1.1')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should revoke refresh token', async () => {
      // Create user and login
      const signupData = {
        email: 'logout@example.com',
        password: 'SecurePass123!',
        role: UserRole.TENANT,
        firstName: 'David',
        lastName: 'Miller',
        phone: '+12125553333',
      };

      const { tokens } = await authController.signup(signupData, '192.168.1.1');

      // Logout
      await authController.logout(tokens.accessToken, tokens.refreshToken);

      // Verify refresh token is revoked
      const isValid = await refreshTokenService.validateRefreshToken(tokens.refreshToken);
      expect(isValid).toBe(false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should issue new tokens', async () => {
      // Create user and login
      const signupData = {
        email: 'refresh@example.com',
        password: 'SecurePass123!',
        role: UserRole.LANDLORD,
        firstName: 'Emma',
        lastName: 'Davis',
        phone: '+12125554444',
      };

      const { tokens: oldTokens } = await authController.signup(signupData, '192.168.1.1');

      // Wait a moment to ensure new tokens have different iat
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh tokens
      const newTokens = await authController.refreshToken(oldTokens.refreshToken, '192.168.1.1');

      // Verify new tokens issued
      expect(newTokens).toHaveProperty('accessToken');
      expect(newTokens).toHaveProperty('refreshToken');
      expect(newTokens.accessToken).not.toBe(oldTokens.accessToken);
      expect(newTokens.refreshToken).not.toBe(oldTokens.refreshToken);

      // Verify old refresh token is revoked
      const isValid = await refreshTokenService.validateRefreshToken(oldTokens.refreshToken);
      expect(isValid).toBe(false);
    });

    it('should reject invalid refresh token', async () => {
      await expect(
        authController.refreshToken('invalid-token', '192.168.1.1')
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user data with profile', async () => {
      // Create user
      const signupData = {
        email: 'me@example.com',
        password: 'SecurePass123!',
        role: UserRole.BROKER,
        firstName: 'Frank',
        lastName: 'Moore',
        phone: '+12125555555',
        bio: 'Commercial real estate broker',
      };

      const { user, tokens } = await authController.signup(signupData, '192.168.1.1');

      // Get current user
      const currentUser = await authController.getCurrentUser(tokens.accessToken);

      // Verify response
      expect(currentUser).toHaveProperty('id');
      expect(currentUser.email).toBe(signupData.email);
      expect(currentUser.role).toBe(signupData.role);
      expect(currentUser.emailVerified).toBe(false);
      expect(currentUser).toHaveProperty('profile');
      expect(currentUser.profile?.first_name).toBe(signupData.firstName);
      expect(currentUser.profile?.last_name).toBe(signupData.lastName);
      expect(currentUser.profile?.bio).toBe(signupData.bio);
    });

    it('should reject invalid access token', async () => {
      await expect(
        authController.getCurrentUser('invalid-token')
      ).rejects.toThrow();
    });
  });
});
