import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to add QFP (Qualified Facility Profile) fields to demand_listings table
export const addQfpFieldsToDemandListingsMigration: Migration = {
  name: '013-add-qfp-fields-to-demand-listings',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      ALTER TABLE demand_listings
      ADD COLUMN IF NOT EXISTS lot_size DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS is_corporate_location BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS additional_features JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS stealth_mode BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // Create index on stealth_mode for filtering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_demand_listings_stealth_mode ON demand_listings(stealth_mode);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query(`
      DROP INDEX IF EXISTS idx_demand_listings_stealth_mode;
    `);

    await pool.query(`
      ALTER TABLE demand_listings
      DROP COLUMN IF EXISTS lot_size,
      DROP COLUMN IF EXISTS is_corporate_location,
      DROP COLUMN IF EXISTS additional_features,
      DROP COLUMN IF EXISTS stealth_mode;
    `);
  },
};
