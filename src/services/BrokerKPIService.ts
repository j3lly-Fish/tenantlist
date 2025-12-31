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
 * Broker dashboard KPIs
 */
export interface BrokerKPIData {
  activeDeals: KPIMetric;
  commissionPipeline: KPIMetric;
  responseRate: KPIMetric;
  propertiesMatched: KPIMetric;
}

/**
 * Service for calculating and caching broker dashboard KPIs
 * Uses Redis caching with 5-minute TTL
 */
export class BrokerKPIService {
  private pool: Pool;
  private cacheTTL: number = 300; // 5 minutes in seconds

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Calculate broker KPIs for a user with trend data
   * Compares current values vs 7 days ago
   *
   * @param userId - ID of the broker user
   * @returns Broker KPIs with trends
   */
  async calculateKPIs(userId: string): Promise<BrokerKPIData> {
    // Calculate current KPIs
    const currentKPIs = await this.calculateCurrentKPIs(userId);

    // Calculate historical KPIs (7 days ago)
    const historicalKPIs = await this.calculateHistoricalKPIs(userId);

    // Build KPI data with trends
    return {
      activeDeals: {
        value: currentKPIs.activeDeals,
        trend: this.calculateTrend(
          currentKPIs.activeDeals,
          historicalKPIs.activeDeals
        ),
      },
      commissionPipeline: {
        value: currentKPIs.commissionPipeline,
        trend: this.calculateTrend(
          currentKPIs.commissionPipeline,
          historicalKPIs.commissionPipeline
        ),
      },
      responseRate: {
        value: currentKPIs.responseRate,
        trend: this.calculateTrend(
          currentKPIs.responseRate,
          historicalKPIs.responseRate
        ),
      },
      propertiesMatched: {
        value: currentKPIs.propertiesMatched,
        trend: this.calculateTrend(
          currentKPIs.propertiesMatched,
          historicalKPIs.propertiesMatched
        ),
      },
    };
  }

  /**
   * Calculate current KPI values
   *
   * @param userId - ID of the broker user
   * @returns Current KPI values
   */
  private async calculateCurrentKPIs(userId: string): Promise<{
    activeDeals: number;
    commissionPipeline: number;
    responseRate: number;
    propertiesMatched: number;
  }> {
    // Active deals count (deals not signed or lost)
    const activeDealsResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM broker_deals
       WHERE broker_user_id = $1 AND status NOT IN ('signed', 'lost')`,
      [userId]
    );
    const activeDeals = parseInt(activeDealsResult.rows[0].count, 10);

    // Commission pipeline (sum of estimated commission for deals in touring/offer_submitted)
    const pipelineResult = await this.pool.query(
      `SELECT COALESCE(SUM(estimated_commission), 0) as total_commission
       FROM broker_deals
       WHERE broker_user_id = $1 AND status IN ('touring', 'offer_submitted')`,
      [userId]
    );
    const commissionPipeline = parseFloat(pipelineResult.rows[0].total_commission) || 0;

    // Response rate: (messages replied / messages sent) * 100
    // This is a placeholder - actual implementation would query messages table
    // For now, we'll calculate based on conversations where broker has replied
    const responseResult = await this.pool.query(
      `SELECT
        COUNT(DISTINCT c.id) as total_sent,
        COUNT(DISTINCT CASE WHEN m.sender_id = $1 THEN c.id END) as total_replied
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversation_id
       WHERE c.initiator_id = $1 OR c.recipient_id = $1`,
      [userId]
    );
    const totalSent = parseInt(responseResult.rows[0].total_sent, 10);
    const totalReplied = parseInt(responseResult.rows[0].total_replied, 10);
    const responseRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;

    // Properties matched: Count of successful deals (signed status)
    const matchedResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM broker_deals
       WHERE broker_user_id = $1 AND status = 'signed'`,
      [userId]
    );
    const propertiesMatched = parseInt(matchedResult.rows[0].count, 10);

    return {
      activeDeals,
      commissionPipeline: Math.round(commissionPipeline * 100) / 100, // Round to 2 decimals
      responseRate: Math.round(responseRate),
      propertiesMatched,
    };
  }

  /**
   * Calculate historical KPI values (7 days ago)
   * Uses a snapshot approach by filtering data that existed 7 days ago
   *
   * @param userId - ID of the broker user
   * @returns Historical KPI values
   */
  private async calculateHistoricalKPIs(userId: string): Promise<{
    activeDeals: number;
    commissionPipeline: number;
    responseRate: number;
    propertiesMatched: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Active deals 7 days ago (deals created before 7 days ago that weren't closed)
    const activeDealsResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM broker_deals
       WHERE broker_user_id = $1
         AND created_at <= $2
         AND status NOT IN ('signed', 'lost')`,
      [userId, sevenDaysAgo]
    );
    const activeDeals = parseInt(activeDealsResult.rows[0].count, 10);

    // Commission pipeline 7 days ago
    const pipelineResult = await this.pool.query(
      `SELECT COALESCE(SUM(estimated_commission), 0) as total_commission
       FROM broker_deals
       WHERE broker_user_id = $1
         AND created_at <= $2
         AND status IN ('touring', 'offer_submitted')`,
      [userId, sevenDaysAgo]
    );
    const commissionPipeline = parseFloat(pipelineResult.rows[0].total_commission) || 0;

    // Response rate 7 days ago (conversations up to 7 days ago)
    const responseResult = await this.pool.query(
      `SELECT
        COUNT(DISTINCT c.id) as total_sent,
        COUNT(DISTINCT CASE WHEN m.sender_id = $1 THEN c.id END) as total_replied
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversation_id
       WHERE (c.initiator_id = $1 OR c.recipient_id = $1)
         AND c.created_at <= $2`,
      [userId, sevenDaysAgo]
    );
    const totalSent = parseInt(responseResult.rows[0].total_sent, 10);
    const totalReplied = parseInt(responseResult.rows[0].total_replied, 10);
    const responseRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;

    // Properties matched 7 days ago (deals signed before 7 days ago)
    const matchedResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM broker_deals
       WHERE broker_user_id = $1
         AND status = 'signed'
         AND closed_at <= $2`,
      [userId, sevenDaysAgo]
    );
    const propertiesMatched = parseInt(matchedResult.rows[0].count, 10);

    return {
      activeDeals,
      commissionPipeline: Math.round(commissionPipeline * 100) / 100,
      responseRate: Math.round(responseRate),
      propertiesMatched,
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
   * @param userId - ID of the broker user
   * @param kpis - KPI data to cache
   */
  async cacheKPIs(userId: string, kpis: BrokerKPIData): Promise<void> {
    const cacheKey = `broker-kpis:${userId}`;

    try {
      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(kpis));
    } catch (error) {
      console.error('Redis cache write error (BrokerKPIService):', error);
      // Don't throw - caching is optional, we can continue without it
    }
  }

  /**
   * Get cached KPIs from Redis
   * Returns null if cache miss or Redis error
   *
   * @param userId - ID of the broker user
   * @returns Cached KPIs or null
   */
  async getCachedKPIs(userId: string): Promise<BrokerKPIData | null> {
    const cacheKey = `broker-kpis:${userId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache read error (BrokerKPIService):', error);
      // Return null on error - we'll fall back to calculating
    }

    return null;
  }

  /**
   * Invalidate cached KPIs for a broker
   * Called when deal data changes (CRUD operations)
   *
   * @param userId - ID of the broker user
   */
  async invalidateCache(userId: string): Promise<void> {
    const cacheKey = `broker-kpis:${userId}`;

    try {
      await redis.del(cacheKey);
      console.log(`Invalidated broker KPI cache for user: ${userId}`);
    } catch (error) {
      console.error('Redis cache invalidation error (BrokerKPIService):', error);
      // Don't throw - cache invalidation failure should not block the operation
    }
  }

  /**
   * Get KPIs with automatic caching
   * Checks cache first, calculates and caches if needed
   *
   * @param userId - ID of the broker user
   * @returns Broker KPIs
   */
  async getKPIs(userId: string): Promise<BrokerKPIData> {
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
