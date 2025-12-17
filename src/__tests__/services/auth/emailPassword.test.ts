import { UserModel } from '../../../database/models/User';
import { PasswordResetTokenModel } from '../../../database/models/PasswordResetToken';
import { PasswordService } from '../../../services/auth/PasswordService';
import crypto from 'crypto';

describe('Email Verification & Password Reset Flows', () => {
  let userModel: UserModel;
  let passwordResetTokenModel: PasswordResetTokenModel;
  let passwordService: PasswordService;

  beforeEach(() => {
    userModel = new UserModel();
    passwordResetTokenModel = new PasswordResetTokenModel();
    passwordService = new PasswordService();
  });

  describe('Email Verification Token', () => {
    it('should validate email verification token and mark user as verified', async () => {
      // Create a test user
      const hashedPassword = await passwordService.hashPassword('TestPass123!');
      const user = await userModel.create({
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'tenant' as any,
        email_verified: false,
      });

      // Generate and set verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await userModel.setEmailVerificationToken(user.id, token, expiresAt);

      // Verify the token was set
      const userWithToken = await userModel.findById(user.id);
      expect(userWithToken?.email_verification_token).toBe(token);
      expect(userWithToken?.email_verified).toBe(false);

      // Mark email as verified
      await userModel.verifyEmail(user.id);

      // Verify email is now verified and token is cleared
      const verifiedUser = await userModel.findById(user.id);
      expect(verifiedUser?.email_verified).toBe(true);
      expect(verifiedUser?.email_verification_token).toBeNull();
      expect(verifiedUser?.email_verification_expires_at).toBeNull();

      // Cleanup
      await userModel.delete(user.id);
    });

    it('should generate new verification token when resending', async () => {
      // Create a test user
      const hashedPassword = await passwordService.hashPassword('TestPass123!');
      const user = await userModel.create({
        email: 'test2@example.com',
        password_hash: hashedPassword,
        role: 'landlord' as any,
        email_verified: false,
      });

      // Set initial verification token
      const oldToken = crypto.randomBytes(32).toString('hex');
      const oldExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await userModel.setEmailVerificationToken(user.id, oldToken, oldExpiresAt);

      // Generate new token (simulating resend)
      const newToken = crypto.randomBytes(32).toString('hex');
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await userModel.setEmailVerificationToken(user.id, newToken, newExpiresAt);

      // Verify new token replaced old token
      const updatedUser = await userModel.findById(user.id);
      expect(updatedUser?.email_verification_token).toBe(newToken);
      expect(updatedUser?.email_verification_token).not.toBe(oldToken);

      // Cleanup
      await userModel.delete(user.id);
    });
  });

  describe('Password Reset Token', () => {
    it('should generate and validate password reset token', async () => {
      // Create a test user
      const hashedPassword = await passwordService.hashPassword('OldPass123!');
      const user = await userModel.create({
        email: 'reset@example.com',
        password_hash: hashedPassword,
        role: 'broker' as any,
        email_verified: true,
      });

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await passwordResetTokenModel.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: '127.0.0.1',
      });

      // Verify token is valid
      const isValid = await passwordResetTokenModel.isValid(tokenHash);
      expect(isValid).toBe(true);

      // Mark token as used
      await passwordResetTokenModel.markAsUsed(tokenHash);

      // Verify token is no longer valid
      const isStillValid = await passwordResetTokenModel.isValid(tokenHash);
      expect(isStillValid).toBe(false);

      // Cleanup
      await userModel.delete(user.id);
    });

    it('should update password when valid reset token is used', async () => {
      // Create a test user
      const oldPassword = 'OldPass123!';
      const hashedPassword = await passwordService.hashPassword(oldPassword);
      const user = await userModel.create({
        email: 'reset2@example.com',
        password_hash: hashedPassword,
        role: 'tenant' as any,
        email_verified: true,
      });

      // Verify old password works
      const oldPasswordValid = await passwordService.verifyPassword(
        oldPassword,
        user.password_hash!
      );
      expect(oldPasswordValid).toBe(true);

      // Update to new password
      const newPassword = 'NewPass123!';
      const newHashedPassword = await passwordService.hashPassword(newPassword);
      await userModel.update(user.id, { password_hash: newHashedPassword });

      // Verify new password works and old doesn't
      const updatedUser = await userModel.findById(user.id);
      const newPasswordValid = await passwordService.verifyPassword(
        newPassword,
        updatedUser!.password_hash!
      );
      const oldPasswordStillValid = await passwordService.verifyPassword(
        oldPassword,
        updatedUser!.password_hash!
      );
      expect(newPasswordValid).toBe(true);
      expect(oldPasswordStillValid).toBe(false);

      // Cleanup
      await userModel.delete(user.id);
    });

    it('should expire password reset token after 1 hour', async () => {
      // Create a test user
      const hashedPassword = await passwordService.hashPassword('TestPass123!');
      const user = await userModel.create({
        email: 'expire@example.com',
        password_hash: hashedPassword,
        role: 'landlord' as any,
        email_verified: true,
      });

      // Generate reset token with expired timestamp
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      // Store expired reset token
      await passwordResetTokenModel.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: '127.0.0.1',
      });

      // Verify token is not valid (expired)
      const isValid = await passwordResetTokenModel.isValid(tokenHash);
      expect(isValid).toBe(false);

      // Cleanup
      await userModel.delete(user.id);
    });

    it('should invalidate all unused tokens for user', async () => {
      // Create a test user
      const hashedPassword = await passwordService.hashPassword('TestPass123!');
      const user = await userModel.create({
        email: 'multi@example.com',
        password_hash: hashedPassword,
        role: 'tenant' as any,
        email_verified: true,
      });

      // Create multiple reset tokens
      const token1Hash = crypto
        .createHash('sha256')
        .update('token1')
        .digest('hex');
      const token2Hash = crypto
        .createHash('sha256')
        .update('token2')
        .digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await passwordResetTokenModel.create({
        user_id: user.id,
        token_hash: token1Hash,
        expires_at: expiresAt,
        ip_address: '127.0.0.1',
      });

      await passwordResetTokenModel.create({
        user_id: user.id,
        token_hash: token2Hash,
        expires_at: expiresAt,
        ip_address: '127.0.0.1',
      });

      // Verify both tokens are valid
      expect(await passwordResetTokenModel.isValid(token1Hash)).toBe(true);
      expect(await passwordResetTokenModel.isValid(token2Hash)).toBe(true);

      // Invalidate all tokens for user
      const invalidatedCount = await passwordResetTokenModel.invalidateAllForUser(
        user.id
      );
      expect(invalidatedCount).toBe(2);

      // Verify both tokens are now invalid
      expect(await passwordResetTokenModel.isValid(token1Hash)).toBe(false);
      expect(await passwordResetTokenModel.isValid(token2Hash)).toBe(false);

      // Cleanup
      await userModel.delete(user.id);
    });
  });

  describe('Password Strength Validation', () => {
    it('should validate password meets strength requirements', () => {
      // Valid passwords
      expect(passwordService.validatePasswordStrength('TestPass123!')).toBe(true);
      expect(passwordService.validatePasswordStrength('Abcd1234@')).toBe(true);
      expect(passwordService.validatePasswordStrength('MyS3cur3P@ss')).toBe(true);

      // Invalid passwords - too short
      expect(passwordService.validatePasswordStrength('Test1!')).toBe(false);

      // Invalid passwords - missing uppercase
      expect(passwordService.validatePasswordStrength('testpass123!')).toBe(false);

      // Invalid passwords - missing lowercase
      expect(passwordService.validatePasswordStrength('TESTPASS123!')).toBe(false);

      // Invalid passwords - missing number
      expect(passwordService.validatePasswordStrength('TestPass!')).toBe(false);

      // Invalid passwords - missing special character
      expect(passwordService.validatePasswordStrength('TestPass123')).toBe(false);
    });
  });
});
