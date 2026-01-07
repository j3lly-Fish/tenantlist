import { Pool } from 'pg';
import pool from '../../config/database';

/**
 * Business profile stats data structure
 */
export interface BusinessProfileStats {
  business_profile_id: string;
  offices_count: number;
  agents_count: number;
  tenants_count: number;
  properties_count: number;
  updated_at: Date;
}

/**
 * Model for business profile stats database operations
 */
export class BusinessProfileStatsModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Find stats by business profile ID
   * Note: Stats row is automatically created by trigger when business profile is created
   *
   * @param businessProfileId - Business profile ID
   * @returns Stats or null if not found
   */
  async findByBusinessProfileId(businessProfileId: string): Promise<BusinessProfileStats | null> {
    const result = await this.pool.query(
      'SELECT * FROM business_profile_stats WHERE business_profile_id = $1',
      [businessProfileId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update stats counts
   *
   * @param businessProfileId - Business profile ID
   * @param data - Partial stats data to update
   * @returns Updated stats or null if not found
   */
  async update(
    businessProfileId: string,
    data: {
      offices_count?: number;
      agents_count?: number;
      tenants_count?: number;
      properties_count?: number;
    }
  ): Promise<BusinessProfileStats | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findByBusinessProfileId(businessProfileId);
    }

    // Always update updated_at timestamp
    fields.push(`updated_at = NOW()`);
    values.push(businessProfileId);

    const result = await this.pool.query(
      `UPDATE business_profile_stats SET ${fields.join(', ')} WHERE business_profile_id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Increment a specific stat count
   *
   * @param businessProfileId - Business profile ID
   * @param statField - Field to increment ('offices_count', 'agents_count', 'tenants_count', 'properties_count')
   * @param incrementBy - Amount to increment by (default 1)
   * @returns Updated stats or null if not found
   */
  async increment(
    businessProfileId: string,
    statField: 'offices_count' | 'agents_count' | 'tenants_count' | 'properties_count',
    incrementBy: number = 1
  ): Promise<BusinessProfileStats | null> {
    const result = await this.pool.query(
      `UPDATE business_profile_stats
       SET ${statField} = ${statField} + $1, updated_at = NOW()
       WHERE business_profile_id = $2
       RETURNING *`,
      [incrementBy, businessProfileId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Decrement a specific stat count
   *
   * @param businessProfileId - Business profile ID
   * @param statField - Field to decrement ('offices_count', 'agents_count', 'tenants_count', 'properties_count')
   * @param decrementBy - Amount to decrement by (default 1)
   * @returns Updated stats or null if not found
   */
  async decrement(
    businessProfileId: string,
    statField: 'offices_count' | 'agents_count' | 'tenants_count' | 'properties_count',
    decrementBy: number = 1
  ): Promise<BusinessProfileStats | null> {
    const result = await this.pool.query(
      `UPDATE business_profile_stats
       SET ${statField} = GREATEST(${statField} - $1, 0), updated_at = NOW()
       WHERE business_profile_id = $2
       RETURNING *`,
      [decrementBy, businessProfileId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Recalculate all stats from related tables
   * This can be used to fix any inconsistencies
   *
   * @param businessProfileId - Business profile ID
   * @returns Updated stats or null if not found
   */
  async recalculate(businessProfileId: string): Promise<BusinessProfileStats | null> {
    // Count active team members (agents)
    const agentsResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM business_team_members
       WHERE business_profile_id = $1 AND status = 'active'`,
      [businessProfileId]
    );
    const agents_count = parseInt(agentsResult.rows[0].count, 10);

    // For now, set offices, tenants, and properties to 0
    // These will be implemented in later phases when those features are added
    const offices_count = 0;
    const tenants_count = 0;
    const properties_count = 0;

    return this.update(businessProfileId, {
      offices_count,
      agents_count,
      tenants_count,
      properties_count,
    });
  }
}
