import Redis from 'ioredis';
import crypto from 'crypto';

/**
 * Service for blacklisting JWT access tokens on logout using Redis
 */
export class TokenBlacklistService {
  private redis: Redis;
  private readonly KEY_PREFIX = 'blacklist:accessToken:';

  constructor() {
    // Initialize Redis client
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  /**
   * Hash token for storage (to avoid storing full JWT)
   * @param token - JWT token to hash
   * @returns SHA256 hash of token
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Blacklist an access token
   * @param token - JWT access token to blacklist
   * @param ttlSeconds - Time to live in seconds (should match token expiry)
   * @returns True if successfully blacklisted
   */
  async blacklistToken(token: string, ttlSeconds: number = 900): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      const key = `${this.KEY_PREFIX}${tokenHash}`;

      // Set key with TTL (15 minutes = 900 seconds by default)
      await this.redis.setex(key, ttlSeconds, '1');
      return true;
    } catch (error) {
      console.error('Error blacklisting token:', error);
      return false;
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token - JWT access token to check
   * @returns True if token is blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      const key = `${this.KEY_PREFIX}${tokenHash}`;

      const result = await this.redis.get(key);
      return result !== null;
    } catch (error) {
      console.error('Error checking blacklist:', error);
      // Fail open in case of Redis error - assume not blacklisted
      // In production, might want to fail closed for security
      return false;
    }
  }

  /**
   * Remove a token from blacklist (for testing purposes)
   * @param token - JWT access token to remove
   * @returns True if successfully removed
   */
  async removeFromBlacklist(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      const key = `${this.KEY_PREFIX}${tokenHash}`;

      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Error removing token from blacklist:', error);
      return false;
    }
  }

  /**
   * Clear all blacklisted tokens (for testing purposes)
   * WARNING: Use with caution, only in development/testing
   */
  async clearAllBlacklisted(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing blacklist:', error);
    }
  }

  /**
   * Close Redis connection (for cleanup)
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
