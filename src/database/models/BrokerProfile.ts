import { Pool } from 'pg';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Broker profile data structure
 */
export interface BrokerProfile {
  id: string;
  user_id: string;
  company_name: string;
  license_number?: string | null;
  license_state?: string | null;
  specialties?: string[] | null;
  bio?: string | null;
  website_url?: string | null;
  years_experience?: number | null;
  total_deals_closed: number;
  total_commission_earned: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Model for broker profile database operations
 */
export class BrokerProfileModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create a new broker profile
   *
   * @param data - Broker profile data
   * @returns Created broker profile
   */
  async create(data: {
    user_id: string;
    company_name: string;
    license_number?: string | null;
    license_state?: string | null;
    specialties?: string[] | null;
    bio?: string | null;
    website_url?: string | null;
    years_experience?: number | null;
  }): Promise<BrokerProfile> {
    const result = await this.pool.query(
      `INSERT INTO broker_profiles (
        id, user_id, company_name, license_number, license_state,
        specialties, bio, website_url, years_experience,
        total_deals_closed, total_commission_earned
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        uuidv4(),
        data.user_id,
        data.company_name,
        data.license_number || null,
        data.license_state || null,
        data.specialties || null,
        data.bio || null,
        data.website_url || null,
        data.years_experience || null,
        0, // total_deals_closed default
        0.0, // total_commission_earned default
      ]
    );

    return result.rows[0];
  }

  /**
   * Find broker profile by user ID
   *
   * @param userId - User ID to search for
   * @returns Broker profile or null if not found
   */
  async findByUserId(userId: string): Promise<BrokerProfile | null> {
    const result = await this.pool.query(
      'SELECT * FROM broker_profiles WHERE user_id = $1',
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update broker profile
   *
   * @param userId - User ID of the profile to update
   * @param data - Partial broker profile data to update
   * @returns Updated broker profile or null if not found
   */
  async update(userId: string, data: Partial<BrokerProfile>): Promise<BrokerProfile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id' &&
        key !== 'user_id' &&
        key !== 'created_at' &&
        value !== undefined
      ) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findByUserId(userId);
    }

    // Always update updated_at timestamp
    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await this.pool.query(
      `UPDATE broker_profiles SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete broker profile
   *
   * @param userId - User ID of the profile to delete
   * @returns True if profile was deleted, false otherwise
   */
  async delete(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM broker_profiles WHERE user_id = $1',
      [userId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Update broker deal statistics
   * Called when deals are closed or commission is earned
   *
   * @param userId - User ID of the broker
   * @param dealsIncrement - Number to increment total_deals_closed by
   * @param commissionIncrement - Amount to increment total_commission_earned by
   * @returns Updated broker profile or null if not found
   */
  async updateDealStats(
    userId: string,
    dealsIncrement: number = 0,
    commissionIncrement: number = 0
  ): Promise<BrokerProfile | null> {
    const result = await this.pool.query(
      `UPDATE broker_profiles
       SET total_deals_closed = total_deals_closed + $1,
           total_commission_earned = total_commission_earned + $2,
           updated_at = NOW()
       WHERE user_id = $3
       RETURNING *`,
      [dealsIncrement, commissionIncrement, userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
