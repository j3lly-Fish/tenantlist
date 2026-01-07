import { Pool } from 'pg';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business profile data structure (Figma redesign)
 */
export interface BusinessProfile {
  id: string;
  created_by_user_id: string;
  company_name: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
  established_year?: number | null;
  location_city?: string | null;
  location_state?: string | null;
  about?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Model for business profile database operations (Figma redesign)
 */
export class BusinessProfileModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create a new business profile
   *
   * @param data - Business profile data
   * @returns Created business profile
   */
  async create(data: {
    created_by_user_id: string;
    company_name: string;
    logo_url?: string | null;
    cover_image_url?: string | null;
    established_year?: number | null;
    location_city?: string | null;
    location_state?: string | null;
    about?: string | null;
    website_url?: string | null;
    instagram_url?: string | null;
    linkedin_url?: string | null;
  }): Promise<BusinessProfile> {
    const result = await this.pool.query(
      `INSERT INTO business_profiles (
        id, created_by_user_id, company_name, logo_url, cover_image_url,
        established_year, location_city, location_state, about,
        website_url, instagram_url, linkedin_url, is_verified
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        uuidv4(),
        data.created_by_user_id,
        data.company_name,
        data.logo_url || null,
        data.cover_image_url || null,
        data.established_year || null,
        data.location_city || null,
        data.location_state || null,
        data.about || null,
        data.website_url || null,
        data.instagram_url || null,
        data.linkedin_url || null,
        false, // is_verified default
      ]
    );

    return result.rows[0];
  }

  /**
   * Find business profiles by user ID
   *
   * @param userId - User ID to search for
   * @returns Array of business profiles
   */
  async findByUserId(userId: string): Promise<BusinessProfile[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_profiles WHERE created_by_user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows;
  }

  /**
   * Find business profile by ID
   *
   * @param id - Business profile ID
   * @returns Business profile or null if not found
   */
  async findById(id: string): Promise<BusinessProfile | null> {
    const result = await this.pool.query(
      'SELECT * FROM business_profiles WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update business profile
   *
   * @param id - Business profile ID
   * @param data - Partial business profile data to update
   * @returns Updated business profile or null if not found
   */
  async update(id: string, data: Partial<BusinessProfile>): Promise<BusinessProfile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id' &&
        key !== 'created_by_user_id' &&
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

    // Always update updated_at timestamp
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE business_profiles SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete business profile
   *
   * @param id - Business profile ID
   * @returns True if profile was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM business_profiles WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Search business profiles by company name
   *
   * @param searchQuery - Search query string
   * @param limit - Number of profiles to return
   * @returns Array of matching business profiles
   */
  async searchByName(searchQuery: string, limit: number = 20): Promise<BusinessProfile[]> {
    const result = await this.pool.query(
      `SELECT * FROM business_profiles
       WHERE company_name ILIKE $1
       ORDER BY is_verified DESC, company_name ASC
       LIMIT $2`,
      [`%${searchQuery}%`, limit]
    );

    return result.rows;
  }
}
