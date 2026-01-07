import { Pool } from 'pg';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tenant location data structure
 */
export interface TenantLocation {
  id: string;
  tenant_profile_id: string;
  location_name: string;
  city?: string | null;
  state?: string | null;
  asset_type?: string | null;
  sqft_min?: number | null;
  sqft_max?: number | null;
  preferred_lease_term?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: Date;
}

/**
 * Model for tenant location database operations
 */
export class TenantLocationModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Add a location to a tenant profile
   *
   * @param data - Location data
   * @returns Created location
   */
  async create(data: {
    tenant_profile_id: string;
    location_name: string;
    city?: string | null;
    state?: string | null;
    asset_type?: string | null;
    sqft_min?: number | null;
    sqft_max?: number | null;
    preferred_lease_term?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<TenantLocation> {
    const result = await this.pool.query(
      `INSERT INTO tenant_locations (
        id, tenant_profile_id, location_name, city, state,
        asset_type, sqft_min, sqft_max, preferred_lease_term,
        latitude, longitude
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        uuidv4(),
        data.tenant_profile_id,
        data.location_name,
        data.city || null,
        data.state || null,
        data.asset_type || null,
        data.sqft_min || null,
        data.sqft_max || null,
        data.preferred_lease_term || null,
        data.latitude || null,
        data.longitude || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Find locations by tenant profile ID
   *
   * @param tenantProfileId - Tenant profile ID
   * @returns Array of locations
   */
  async findByTenantProfileId(tenantProfileId: string): Promise<TenantLocation[]> {
    const result = await this.pool.query(
      'SELECT * FROM tenant_locations WHERE tenant_profile_id = $1 ORDER BY created_at ASC',
      [tenantProfileId]
    );

    return result.rows;
  }

  /**
   * Find location by ID
   *
   * @param id - Location ID
   * @returns Location or null if not found
   */
  async findById(id: string): Promise<TenantLocation | null> {
    const result = await this.pool.query(
      'SELECT * FROM tenant_locations WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update location
   *
   * @param id - Location ID
   * @param data - Partial location data to update
   * @returns Updated location or null if not found
   */
  async update(id: string, data: Partial<TenantLocation>): Promise<TenantLocation | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id' &&
        key !== 'tenant_profile_id' &&
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

    values.push(id);

    const result = await this.pool.query(
      `UPDATE tenant_locations SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete location
   *
   * @param id - Location ID
   * @returns True if location was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM tenant_locations WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }
}
