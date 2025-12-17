import { Pool } from 'pg';
import pool from '../../config/database';
import { UserModel } from '../../database/models/User';
import { UserProfileModel } from '../../database/models/UserProfile';
import { PasswordResetTokenModel } from '../../database/models/PasswordResetToken';
import { PasswordService } from './PasswordService';
import { JwtService } from './JwtService';
import { RefreshTokenService } from './RefreshTokenService';
import { TokenBlacklistService } from './TokenBlacklistService';
import { EmailService } from '../email/EmailService';
import { notificationService } from '../NotificationService';
import { UserRole, User, UserProfile } from '../../types';
import crypto from 'crypto';

export interface SignupData {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  photo?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithProfile extends User {
  profile?: UserProfile;
}

/**
 * Service for handling authentication operations
 */
export class AuthService {
  private userModel: UserModel;
  private userProfileModel: UserProfileModel;
  private passwordResetTokenModel: PasswordResetTokenModel;
  private passwordService: PasswordService;
  private jwtService: JwtService;
  private refreshTokenService: RefreshTokenService;
  private blacklistService: TokenBlacklistService;
  private emailService: EmailService;

  constructor(customPool?: Pool) {
    this.userModel = new UserModel(customPool);
    this.userProfileModel = new UserProfileModel(customPool);
    this.passwordResetTokenModel = new PasswordResetTokenModel(customPool);
    this.passwordService = new PasswordService();
    this.jwtService = new JwtService();
    this.refreshTokenService = new RefreshTokenService(customPool);
    this.blacklistService = new TokenBlacklistService();
    this.emailService = new EmailService();
  }

  /**
   * Sign up a new user with email and password
   * Profile fields are now optional - profile can be completed later
   */
  async signup(data: SignupData, ipAddress?: string): Promise<{ user: UserWithProfile; tokens: AuthTokens }> {
    // Validate password strength
    if (!this.passwordService.validatePasswordStrength(data.password)) {
      throw new Error(this.passwordService.getPasswordRequirements());
    }

    // Check if user already exists
    const existingUser = await this.userModel.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(data.password);

    // Create user
    const user = await this.userModel.create({
      email: data.email,
      password_hash: passwordHash,
      role: data.role,
      email_verified: false,
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await this.userModel.setEmailVerificationToken(user.id, verificationToken, expiresAt);

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    // Create user profile if all required fields are provided
    let profile: UserProfile | undefined;
    if (data.firstName && data.lastName && data.phone) {
      profile = await this.userProfileModel.create({
        user_id: user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        bio: data.bio || null,
        photo_url: data.photo || null,
      });
    }

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
    const { token: refreshToken } = await this.refreshTokenService.createRefreshToken(
      user.id,
      false, // Default to false for signup
      ipAddress
    );

    const userWithProfile = { ...user, profile };

    return {
      user: userWithProfile,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Log in a user with email and password
   */
  async login(data: LoginData, ipAddress?: string): Promise<{ user: UserWithProfile; tokens: AuthTokens }> {
    // Find user by email
    const user = await this.userModel.findByEmail(data.email);
    if (!user || !user.password_hash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.passwordService.verifyPassword(data.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Update last login timestamp
    await this.userModel.updateLastLogin(user.id);

    // Get user profile
    const profile = await this.userProfileModel.findByUserId(user.id);

    // Generate tokens
    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
    const { token: refreshToken } = await this.refreshTokenService.createRefreshToken(
      user.id,
      data.rememberMe || false,
      ipAddress
    );

    const userWithProfile = { ...user, profile: profile || undefined };

    return {
      user: userWithProfile,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Log out a user by revoking tokens
   */
  async logout(accessToken: string, refreshToken: string): Promise<void> {
    // Revoke refresh token
    await this.refreshTokenService.revokeRefreshToken(refreshToken);

    // Blacklist access token
    await this.blacklistService.blacklistToken(accessToken, 900); // 15 minutes TTL
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string, ipAddress?: string): Promise<AuthTokens> {
    // Validate refresh token
    const isValid = await this.refreshTokenService.validateRefreshToken(refreshToken);
    if (!isValid) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get token record to get user ID
    const tokenRecord = await this.refreshTokenService.getTokenRecord(refreshToken);
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    // Get user
    const user = await this.userModel.findById(tokenRecord.user_id);
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    // Check if token is close to expiry to determine rememberMe value
    const expiresAt = new Date(tokenRecord.expires_at);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    const rememberMe = hoursUntilExpiry > 48; // If more than 48 hours left, it was a 30-day token

    // Rotate refresh token
    const { token: newRefreshToken } = await this.refreshTokenService.rotateRefreshToken(
      refreshToken,
      user.id,
      rememberMe,
      ipAddress
    );

    // Generate new access token
    const newAccessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Get current authenticated user with profile
   */
  async getCurrentUser(userId: string): Promise<UserWithProfile> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profile = await this.userProfileModel.findByUserId(userId);

    return { ...user, profile: profile || undefined };
  }

  /**
   * Verify access token and check if blacklisted
   */
  async verifyAccessToken(token: string): Promise<{ userId: string; email: string; role: UserRole } | null> {
    // Check if token is blacklisted
    const isBlacklisted = await this.blacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      return null;
    }

    // Verify token
    const payload = this.jwtService.verifyAccessToken(token);
    if (!payload) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }

  /**
   * Verify email address with token
   */
  async verifyEmail(token: string): Promise<void> {
    // Find user by verification token
    const result = await this.userModel['pool'].query(
      `SELECT u.*, up.first_name FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.email_verification_token = $1
       AND u.email_verification_expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired verification token');
    }

    const user = result.rows[0];

    // Mark email as verified
    await this.userModel.verifyEmail(user.id);

    // Send welcome email
    const recipientName = user.first_name || user.email.split('@')[0];
    try {
      await this.emailService.sendWelcomeEmail(user.email, recipientName);
    } catch (error) {
      // Log but don't fail verification if welcome email fails
      console.error('Failed to send welcome email:', error);
    }
  }

  /**
   * Resend email verification
   */
  async resendVerification(email: string): Promise<void> {
    // Find user by email
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already verified
    if (user.email_verified) {
      throw new Error('Email already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await this.userModel.setEmailVerificationToken(user.id, verificationToken, expiresAt);

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken);
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string, ipAddress?: string): Promise<void> {
    // Find user by email (don't reveal if user exists)
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      // Return silently for security (don't reveal user doesn't exist)
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed token in database
    await this.passwordResetTokenModel.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: ipAddress || null,
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string, ipAddress?: string): Promise<AuthTokens> {
    // Validate new password strength
    if (!this.passwordService.validatePasswordStrength(newPassword)) {
      throw new Error(this.passwordService.getPasswordRequirements());
    }

    // Hash the token to find it in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Validate token (not expired and not used)
    const isValid = await this.passwordResetTokenModel.isValid(tokenHash);
    if (!isValid) {
      throw new Error('Invalid or expired reset token');
    }

    // Get token record to get user ID
    const tokenRecord = await this.passwordResetTokenModel.findByTokenHash(tokenHash);
    if (!tokenRecord) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await this.passwordService.hashPassword(newPassword);

    // Update user password
    await this.userModel.update(tokenRecord.user_id, { password_hash: passwordHash });

    // Mark token as used
    await this.passwordResetTokenModel.markAsUsed(tokenHash);

    // Invalidate all other unused tokens for this user
    await this.passwordResetTokenModel.invalidateAllForUser(tokenRecord.user_id);

    // Get user for token generation
    const user = await this.userModel.findById(tokenRecord.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens (auto-login)
    const accessToken = this.jwtService.generateAccessToken(user.id, user.email, user.role);
    const { token: refreshToken } = await this.refreshTokenService.createRefreshToken(
      user.id,
      false,
      ipAddress
    );

    // Send account update notification
    try {
      await notificationService.sendAccountUpdateNotification(
        user.id,
        'Password Changed',
        'Your password was successfully changed. If you did not make this change, please contact support immediately.'
      );
    } catch (error) {
      // Log but don't fail password reset if notification fails
      console.error('Failed to send password change notification:', error);
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Change password for authenticated user
   * Requires current password verification
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify user has a password (not OAuth-only)
    if (!user.password_hash) {
      throw new Error('Cannot change password for OAuth accounts');
    }

    // Verify current password
    const isValidPassword = await this.passwordService.verifyPassword(
      currentPassword,
      user.password_hash
    );
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    if (!this.passwordService.validatePasswordStrength(newPassword)) {
      throw new Error(this.passwordService.getPasswordRequirements());
    }

    // Check that new password is different from current
    const isSamePassword = await this.passwordService.verifyPassword(
      newPassword,
      user.password_hash
    );
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(newPassword);

    // Update password
    await this.userModel.update(userId, { password_hash: newPasswordHash });

    // Send account update notification
    try {
      await notificationService.sendAccountUpdateNotification(
        userId,
        'Password Changed',
        'Your password was successfully changed. If you did not make this change, please contact support immediately.'
      );
    } catch (error) {
      console.error('Failed to send password change notification:', error);
    }
  }
}
