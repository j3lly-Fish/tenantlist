import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Enhance demand_listings table
 *
 * This migration adds new fields to support the Post New Location modal
 * with amenities selection, locations of interest, map boundaries,
 * lot size, and monthly budget ranges.
 *
 * Features:
 * - JSONB columns for amenities and locations of interest arrays
 * - JSONB column for map boundaries (GeoJSON)
 * - Lot size range (acres)
 * - Monthly budget range
 * - Range validation constraints
 */
export const enhanceDemandListingsTableMigration: Migration = {
  name: '031-enhance-demand-listings-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      -- Add JSONB columns for amenities, locations, and map data
      ALTER TABLE demand_listings
      ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS locations_of_interest JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS map_boundaries JSONB;

      -- Add lot size and monthly budget range columns
      ALTER TABLE demand_listings
      ADD COLUMN IF NOT EXISTS lot_size_min DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS lot_size_max DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS monthly_budget_min DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS monthly_budget_max DECIMAL(10,2);

      -- Add check constraint for lot size range
      ALTER TABLE demand_listings
      ADD CONSTRAINT chk_demand_listings_lot_size_range
      CHECK (lot_size_min IS NULL OR lot_size_max IS NULL OR lot_size_min <= lot_size_max);

      -- Add check constraint for monthly budget range
      ALTER TABLE demand_listings
      ADD CONSTRAINT chk_demand_listings_monthly_budget_range
      CHECK (monthly_budget_min IS NULL OR monthly_budget_max IS NULL OR monthly_budget_min <= monthly_budget_max);

      -- Create GIN index on amenities for efficient JSONB queries
      CREATE INDEX IF NOT EXISTS idx_demand_listings_amenities
      ON demand_listings USING GIN (amenities);

      -- Create GIN index on locations_of_interest for efficient JSONB queries
      CREATE INDEX IF NOT EXISTS idx_demand_listings_locations_of_interest
      ON demand_listings USING GIN (locations_of_interest);
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_demand_listings_amenities;`);
    await pool.query(`DROP INDEX IF EXISTS idx_demand_listings_locations_of_interest;`);

    // Drop constraints
    await pool.query(`ALTER TABLE demand_listings DROP CONSTRAINT IF EXISTS chk_demand_listings_lot_size_range;`);
    await pool.query(`ALTER TABLE demand_listings DROP CONSTRAINT IF EXISTS chk_demand_listings_monthly_budget_range;`);

    // Drop columns
    await pool.query(`
      ALTER TABLE demand_listings
      DROP COLUMN IF EXISTS amenities,
      DROP COLUMN IF EXISTS locations_of_interest,
      DROP COLUMN IF EXISTS map_boundaries,
      DROP COLUMN IF EXISTS lot_size_min,
      DROP COLUMN IF EXISTS lot_size_max,
      DROP COLUMN IF EXISTS monthly_budget_min,
      DROP COLUMN IF EXISTS monthly_budget_max;
    `);
  },
};
