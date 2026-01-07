import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create business_profile_stats table
 *
 * This table maintains aggregate statistics for business profiles,
 * tracking counts of offices, agents, tenants, and properties.
 * Statistics are auto-created when business profile is created.
 *
 * Features:
 * - Aggregated counts for dashboard display
 * - Auto-created via trigger on business profile creation
 * - Updated timestamp tracking
 * - Cascade deletes when business profile is removed
 */
export const createBusinessProfileStatsTableMigration: Migration = {
  name: '030-create-business-profile-stats-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_profile_stats (
        business_profile_id UUID PRIMARY KEY,
        offices_count INTEGER DEFAULT 0,
        agents_count INTEGER DEFAULT 0,
        tenants_count INTEGER DEFAULT 0,
        properties_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_business_profile_stats_business_profile_id
          FOREIGN KEY (business_profile_id)
          REFERENCES business_profiles(id)
          ON DELETE CASCADE
      );

      -- Create trigger function to auto-create stats row when business profile is created
      CREATE OR REPLACE FUNCTION create_business_profile_stats()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO business_profile_stats (
          business_profile_id,
          offices_count,
          agents_count,
          tenants_count,
          properties_count,
          updated_at
        )
        VALUES (
          NEW.id,
          0,
          0,
          0,
          0,
          NOW()
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger to execute after business profile insert
      CREATE TRIGGER trigger_create_business_profile_stats
      AFTER INSERT ON business_profiles
      FOR EACH ROW
      EXECUTE FUNCTION create_business_profile_stats();
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop trigger
    await pool.query(`DROP TRIGGER IF EXISTS trigger_create_business_profile_stats ON business_profiles;`);

    // Drop function
    await pool.query(`DROP FUNCTION IF EXISTS create_business_profile_stats();`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS business_profile_stats CASCADE');
  },
};
