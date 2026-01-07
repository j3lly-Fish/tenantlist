import { Pool } from 'pg';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tenant profile image data structure
 */
export interface TenantProfileImage {
  id: string;
  tenant_profile_id: string;
  image_url: string;
  display_order: number;
  created_at: Date;
}

/**
 * Model for tenant profile image database operations
 */
export class TenantProfileImageModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Add an image to a tenant profile
   *
   * @param data - Image data
   * @returns Created image
   */
  async create(data: {
    tenant_profile_id: string;
    image_url: string;
    display_order?: number;
  }): Promise<TenantProfileImage> {
    const result = await this.pool.query(
      `INSERT INTO tenant_profile_images (
        id, tenant_profile_id, image_url, display_order
      )
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        uuidv4(),
        data.tenant_profile_id,
        data.image_url,
        data.display_order ?? 0,
      ]
    );

    return result.rows[0];
  }

  /**
   * Find images by tenant profile ID
   *
   * @param tenantProfileId - Tenant profile ID
   * @returns Array of images ordered by display_order
   */
  async findByTenantProfileId(tenantProfileId: string): Promise<TenantProfileImage[]> {
    const result = await this.pool.query(
      'SELECT * FROM tenant_profile_images WHERE tenant_profile_id = $1 ORDER BY display_order ASC, created_at ASC',
      [tenantProfileId]
    );

    return result.rows;
  }

  /**
   * Delete image
   *
   * @param id - Image ID
   * @returns True if image was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM tenant_profile_images WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Update image display order
   *
   * @param id - Image ID
   * @param displayOrder - New display order
   * @returns Updated image or null if not found
   */
  async updateDisplayOrder(id: string, displayOrder: number): Promise<TenantProfileImage | null> {
    const result = await this.pool.query(
      'UPDATE tenant_profile_images SET display_order = $1 WHERE id = $2 RETURNING *',
      [displayOrder, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
