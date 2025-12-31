import { Pool } from 'pg';
import pool from '../config/database';
import redis from '../config/redis';

/**
 * Trend data for KPI metrics
 */
export interface TrendData {
  value: number; // percentage change
  direction: 'up' | 'down' | 'neutral';
  period: string; // e.g., "vs last week"
}

/**
 * KPI metric with trend
 */
export interface KPIMetric {
  value: number;
  trend: TrendData;
}

/**
 * Property dashboard KPIs
 */
export interface PropertyKPIData {
  totalListings: KPIMetric;
  activeListings: KPIMetric;
  avgDaysOnMarket: KPIMetric;
  responseRate: KPIMetric;
}

/**
 * Service for calculating and caching property dashboard KPIs
 * Uses Redis caching with 5-minute TTL
 */
export class PropertyKPIService {
  private pool: Pool;
  private cacheTTL: number = 300; // 5 minutes in seconds

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Calculate property KPIs for a user with trend data
   * Compares current values vs 7 days ago
   *
   * @param userId - ID of the user
   * @returns Property KPIs with trends
   */
  async calculateKPIs(userId: string): Promise<PropertyKPIData> {
    // Calculate current KPIs
    const currentKPIs = await this.calculateCurrentKPIs(userId);

    // Calculate historical KPIs (7 days ago)
    const historicalKPIs = await this.calculateHistoricalKPIs(userId);

    // Build KPI data with trends
    return {
      totalListings: {
        value: currentKPIs.totalListings,
        trend: this.calculateTrend(
          currentKPIs.totalListings,
          historicalKPIs.totalListings
        ),
      },
      activeListings: {
        value: currentKPIs.activeListings,
        trend: this.calculateTrend(
          currentKPIs.activeListings,
          historicalKPIs.activeListings
        ),
      },
      avgDaysOnMarket: {
        value: currentKPIs.avgDaysOnMarket,
        trend: this.calculateTrend(
          currentKPIs.avgDaysOnMarket,
          historicalKPIs.avgDaysOnMarket
        ),
      },
      responseRate: {
        value: currentKPIs.responseRate,
        trend: this.calculateTrend(
          currentKPIs.responseRate,
          historicalKPIs.responseRate
        ),
      },
    };
  }

  /**
   * Calculate current KPI values
   *
   * @param userId - ID of the user
   * @returns Current KPI values
   */
  private async calculateCurrentKPIs(userId: string): Promise<{
    totalListings: number;
    activeListings: number;
    avgDaysOnMarket: number;
    responseRate: number;
  }> {
    // Total listings count
    const totalResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM property_listings WHERE user_id = $1',
      [userId]
    );
    const totalListings = parseInt(totalResult.rows[0].count, 10);

    // Active listings count
    const activeResult = await this.pool.query(
      "SELECT COUNT(*) as count FROM property_listings WHERE user_id = $1 AND status = 'active'",
      [userId]
    );
    const activeListings = parseInt(activeResult.rows[0].count, 10);

    // Average days on market (for active listings only)
    // Calculate dynamically from created_at
    const daysResult = await this.pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400)::FLOAT as avg
       FROM property_listings
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const avgDaysOnMarket = parseFloat(daysResult.rows[0].avg) || 0;

    // Response rate calculation: (total_inquiries / total_views) * 100
    // Aggregate from property_listing_metrics
    const responseResult = await this.pool.query(
      `SELECT
        COALESCE(SUM(plm.views_count), 0) as total_views,
        COALESCE(SUM(plm.inquiries_count), 0) as total_inquiries
       FROM property_listings pl
       LEFT JOIN property_listing_metrics plm ON pl.id = plm.property_listing_id
       WHERE pl.user_id = $1`,
      [userId]
    );
    const totalViews = parseInt(responseResult.rows[0].total_views, 10);
    const totalInquiries = parseInt(responseResult.rows[0].total_inquiries, 10);
    const responseRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

    return {
      totalListings,
      activeListings,
      avgDaysOnMarket: Math.round(avgDaysOnMarket),
      responseRate: Math.round(responseRate * 10) / 10, // Round to 1 decimal
    };
  }

  /**
   * Calculate historical KPI values (7 days ago)
   * Uses a snapshot approach by filtering data that existed 7 days ago
   *
   * @param userId - ID of the user
   * @returns Historical KPI values
   */
  private async calculateHistoricalKPIs(userId: string): Promise<{
    totalListings: number;
    activeListings: number;
    avgDaysOnMarket: number;
    responseRate: number;
  }> {
    // For properties that existed 7 days ago (created before 7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Total listings that existed 7 days ago
    const totalResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM property_listings WHERE user_id = $1 AND created_at <= $2',
      [userId, sevenDaysAgo]
    );
    const totalListings = parseInt(totalResult.rows[0].count, 10);

    // Active listings 7 days ago (properties that were active and created before 7 days ago)
    // Note: We don't have status history, so we approximate by checking current active ones
    const activeResult = await this.pool.query(
      `SELECT COUNT(*) as count
       FROM property_listings
       WHERE user_id = $1 AND status = 'active' AND created_at <= $2`,
      [userId, sevenDaysAgo]
    );
    const activeListings = parseInt(activeResult.rows[0].count, 10);

    // Average days on market 7 days ago
    // Calculate what the days_on_market would have been 7 days ago
    const daysResult = await this.pool.query(
      `SELECT AVG(EXTRACT(DAY FROM $2 - created_at))::FLOAT as avg
       FROM property_listings
       WHERE user_id = $1 AND status = 'active' AND created_at <= $2`,
      [userId, sevenDaysAgo]
    );
    const avgDaysOnMarket = parseFloat(daysResult.rows[0].avg) || 0;

    // Response rate 7 days ago
    // This is approximate - we use metrics up to 7 days ago
    const responseResult = await this.pool.query(
      `SELECT
        COALESCE(SUM(plm.views_count), 0) as total_views,
        COALESCE(SUM(plm.inquiries_count), 0) as total_inquiries
       FROM property_listings pl
       LEFT JOIN property_listing_metrics plm ON pl.id = plm.property_listing_id
       WHERE pl.user_id = $1 AND pl.created_at <= $2`,
      [userId, sevenDaysAgo]
    );
    const totalViews = parseInt(responseResult.rows[0].total_views, 10);
    const totalInquiries = parseInt(responseResult.rows[0].total_inquiries, 10);
    const responseRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

    return {
      totalListings,
      activeListings,
      avgDaysOnMarket: Math.round(avgDaysOnMarket),
      responseRate: Math.round(responseRate * 10) / 10,
    };
  }

  /**
   * Calculate trend from current and historical values
   *
   * @param currentValue - Current KPI value
   * @param historicalValue - Historical KPI value (7 days ago)
   * @returns Trend data with direction and percentage change
   */
  private calculateTrend(currentValue: number, historicalValue: number): TrendData {
    // If historical value is 0, we can't calculate percentage change
    if (historicalValue === 0) {
      if (currentValue > 0) {
        return {
          value: 100,
          direction: 'up',
          period: 'vs last week',
        };
      }
      return {
        value: 0,
        direction: 'neutral',
        period: 'vs last week',
      };
    }

    // Calculate percentage change
    const percentageChange = ((currentValue - historicalValue) / historicalValue) * 100;

    // Determine direction
    let direction: 'up' | 'down' | 'neutral';
    if (Math.abs(percentageChange) < 0.5) {
      // Less than 0.5% change is considered neutral
      direction = 'neutral';
    } else if (percentageChange > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }

    return {
      value: Math.round(Math.abs(percentageChange) * 10) / 10, // Round to 1 decimal
      direction,
      period: 'vs last week',
    };
  }

  /**
   * Cache KPIs in Redis with 5-minute TTL
   *
   * @param userId - ID of the user
   * @param kpis - KPI data to cache
   */
  async cacheKPIs(userId: string, kpis: PropertyKPIData): Promise<void> {
    const cacheKey = `property-kpis:${userId}`;

    try {
      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(kpis));
    } catch (error) {
      console.error('Redis cache write error (PropertyKPIService):', error);
      // Don't throw - caching is optional, we can continue without it
    }
  }

  /**
   * Get cached KPIs from Redis
   * Returns null if cache miss or Redis error
   *
   * @param userId - ID of the user
   * @returns Cached KPIs or null
   */
  async getCachedKPIs(userId: string): Promise<PropertyKPIData | null> {
    const cacheKey = `property-kpis:${userId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache read error (PropertyKPIService):', error);
      // Return null on error - we'll fall back to calculating
    }

    return null;
  }

  /**
   * Invalidate cached KPIs for a user
   * Called when property data changes (CRUD operations)
   *
   * @param userId - ID of the user
   */
  async invalidateCache(userId: string): Promise<void> {
    const cacheKey = `property-kpis:${userId}`;

    try {
      await redis.del(cacheKey);
      console.log(`Invalidated property KPI cache for user: ${userId}`);
    } catch (error) {
      console.error('Redis cache invalidation error (PropertyKPIService):', error);
      // Don't throw - cache invalidation failure should not block the operation
    }
  }

  /**
   * Get KPIs with automatic caching
   * Checks cache first, calculates and caches if needed
   *
   * @param userId - ID of the user
   * @returns Property KPIs
   */
  async getKPIs(userId: string): Promise<PropertyKPIData> {
    // Try cache first
    const cached = await this.getCachedKPIs(userId);
    if (cached) {
      return cached;
    }

    // Calculate KPIs
    const kpis = await this.calculateKPIs(userId);

    // Cache the results
    await this.cacheKPIs(userId, kpis);

    return kpis;
  }
}
