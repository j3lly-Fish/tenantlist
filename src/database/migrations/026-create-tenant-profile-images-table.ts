import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create tenant_profile_images table
 *
 * This table stores multiple images for tenant public profiles,
 * supporting image galleries to showcase business locations,
 * products, and facilities.
 *
 * Features:
 * - Multiple images per profile
 * - Display order for controlling gallery layout
 * - Cascade deletes when profile is removed
 */
export const createTenantProfileImagesTableMigration: Migration = {
  name: '026-create-tenant-profile-images-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_profile_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_profile_id UUID NOT NULL,
        image_url TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_tenant_profile_images_tenant_profile_id
          FOREIGN KEY (tenant_profile_id)
          REFERENCES tenant_public_profiles(id)
          ON DELETE CASCADE,
        CONSTRAINT chk_tenant_profile_images_display_order
          CHECK (display_order >= 0)
      );

      -- Create index on tenant_profile_id for fast lookup of profile images
      CREATE INDEX IF NOT EXISTS idx_tenant_profile_images_tenant_profile_id
      ON tenant_profile_images(tenant_profile_id);

      -- Create composite index on tenant_profile_id and display_order for ordered queries
      CREATE INDEX IF NOT EXISTS idx_tenant_profile_images_profile_order
      ON tenant_profile_images(tenant_profile_id, display_order);
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_profile_images_tenant_profile_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_profile_images_profile_order;`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS tenant_profile_images CASCADE');
  },
};
