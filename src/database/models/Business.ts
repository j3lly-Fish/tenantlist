import { Pool } from 'pg';
import pool from '../../config/database';
import { Business, BusinessStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class BusinessModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create a new business
  async create(data: {
    user_id: string;
    name: string;
    category: string;
    logo_url?: string | null;
    status?: BusinessStatus;
    is_verified?: boolean;
    stealth_mode_enabled?: boolean;
  }): Promise<Business> {
    const result = await this.pool.query(
      `INSERT INTO businesses (id, user_id, name, logo_url, category, status, is_verified, stealth_mode_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        uuidv4(),
        data.user_id,
        data.name,
        data.logo_url || null,
        data.category,
        data.status || 'pending_verification',
        data.is_verified || false,
        data.stealth_mode_enabled || false,
      ]
    );

    return result.rows[0];
  }

  // Find business by ID
  async findById(id: string): Promise<Business | null> {
    const result = await this.pool.query(
      'SELECT * FROM businesses WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Find all businesses by user ID
  async findByUserId(userId: string): Promise<Business[]> {
    const result = await this.pool.query(
      'SELECT * FROM businesses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows;
  }

  // Find businesses by user ID and status
  async findByUserIdAndStatus(
    userId: string,
    status: BusinessStatus
  ): Promise<Business[]> {
    const result = await this.pool.query(
      'SELECT * FROM businesses WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
      [userId, status]
    );

    return result.rows;
  }

  // Find businesses by user ID with pagination
  async findByUserIdPaginated(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    status?: BusinessStatus,
    search?: string
  ): Promise<{ businesses: Business[]; total: number }> {
    let query = 'SELECT * FROM businesses WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) as count FROM businesses WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    // Add status filter if provided
    if (status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add search filter if provided
    if (search) {
      query += ` AND name ILIKE $${paramIndex}`;
      countQuery += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    // Save count params before adding limit/offset
    const countParams = [...params];

    // Add limit and offset for pagination query
    params.push(limit, offset);

    // Get paginated businesses
    const businessesResult = await this.pool.query(query, params);

    // Get total count (without limit/offset)
    const countResult = await this.pool.query(countQuery, countParams);

    return {
      businesses: businessesResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  // Update business
  async update(id: string, data: Partial<Business>): Promise<Business | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && value !== undefined) {
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
      `UPDATE businesses SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Delete business
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM businesses WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  // Count active businesses for a user
  async countActiveBusinesses(userId: string): Promise<number> {
    const result = await this.pool.query(
      "SELECT COUNT(*) as count FROM businesses WHERE user_id = $1 AND status = 'active'",
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  // Search businesses by name
  async searchByName(
    userId: string,
    searchQuery: string
  ): Promise<Business[]> {
    const result = await this.pool.query(
      'SELECT * FROM businesses WHERE user_id = $1 AND name ILIKE $2 ORDER BY created_at DESC',
      [userId, `%${searchQuery}%`]
    );

    return result.rows;
  }

  // Get aggregated counts for business card display
  async getAggregatedCounts(businessId: string): Promise<{
    listingsCount: number;
    statesCount: number;
    invitesCount: number;
  }> {
    // Count demand listings
    const listingsResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM demand_listings WHERE business_id = $1',
      [businessId]
    );

    // Count distinct states from demand listings
    const statesResult = await this.pool.query(
      'SELECT COUNT(DISTINCT state) as count FROM demand_listings WHERE business_id = $1',
      [businessId]
    );

    // Count invites
    const invitesResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM business_invites WHERE business_id = $1',
      [businessId]
    );

    return {
      listingsCount: parseInt(listingsResult.rows[0].count, 10),
      statesCount: parseInt(statesResult.rows[0].count, 10),
      invitesCount: parseInt(invitesResult.rows[0].count, 10),
    };
  }

  // Get demand listings for a business
  async getDemandListings(businessId: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM demand_listings WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );

    return result.rows;
  }

  // Get metrics for a business
  async getMetrics(businessId: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_metrics WHERE business_id = $1 ORDER BY metric_date DESC',
      [businessId]
    );

    return result.rows;
  }

  // Get invites for a business
  async getInvites(businessId: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_invites WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );

    return result.rows;
  }
}
