import { Pool } from 'pg';
import pool from '../../config/database';
import { PropertyListingMetrics } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class PropertyListingMetricsModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create or update metrics for a property listing on a specific date
   */
  async upsert(data: {
    property_listing_id: string;
    metric_date: Date;
    views_count?: number;
    clicks_count?: number;
    inquiries_count?: number;
    favorites_count?: number;
    shares_count?: number;
  }): Promise<PropertyListingMetrics> {
    const dateStr = data.metric_date.toISOString().split('T')[0];

    const result = await this.pool.query(
      `INSERT INTO property_listing_metrics (
        id, property_listing_id, metric_date,
        views_count, clicks_count, inquiries_count, favorites_count, shares_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (property_listing_id, metric_date)
      DO UPDATE SET
        views_count = property_listing_metrics.views_count + EXCLUDED.views_count,
        clicks_count = property_listing_metrics.clicks_count + EXCLUDED.clicks_count,
        inquiries_count = property_listing_metrics.inquiries_count + EXCLUDED.inquiries_count,
        favorites_count = property_listing_metrics.favorites_count + EXCLUDED.favorites_count,
        shares_count = property_listing_metrics.shares_count + EXCLUDED.shares_count,
        updated_at = NOW()
      RETURNING *`,
      [
        uuidv4(),
        data.property_listing_id,
        dateStr,
        data.views_count || 0,
        data.clicks_count || 0,
        data.inquiries_count || 0,
        data.favorites_count || 0,
        data.shares_count || 0,
      ]
    );

    return result.rows[0];
  }

  /**
   * Increment a specific metric for today
   */
  async incrementMetric(
    propertyListingId: string,
    metric: 'views' | 'clicks' | 'inquiries' | 'favorites' | 'shares'
  ): Promise<PropertyListingMetrics> {
    const today = new Date().toISOString().split('T')[0];
    const metricColumn = `${metric}_count`;

    const result = await this.pool.query(
      `INSERT INTO property_listing_metrics (
        id, property_listing_id, metric_date, ${metricColumn}
      )
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (property_listing_id, metric_date)
      DO UPDATE SET
        ${metricColumn} = property_listing_metrics.${metricColumn} + 1,
        updated_at = NOW()
      RETURNING *`,
      [uuidv4(), propertyListingId, today]
    );

    return result.rows[0];
  }

  /**
   * Find metrics by property listing ID
   */
  async findByPropertyListingId(
    propertyListingId: string,
    limit: number = 30
  ): Promise<PropertyListingMetrics[]> {
    const result = await this.pool.query(
      `SELECT * FROM property_listing_metrics
       WHERE property_listing_id = $1
       ORDER BY metric_date DESC
       LIMIT $2`,
      [propertyListingId, limit]
    );

    return result.rows;
  }

  /**
   * Get metrics for a specific date range
   */
  async findByDateRange(
    propertyListingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PropertyListingMetrics[]> {
    const result = await this.pool.query(
      `SELECT * FROM property_listing_metrics
       WHERE property_listing_id = $1
       AND metric_date BETWEEN $2 AND $3
       ORDER BY metric_date ASC`,
      [
        propertyListingId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      ]
    );

    return result.rows;
  }

  /**
   * Get aggregated metrics for a property listing
   */
  async getAggregatedMetrics(propertyListingId: string): Promise<{
    total_views: number;
    total_clicks: number;
    total_inquiries: number;
    total_favorites: number;
    total_shares: number;
  }> {
    const result = await this.pool.query(
      `SELECT
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(clicks_count), 0) as total_clicks,
        COALESCE(SUM(inquiries_count), 0) as total_inquiries,
        COALESCE(SUM(favorites_count), 0) as total_favorites,
        COALESCE(SUM(shares_count), 0) as total_shares
       FROM property_listing_metrics
       WHERE property_listing_id = $1`,
      [propertyListingId]
    );

    return {
      total_views: parseInt(result.rows[0].total_views, 10),
      total_clicks: parseInt(result.rows[0].total_clicks, 10),
      total_inquiries: parseInt(result.rows[0].total_inquiries, 10),
      total_favorites: parseInt(result.rows[0].total_favorites, 10),
      total_shares: parseInt(result.rows[0].total_shares, 10),
    };
  }

  /**
   * Get aggregated metrics for all listings by user
   */
  async getAggregatedMetricsByUserId(userId: string): Promise<{
    total_views: number;
    total_clicks: number;
    total_inquiries: number;
    total_favorites: number;
    total_shares: number;
  }> {
    const result = await this.pool.query(
      `SELECT
        COALESCE(SUM(m.views_count), 0) as total_views,
        COALESCE(SUM(m.clicks_count), 0) as total_clicks,
        COALESCE(SUM(m.inquiries_count), 0) as total_inquiries,
        COALESCE(SUM(m.favorites_count), 0) as total_favorites,
        COALESCE(SUM(m.shares_count), 0) as total_shares
       FROM property_listing_metrics m
       JOIN property_listings p ON m.property_listing_id = p.id
       WHERE p.user_id = $1`,
      [userId]
    );

    return {
      total_views: parseInt(result.rows[0].total_views, 10),
      total_clicks: parseInt(result.rows[0].total_clicks, 10),
      total_inquiries: parseInt(result.rows[0].total_inquiries, 10),
      total_favorites: parseInt(result.rows[0].total_favorites, 10),
      total_shares: parseInt(result.rows[0].total_shares, 10),
    };
  }

  /**
   * Delete metrics for a property listing
   */
  async deleteByPropertyListingId(propertyListingId: string): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM property_listing_metrics WHERE property_listing_id = $1',
      [propertyListingId]
    );

    return result.rowCount || 0;
  }
}
