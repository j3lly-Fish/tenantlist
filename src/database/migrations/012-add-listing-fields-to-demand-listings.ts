import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to add listing fields to demand_listings table
export const addListingFieldsToDemandListingsMigration: Migration = {
  name: '012-add-listing-fields-to-demand-listings',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      ALTER TABLE demand_listings
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS duration_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS start_date DATE,
      ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query(`
      ALTER TABLE demand_listings
      DROP COLUMN IF EXISTS title,
      DROP COLUMN IF EXISTS description,
      DROP COLUMN IF EXISTS duration_type,
      DROP COLUMN IF EXISTS start_date,
      DROP COLUMN IF EXISTS industry;
    `);
  },
};
