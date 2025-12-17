import crypto from 'crypto';
import { RefreshTokenModel } from '../../database/models/RefreshToken';
import { Pool } from 'pg';

/**
 * Service for handling refresh token generation, hashing, and rotation
 */
export class RefreshTokenService {
  private refreshTokenModel: RefreshTokenModel;

  constructor(customPool?: Pool) {
    this.refreshTokenModel = new RefreshTokenModel(customPool);
  }

  /**
   * Generate a cryptographically secure refresh token
   * @returns 128-character hex string (64 bytes)
   */
  generateRefreshToken(): string {
    // Generate 64 random bytes and convert to hex string (128 characters)
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash a refresh token using SHA256
   * @param token - Plain text token to hash
   * @returns SHA256 hash as hex string (64 characters)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Calculate refresh token expiry date
   * @param rememberMe - Whether "Remember Me" is enabled
   * @returns Expiry date (30 days if Remember Me, 24 hours otherwise)
   */
  calculateExpiry(rememberMe: boolean): Date {
    const now = new Date();
    if (rememberMe) {
      // 30 days
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // 24 hours
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Create and store a new refresh token
   * @param userId - User ID to associate with token
   * @param rememberMe - Whether "Remember Me" is enabled
   * @param ipAddress - Optional IP address for audit trail
   * @returns Object containing plain token and database record
   */
  async createRefreshToken(
    userId: string,
    rememberMe: boolean = false,
    ipAddress?: string
  ): Promise<{ token: string; tokenRecord: any }> {
    const token = this.generateRefreshToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = this.calculateExpiry(rememberMe);

    const tokenRecord = await this.refreshTokenModel.create({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: ipAddress || null,
    });

    return { token, tokenRecord };
  }

  /**
   * Validate a refresh token
   * @param token - Plain text token to validate
   * @returns True if token is valid (not revoked, not expired), false otherwise
   */
  async validateRefreshToken(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    return await this.refreshTokenModel.isValid(tokenHash);
  }

  /**
   * Revoke a refresh token (part of token rotation)
   * @param token - Plain text token to revoke
   * @returns True if token was revoked, false otherwise
   */
  async revokeRefreshToken(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    return await this.refreshTokenModel.revoke(tokenHash);
  }

  /**
   * Revoke all refresh tokens for a user (e.g., on password change)
   * @param userId - User ID whose tokens should be revoked
   * @returns Number of tokens revoked
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    return await this.refreshTokenModel.revokeAllForUser(userId);
  }

  /**
   * Get refresh token record by token
   * @param token - Plain text token
   * @returns Token record or null if not found
   */
  async getTokenRecord(token: string): Promise<any | null> {
    const tokenHash = this.hashToken(token);
    return await this.refreshTokenModel.findByTokenHash(tokenHash);
  }

  /**
   * Rotate refresh token (revoke old, create new)
   * @param oldToken - Old token to revoke
   * @param userId - User ID for new token
   * @param rememberMe - Whether "Remember Me" is enabled
   * @param ipAddress - Optional IP address for audit trail
   * @returns New token and record
   */
  async rotateRefreshToken(
    oldToken: string,
    userId: string,
    rememberMe: boolean = false,
    ipAddress?: string
  ): Promise<{ token: string; tokenRecord: any }> {
    // Revoke old token
    await this.revokeRefreshToken(oldToken);

    // Create new token
    return await this.createRefreshToken(userId, rememberMe, ipAddress);
  }
}
