import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create business_profiles table
 *
 * This table stores brokerage business profiles for the Figma redesign.
 * Multiple brokers can create business profiles for their brokerages
 * to manage team members and track business statistics.
 *
 * Features:
 * - Company branding (logo, cover image)
 * - Company information (name, established year, location)
 * - Social media links (website, Instagram, LinkedIn)
 * - About section for company description
 * - Verification status
 * - Multi-user business profiles with team management
 */
export const createBusinessProfilesTableMigration: Migration = {
  name: '023-create-business-profiles-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_by_user_id UUID NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        logo_url TEXT,
        cover_image_url TEXT,
        established_year INTEGER,
        location_city VARCHAR(100),
        location_state VARCHAR(2),
        about TEXT,
        website_url TEXT,
        instagram_url TEXT,
        linkedin_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_business_profiles_created_by_user_id
          FOREIGN KEY (created_by_user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT chk_business_profiles_established_year
          CHECK (established_year IS NULL OR (established_year >= 1800 AND established_year <= EXTRACT(YEAR FROM CURRENT_DATE)))
      );

      -- Create index on created_by_user_id for fast lookup of user's business profiles
      CREATE INDEX IF NOT EXISTS idx_business_profiles_created_by_user_id
      ON business_profiles(created_by_user_id);

      -- Create index on company_name for search
      CREATE INDEX IF NOT EXISTS idx_business_profiles_company_name
      ON business_profiles(company_name);

      -- Create index on is_verified for filtering verified businesses
      CREATE INDEX IF NOT EXISTS idx_business_profiles_is_verified
      ON business_profiles(is_verified)
      WHERE is_verified = true;
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_business_profiles_created_by_user_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_business_profiles_company_name;`);
    await pool.query(`DROP INDEX IF EXISTS idx_business_profiles_is_verified;`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS business_profiles CASCADE');
  },
};
