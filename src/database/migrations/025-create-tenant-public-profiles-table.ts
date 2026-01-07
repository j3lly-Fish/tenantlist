import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create tenant_public_profiles table
 *
 * This table stores public-facing tenant profiles that brokers can browse,
 * search, and request access to. Tenants create these profiles to showcase
 * their business and location requirements to brokers.
 *
 * Features:
 * - Public profile information with branding
 * - Rating and review system
 * - Social media links
 * - Unique tenant PIN for broker verification
 * - Verification status
 */
export const createTenantPublicProfilesTableMigration: Migration = {
  name: '025-create-tenant-public-profiles-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_public_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID,
        cover_image_url TEXT,
        logo_url TEXT,
        display_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        about TEXT,
        rating DECIMAL(2,1) DEFAULT 0.0,
        review_count INTEGER DEFAULT 0,
        website_url TEXT,
        instagram_url TEXT,
        linkedin_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        tenant_pin VARCHAR(10) UNIQUE,
        contact_email VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_tenant_public_profiles_business_id
          FOREIGN KEY (business_id)
          REFERENCES businesses(id)
          ON DELETE SET NULL,
        CONSTRAINT chk_tenant_public_profiles_rating
          CHECK (rating >= 0.0 AND rating <= 5.0)
      );

      -- Create index on business_id for linking to businesses
      CREATE INDEX IF NOT EXISTS idx_tenant_public_profiles_business_id
      ON tenant_public_profiles(business_id)
      WHERE business_id IS NOT NULL;

      -- Create index on tenant_pin for quick PIN lookup during verification
      CREATE INDEX IF NOT EXISTS idx_tenant_public_profiles_tenant_pin
      ON tenant_public_profiles(tenant_pin)
      WHERE tenant_pin IS NOT NULL;

      -- Create index on display_name for search
      CREATE INDEX IF NOT EXISTS idx_tenant_public_profiles_display_name
      ON tenant_public_profiles(display_name);

      -- Create index on category for filtering
      CREATE INDEX IF NOT EXISTS idx_tenant_public_profiles_category
      ON tenant_public_profiles(category)
      WHERE category IS NOT NULL;

      -- Create index on is_verified for filtering verified profiles
      CREATE INDEX IF NOT EXISTS idx_tenant_public_profiles_is_verified
      ON tenant_public_profiles(is_verified)
      WHERE is_verified = true;
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_public_profiles_business_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_public_profiles_tenant_pin;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_public_profiles_display_name;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_public_profiles_category;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_public_profiles_is_verified;`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS tenant_public_profiles CASCADE');
  },
};
