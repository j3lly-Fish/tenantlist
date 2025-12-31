import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create broker_profiles table
 *
 * This table stores profile information for users with the BROKER role.
 * Brokers represent both tenants and landlords, and need to track their
 * company information, license details, specialties, and deal statistics.
 *
 * Features:
 * - Company and license information
 * - Specialties (array of property types they focus on)
 * - Biography and website
 * - Years of experience
 * - Deal statistics (total_deals_closed, total_commission_earned)
 */
export const createBrokerProfileTableMigration: Migration = {
  name: '021-create-broker-profile-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS broker_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        company_name VARCHAR(255) NOT NULL,
        license_number VARCHAR(100),
        license_state VARCHAR(2),
        specialties TEXT[],
        bio TEXT,
        website_url VARCHAR(500),
        years_experience INTEGER,
        total_deals_closed INTEGER DEFAULT 0,
        total_commission_earned NUMERIC(12,2) DEFAULT 0.00,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_broker_profiles_user_id
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      -- Create index on user_id for fast lookup
      CREATE INDEX IF NOT EXISTS idx_broker_profiles_user_id
      ON broker_profiles(user_id);

      -- Create index on company_name for search
      CREATE INDEX IF NOT EXISTS idx_broker_profiles_company_name
      ON broker_profiles(company_name);

      -- Create index on specialties for filtering brokers by specialty
      CREATE INDEX IF NOT EXISTS idx_broker_profiles_specialties
      ON broker_profiles USING GIN(specialties);

      -- Create index on license_state for filtering by state
      CREATE INDEX IF NOT EXISTS idx_broker_profiles_license_state
      ON broker_profiles(license_state)
      WHERE license_state IS NOT NULL;
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_broker_profiles_user_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_profiles_company_name;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_profiles_specialties;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_profiles_license_state;`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS broker_profiles CASCADE');
  },
};
