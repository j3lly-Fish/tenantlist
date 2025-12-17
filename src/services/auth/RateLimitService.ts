import Redis from 'ioredis';

/**
 * Rate limit types for different operations
 */
export enum RateLimitType {
  LOGIN_IP = 'login:ip',
  LOGIN_EMAIL = 'login:email',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
}

/**
 * Rate limit configuration for each type
 */
interface RateLimitConfig {
  maxAttempts: number;
  windowSeconds: number;
}

const RATE_LIMIT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
  [RateLimitType.LOGIN_IP]: {
    maxAttempts: 10,
    windowSeconds: 15 * 60, // 15 minutes
  },
  [RateLimitType.LOGIN_EMAIL]: {
    maxAttempts: 5,
    windowSeconds: 15 * 60, // 15 minutes
  },
  [RateLimitType.PASSWORD_RESET]: {
    maxAttempts: 3,
    windowSeconds: 60 * 60, // 1 hour
  },
  [RateLimitType.EMAIL_VERIFICATION]: {
    maxAttempts: 3,
    windowSeconds: 60 * 60, // 1 hour
  },
};

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until retry allowed
}

/**
 * Service for rate limiting using Redis
 */
export class RateLimitService {
  private redis: Redis;
  private readonly KEY_PREFIX = 'rate_limit:';

  constructor() {
    // Initialize Redis client
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully for rate limiting');
    });
  }

  /**
   * Generate Redis key for rate limiting
   * @param type - Rate limit type
   * @param identifier - IP address or email
   * @returns Redis key
   */
  private getKey(type: RateLimitType, identifier: string): string {
    return `${this.KEY_PREFIX}${type}:${identifier}`;
  }

  /**
   * Check rate limit and increment counter
   * @param type - Rate limit type
   * @param identifier - IP address or email
   * @returns Rate limit result
   */
  async checkRateLimit(type: RateLimitType, identifier: string): Promise<RateLimitResult> {
    try {
      const config = RATE_LIMIT_CONFIGS[type];
      const key = this.getKey(type, identifier);

      // Get current attempt count
      const currentAttempts = await this.redis.get(key);
      const attempts = currentAttempts ? parseInt(currentAttempts, 10) : 0;

      // Check if limit exceeded
      if (attempts >= config.maxAttempts) {
        const ttl = await this.redis.ttl(key);
        const resetAt = new Date(Date.now() + ttl * 1000);

        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter: ttl > 0 ? ttl : config.windowSeconds,
        };
      }

      // Increment counter
      const newAttempts = await this.redis.incr(key);

      // Set expiry if this is the first attempt
      if (newAttempts === 1) {
        await this.redis.expire(key, config.windowSeconds);
      }

      // Get TTL for reset time
      const ttl = await this.redis.ttl(key);
      const resetAt = new Date(Date.now() + ttl * 1000);

      return {
        allowed: true,
        remaining: Math.max(0, config.maxAttempts - newAttempts),
        resetAt,
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Fail open in case of Redis error - allow request
      // In production with high security needs, might want to fail closed
      return {
        allowed: true,
        remaining: 0,
        resetAt: new Date(Date.now() + 900000), // 15 minutes from now
      };
    }
  }

  /**
   * Get current rate limit status without incrementing
   * @param type - Rate limit type
   * @param identifier - IP address or email
   * @returns Rate limit result
   */
  async getRateLimitStatus(type: RateLimitType, identifier: string): Promise<RateLimitResult> {
    try {
      const config = RATE_LIMIT_CONFIGS[type];
      const key = this.getKey(type, identifier);

      // Get current attempt count
      const currentAttempts = await this.redis.get(key);
      const attempts = currentAttempts ? parseInt(currentAttempts, 10) : 0;

      // Get TTL for reset time
      const ttl = await this.redis.ttl(key);
      const resetAt = ttl > 0
        ? new Date(Date.now() + ttl * 1000)
        : new Date(Date.now() + config.windowSeconds * 1000);

      const remaining = Math.max(0, config.maxAttempts - attempts);
      const allowed = attempts < config.maxAttempts;

      return {
        allowed,
        remaining,
        resetAt,
        retryAfter: !allowed && ttl > 0 ? ttl : undefined,
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return {
        allowed: true,
        remaining: 0,
        resetAt: new Date(Date.now() + 900000),
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   * @param type - Rate limit type
   * @param identifier - IP address or email
   */
  async resetRateLimit(type: RateLimitType, identifier: string): Promise<void> {
    try {
      const key = this.getKey(type, identifier);
      await this.redis.del(key);
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  /**
   * Get rate limit headers for HTTP response
   * @param result - Rate limit result
   * @param type - Rate limit type
   * @returns Headers object
   */
  getRateLimitHeaders(result: RateLimitResult, type: RateLimitType): Record<string, string> {
    const config = RATE_LIMIT_CONFIGS[type];

    return {
      'X-RateLimit-Limit': config.maxAttempts.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.floor(result.resetAt.getTime() / 1000).toString(),
      ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
    };
  }

  /**
   * Close Redis connection (for cleanup)
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
