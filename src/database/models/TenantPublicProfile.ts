import { Pool } from 'pg';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tenant public profile data structure
 */
export interface TenantPublicProfile {
  id: string;
  business_id?: string | null;
  cover_image_url?: string | null;
  logo_url?: string | null;
  display_name: string;
  category?: string | null;
  about?: string | null;
  rating: number;
  review_count: number;
  website_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  is_verified: boolean;
  tenant_pin?: string | null;
  contact_email?: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Model for tenant public profile database operations
 */
export class TenantPublicProfileModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create a new tenant public profile
   *
   * @param data - Tenant profile data
   * @returns Created tenant profile
   */
  async create(data: {
    business_id?: string | null;
    display_name: string;
    cover_image_url?: string | null;
    logo_url?: string | null;
    category?: string | null;
    about?: string | null;
    website_url?: string | null;
    instagram_url?: string | null;
    linkedin_url?: string | null;
    tenant_pin?: string | null;
    contact_email?: string | null;
  }): Promise<TenantPublicProfile> {
    const result = await this.pool.query(
      `INSERT INTO tenant_public_profiles (
        id, business_id, display_name, cover_image_url, logo_url,
        category, about, rating, review_count,
        website_url, instagram_url, linkedin_url,
        is_verified, tenant_pin, contact_email
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        uuidv4(),
        data.business_id || null,
        data.display_name,
        data.cover_image_url || null,
        data.logo_url || null,
        data.category || null,
        data.about || null,
        0.0, // rating default
        0, // review_count default
        data.website_url || null,
        data.instagram_url || null,
        data.linkedin_url || null,
        false, // is_verified default
        data.tenant_pin || null,
        data.contact_email || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Find tenant profile by ID
   *
   * @param id - Tenant profile ID
   * @returns Tenant profile or null if not found
   */
  async findById(id: string): Promise<TenantPublicProfile | null> {
    const result = await this.pool.query(
      'SELECT * FROM tenant_public_profiles WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Find tenant profile by tenant PIN
   *
   * @param tenantPin - Tenant PIN
   * @returns Tenant profile or null if not found
   */
  async findByTenantPin(tenantPin: string): Promise<TenantPublicProfile | null> {
    const result = await this.pool.query(
      'SELECT * FROM tenant_public_profiles WHERE tenant_pin = $1',
      [tenantPin]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update tenant profile
   *
   * @param id - Tenant profile ID
   * @param data - Partial tenant profile data to update
   * @returns Updated tenant profile or null if not found
   */
  async update(id: string, data: Partial<TenantPublicProfile>): Promise<TenantPublicProfile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id' &&
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
      `UPDATE tenant_public_profiles SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete tenant profile
   *
   * @param id - Tenant profile ID
   * @returns True if profile was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM tenant_public_profiles WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Search tenant profiles with pagination and filters
   *
   * @param limit - Number of profiles to return
   * @param offset - Offset for pagination
   * @param filters - Optional filters (search, category, location)
   * @returns Paginated profiles and total count
   */
  async findPaginated(
    limit: number = 20,
    offset: number = 0,
    filters?: {
      search?: string;
      category?: string;
      location?: string;
    }
  ): Promise<{ profiles: TenantPublicProfile[]; total: number }> {
    let query = 'SELECT * FROM tenant_public_profiles WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM tenant_public_profiles WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Add search filter (display_name or category)
    if (filters?.search) {
      query += ` AND (display_name ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`;
      countQuery += ` AND (display_name ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Add category filter
    if (filters?.category) {
      query += ` AND category = $${paramIndex}`;
      countQuery += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    // Add ordering and pagination
    query += ` ORDER BY is_verified DESC, rating DESC, display_name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute both queries
    const [profilesResult, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, paramIndex - 1)),
    ]);

    return {
      profiles: profilesResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }
}
