import { Pool } from 'pg';
import pool from '../../config/database';
import { AuthController } from '../../controllers/AuthController';
import { AuthService } from '../../services/auth/AuthService';
import { UserModel } from '../../database/models/User';
import { PasswordResetTokenModel } from '../../database/models/PasswordResetToken';
import { UserRole } from '../../types';
import crypto from 'crypto';

/**
 * Email Verification and Password Reset Flow Tests
 * Tests for Task Group 4: Email Verification & Password Reset
 *
 * Test Coverage:
 * - Email verification token validation
 * - Email verification marks user as verified
 * - Resend verification generates new token
 * - Password reset token generation and email sending
 * - Password reset with valid token updates password
 * - Password reset token expires after 1 hour or first use
 */

describe('Email Verification & Password Reset Flows', () => {
  let authController: AuthController;
  let authService: AuthService;
  let userModel: UserModel;
  let passwordResetTokenModel: PasswordResetTokenModel;

  beforeAll(async () => {
    // Initialize services and controllers
    authService = new AuthService(pool);
    authController = new AuthController(authService);
    userModel = new UserModel(pool);
    passwordResetTokenModel = new PasswordResetTokenModel(pool);
  });

  afterAll(async () => {
    // Clean up database
    await pool.query('DELETE FROM user_profiles');
    await pool.query('DELETE FROM password_reset_tokens');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM users');
    await pool.end();
  });

  afterEach(async () => {
    // Clean up after each test
    await pool.query('DELETE FROM user_profiles');
    await pool.query('DELETE FROM password_reset_tokens');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM users');
  });

  describe('Email Verification Flow', () => {
    it('should validate token and mark user email as verified', async () => {
      // Create user
      const signupData = {
        email: 'verify@example.com',
        password: 'SecurePass123!',
        role: UserRole.TENANT,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+12125551234',
      };

      const { user } = await authController.signup(signupData, '192.168.1.1');

      // Get user to check email_verified status
      let dbUser = await userModel.findById(user.id);
      expect(dbUser?.email_verified).toBe(false);
      expect(dbUser?.email_verification_token).not.toBeNull();

      // Verify email
      const token = dbUser!.email_verification_token!;
      const result = await authController.verifyEmail({ token });

      expect(result.message).toBe('Email verified successfully');

      // Check user is verified
      dbUser = await userModel.findById(user.id);
      expect(dbUser?.email_verified).toBe(true);
      expect(dbUser?.email_verification_token).toBeNull();
      expect(dbUser?.email_verification_expires_at).toBeNull();
    });

    it('should reject invalid verification token', async () => {
      await expect(
        authController.verifyEmail({ token: 'invalid-token' })
      ).rejects.toThrow('Invalid or expired verification token');
    });

    it('should reject expired verification token', async () => {
      // Create user with expired token
      const signupData = {
        email: 'expired@example.com',
        password: 'SecurePass123!',
        role: UserRole.TENANT,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+12125555678',
      };

      const { user } = await authController.signup(signupData, '192.168.1.1');

      // Manually set token to expired
      const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      await pool.query(
        'UPDATE users SET email_verification_expires_at = $1 WHERE id = $2',
        [expiredDate, user.id]
      );

      const dbUser = await userModel.findById(user.id);
      const token = dbUser!.email_verification_token!;

      await expect(
        authController.verifyEmail({ token })
      ).rejects.toThrow('Invalid or expired verification token');
    });

    it('should generate new token when resending verification', async () => {
      // Create user
      const signupData = {
        email: 'resend@example.com',
        password: 'SecurePass123!',
        role: UserRole.LANDLORD,
        firstName: 'Bob',
        lastName: 'Johnson',
        phone: '+12125559999',
      };

      const { user } = await authController.signup(signupData, '192.168.1.1');

      // Get original token
      let dbUser = await userModel.findById(user.id);
      const originalToken = dbUser!.email_verification_token;

      // Resend verification
      const result = await authController.resendVerification({ email: signupData.email });

      expect(result.message).toBe('Verification email sent');

      // Check token changed
      dbUser = await userModel.findById(user.id);
      expect(dbUser?.email_verification_token).not.toBeNull();
      expect(dbUser?.email_verification_token).not.toBe(originalToken);
    });

    it('should reject resend verification for already verified user', async () => {
      // Create and verify user
      const signupData = {
        email: 'alreadyverified@example.com',
        password: 'SecurePass123!',
        role: UserRole.BROKER,
        firstName: 'Alice',
        lastName: 'Brown',
        phone: '+12125551111',
      };

      const { user } = await authController.signup(signupData, '192.168.1.1');

      // Verify email
      const dbUser = await userModel.findById(user.id);
      await authController.verifyEmail({ token: dbUser!.email_verification_token! });

      // Try to resend
      await expect(
        authController.resendVerification({ email: signupData.email })
      ).rejects.toThrow('Email already verified');
    });
  });

  describe('Password Reset Flow', () => {
    it('should generate password reset token and send email', async () => {
      // Create user
      const signupData = {
        email: 'reset@example.com',
        password: 'OldPass123!',
        role: UserRole.TENANT,
        firstName: 'Charlie',
        lastName: 'Wilson',
        phone: '+12125552222',
      };

      await authController.signup(signupData, '192.168.1.1');

      // Request password reset
      const result = await authController.forgotPassword({ email: signupData.email });

      expect(result.message).toBe('Password reset email sent if account exists');

      // Check token created in database
      const tokens = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE user_id = (SELECT id FROM users WHERE email = $1)',
        [signupData.email]
      );

      expect(tokens.rows.length).toBeGreaterThan(0);
      expect(tokens.rows[0].used_at).toBeNull();
    });

    it('should return generic message for non-existent email (security)', async () => {
      const result = await authController.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.message).toBe('Password reset email sent if account exists');
    });

    it('should reset password with valid token', async () => {
      // Create user
      const signupData = {
        email: 'resetvalid@example.com',
        password: 'OldPass123!',
        role: UserRole.LANDLORD,
        firstName: 'David',
        lastName: 'Miller',
        phone: '+12125553333',
      };

      const { user } = await authController.signup(signupData, '192.168.1.1');

      // Generate reset token
      await authController.forgotPassword({ email: signupData.email });

      // Get token from database (simulate getting from email)
      const tokenRecord = await pool.query(
        'SELECT * FROM password_reset_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user.id]
      );

      // Hash the token to match what would be in the URL
      const rawToken = crypto.randomBytes(32).toString('hex');

      // Update the token record with a known hash for testing
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await pool.query(
        'UPDATE password_reset_tokens SET token_hash = $1 WHERE id = $2',
        [tokenHash, tokenRecord.rows[0].id]
      );

      // Reset password
      const newPassword = 'NewPass123!';
      const result = await authController.resetPassword({
        token: rawToken,
        newPassword,
      });

      expect(result.message).toBe('Password reset successful');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');

      // Verify token marked as used
      const usedToken = await passwordResetTokenModel.findByTokenHash(tokenHash);
      expect(usedToken?.used_at).not.toBeNull();

      // Verify can login with new password
      const loginResult = await authController.login({
        email: signupData.email,
        password: newPassword,
        rememberMe: false,
      }, '192.168.1.1');

      expect(loginResult).toHaveProperty('tokens');
    });

    it('should reject expired password reset token', async () => {
      // Create user
      const signupData = {
        email: 'expiredtoken@example.com',
        password: 'OldPass123!',
        role: UserRole.BROKER,
        firstName: 'Emma',
        lastName: 'Davis',
        phone: '+12125554444',
      };

      const { user } = await authController.signup(signupData, '192.168.1.1');

      // Create expired token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      await passwordResetTokenModel.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiredDate,
        ip_address: '192.168.1.1',
      });

      // Try to reset password
      await expect(
        authController.resetPassword({
          token: rawToken,
          newPassword: 'NewPass123!',
        })
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should reject already used password reset token', async () => {
      // Create user
      const signupData = {
        email: 'usedtoken@example.com',
        password: 'OldPass123!',
        role: UserRole.TENANT,
        firstName: 'Frank',
        lastName: 'Moore',
        phone: '+12125555555',
      };

      const { user } = await authController.signup(signupData, '192.168.1.1');

      // Create token and mark as used
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await passwordResetTokenModel.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: '192.168.1.1',
      });

      await passwordResetTokenModel.markAsUsed(tokenHash);

      // Try to reset password
      await expect(
        authController.resetPassword({
          token: rawToken,
          newPassword: 'NewPass123!',
        })
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });
});
