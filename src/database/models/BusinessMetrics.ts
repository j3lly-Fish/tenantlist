import { Pool } from 'pg';
import pool from '../../config/database';
import { BusinessMetrics, DashboardKPIs } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class BusinessMetricsModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create new business metrics
  async create(data: {
    business_id: string;
    demand_listing_id?: string | null;
    metric_date: Date;
    views_count?: number;
    clicks_count?: number;
    property_invites_count?: number;
    declined_count?: number;
    messages_count?: number;
    qfps_submitted_count?: number;
  }): Promise<BusinessMetrics> {
    const result = await this.pool.query(
      `INSERT INTO business_metrics (
        id, business_id, demand_listing_id, metric_date,
        views_count, clicks_count, property_invites_count,
        declined_count, messages_count, qfps_submitted_count
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        uuidv4(),
        data.business_id,
        data.demand_listing_id || null,
        data.metric_date,
        data.views_count || 0,
        data.clicks_count || 0,
        data.property_invites_count || 0,
        data.declined_count || 0,
        data.messages_count || 0,
        data.qfps_submitted_count || 0,
      ]
    );

    return result.rows[0];
  }

  // Find metrics by ID
  async findById(id: string): Promise<BusinessMetrics | null> {
    const result = await this.pool.query(
      'SELECT * FROM business_metrics WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Find all metrics for a business
  async findByBusinessId(businessId: string): Promise<BusinessMetrics[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_metrics WHERE business_id = $1 ORDER BY metric_date DESC',
      [businessId]
    );

    return result.rows;
  }

  // Find metrics for a specific demand listing
  async findByDemandListingId(demandListingId: string): Promise<BusinessMetrics[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_metrics WHERE demand_listing_id = $1 ORDER BY metric_date DESC',
      [demandListingId]
    );

    return result.rows;
  }

  // Get metrics by date range
  async getMetricsByDateRange(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessMetrics[]> {
    const result = await this.pool.query(
      `SELECT * FROM business_metrics
       WHERE business_id = $1
       AND metric_date >= $2
       AND metric_date <= $3
       ORDER BY metric_date DESC`,
      [businessId, startDate, endDate]
    );

    return result.rows;
  }

  // Aggregate metrics for a business (sum across all demand listings and dates)
  async aggregateByBusinessId(businessId: string): Promise<{
    totalViews: number;
    totalClicks: number;
    totalInvites: number;
    totalMessages: number;
  }> {
    const result = await this.pool.query(
      `SELECT
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(clicks_count), 0) as total_clicks,
        COALESCE(SUM(property_invites_count), 0) as total_invites,
        COALESCE(SUM(messages_count), 0) as total_messages
       FROM business_metrics
       WHERE business_id = $1`,
      [businessId]
    );

    return {
      totalViews: parseInt(result.rows[0].total_views, 10),
      totalClicks: parseInt(result.rows[0].total_clicks, 10),
      totalInvites: parseInt(result.rows[0].total_invites, 10),
      totalMessages: parseInt(result.rows[0].total_messages, 10),
    };
  }

  // Aggregate metrics for a user (sum across all their businesses) for Dashboard KPIs
  async aggregateByUserId(userId: string): Promise<DashboardKPIs> {
    // Get count of active businesses
    const businessCountResult = await this.pool.query(
      "SELECT COUNT(*) as count FROM businesses WHERE user_id = $1 AND status = 'active'",
      [userId]
    );
    const activeBusinesses = parseInt(businessCountResult.rows[0].count, 10);

    // If no active businesses, return zeros
    if (activeBusinesses === 0) {
      return {
        activeBusinesses: 0,
        responseRate: '0.0%',
        landlordViews: 0,
        messagesTotal: 0,
      };
    }

    // Aggregate all metrics for this user's businesses
    const metricsResult = await this.pool.query(
      `SELECT
        COALESCE(SUM(bm.views_count), 0) as total_views,
        COALESCE(SUM(bm.messages_count), 0) as total_messages,
        COALESCE(SUM(bm.property_invites_count), 0) as total_invites
       FROM business_metrics bm
       INNER JOIN businesses b ON bm.business_id = b.id
       WHERE b.user_id = $1`,
      [userId]
    );

    const metrics = metricsResult.rows[0];
    const totalViews = parseInt(metrics.total_views, 10);
    const totalMessages = parseInt(metrics.total_messages, 10);
    const totalInvites = parseInt(metrics.total_invites, 10);

    // Calculate response rate: (messages / invites * 100) capped at 100%
    let responseRate = 0;
    if (totalInvites > 0) {
      responseRate = Math.min((totalMessages / totalInvites) * 100, 100);
    }

    return {
      activeBusinesses,
      responseRate: responseRate.toFixed(1) + '%',
      landlordViews: totalViews,
      messagesTotal: totalMessages,
    };
  }

  // Update metrics
  async update(
    id: string,
    data: Partial<BusinessMetrics>
  ): Promise<BusinessMetrics | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id' &&
        key !== 'business_id' &&
        key !== 'demand_listing_id' &&
        key !== 'metric_date' &&
        key !== 'created_at' &&
        value !== undefined
      ) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE business_metrics SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Delete metrics
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM business_metrics WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }
}
