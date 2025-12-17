import { BusinessModel } from '../database/models/Business';
import { BusinessMetricsModel } from '../database/models/BusinessMetrics';
import { UserProfileModel } from '../database/models/UserProfile';
import { DashboardKPIs } from '../types';
import redis from '../config/redis';

/**
 * Service for calculating and caching dashboard KPIs
 */
export class KPIService {
  private businessModel: BusinessModel;
  private metricsModel: BusinessMetricsModel;
  private userProfileModel: UserProfileModel;
  private cacheTTL: number = 300; // 5 minutes in seconds

  constructor(
    businessModel?: BusinessModel,
    metricsModel?: BusinessMetricsModel,
    userProfileModel?: UserProfileModel
  ) {
    this.businessModel = businessModel || new BusinessModel();
    this.metricsModel = metricsModel || new BusinessMetricsModel();
    this.userProfileModel = userProfileModel || new UserProfileModel();
  }

  /**
   * Calculate dashboard KPIs for a user
   * Results are cached in Redis with 5-minute TTL
   *
   * @param userId - ID of the user
   * @returns Dashboard KPIs
   */
  async calculateDashboardKPIs(userId: string): Promise<DashboardKPIs> {
    // Try to get from cache first
    const cacheKey = `dashboard:kpis:${userId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache read error:', error);
      // Continue with calculation if cache fails
    }

    // Calculate KPIs
    const kpis = await this.calculateKPIs(userId);

    // Store in cache
    try {
      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(kpis));
    } catch (error) {
      console.error('Redis cache write error:', error);
      // Continue without caching if Redis fails
    }

    return kpis;
  }

  /**
   * Calculate KPIs without caching
   *
   * @param userId - ID of the user
   * @returns Dashboard KPIs
   */
  private async calculateKPIs(userId: string): Promise<DashboardKPIs> {
    // Get aggregated metrics for all user's businesses
    // aggregateByUserId already returns fully formatted DashboardKPIs
    const kpis = await this.metricsModel.aggregateByUserId(userId);

    // Get user profile to check subscription tier
    const profile = await this.userProfileModel.findByUserId(userId);

    // Landlord Views are locked for Starter tier users
    // If user is on Starter tier, override landlordViews to 0
    if (profile && profile.subscription_tier === 'starter') {
      return {
        ...kpis,
        landlordViews: 0,
      };
    }

    // Return KPIs as-is for other tiers
    return kpis;
  }

  /**
   * Calculate response rate percentage
   * Returns as formatted percentage string (e.g., "75.5%")
   *
   * @param messages - Total messages count
   * @param invites - Total property invites count
   * @returns Response rate as percentage string with % suffix
   */
  private calculateResponseRate(messages: number, invites: number): string {
    // If no invites, response rate is 0%
    if (invites === 0) {
      return "0.0%";
    }

    // Calculate rate: (messages / invites) * 100, capped at 100%
    const rate = Math.min((messages / invites) * 100, 100);

    // Round to 1 decimal place and format with % suffix
    return `${(Math.round(rate * 10) / 10).toFixed(1)}%`;
  }

  /**
   * Invalidate cached KPIs for a user
   * Called when business or metrics data changes
   *
   * @param userId - ID of the user
   */
  async invalidateCache(userId: string): Promise<void> {
    const cacheKey = `dashboard:kpis:${userId}`;

    try {
      await redis.del(cacheKey);
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }
  }

  /**
   * Invalidate cache for multiple users
   *
   * @param userIds - Array of user IDs
   */
  async invalidateCacheForUsers(userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    const keys = userIds.map(userId => `dashboard:kpis:${userId}`);

    try {
      await redis.del(...keys);
    } catch (error) {
      console.error('Redis bulk cache invalidation error:', error);
    }
  }

  /**
   * Get cached KPIs without recalculation
   * Returns null if not cached
   *
   * @param userId - ID of the user
   * @returns Cached KPIs or null
   */
  async getCachedKPIs(userId: string): Promise<DashboardKPIs | null> {
    const cacheKey = `dashboard:kpis:${userId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache read error:', error);
    }

    return null;
  }
}
