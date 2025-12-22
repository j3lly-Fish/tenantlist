import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Add property metrics columns to property_listings table
 *
 * Adds the following columns:
 * - days_on_market: Number of days the property has been actively listed
 * - view_count: Number of times the property has been viewed
 * - inquiry_count: Number of inquiries received for the property
 * - last_activity_at: Timestamp of the last activity (view/inquiry)
 *
 * Also creates a trigger function to auto-calculate days_on_market
 * whenever an active property is updated.
 */
export const addPropertyMetricsMigration: Migration = {
  name: '020-add-property-metrics',

  async up(pool: Pool): Promise<void> {
    // Add new columns to property_listings table
    await pool.query(`
      ALTER TABLE property_listings
        ADD COLUMN IF NOT EXISTS days_on_market INTEGER,
        ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS inquiry_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;
    `);

    // Create trigger function for auto-calculating days_on_market
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_days_on_market()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Only calculate days_on_market for active properties
        IF NEW.status = 'active' THEN
          NEW.days_on_market = EXTRACT(DAY FROM NOW() - NEW.created_at)::INTEGER;
        ELSE
          -- Set to NULL for non-active properties
          NEW.days_on_market = NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger that runs before UPDATE on properties
    await pool.query(`
      DROP TRIGGER IF EXISTS calculate_days_on_market ON property_listings;

      CREATE TRIGGER calculate_days_on_market
        BEFORE UPDATE ON property_listings
        FOR EACH ROW
        EXECUTE FUNCTION update_days_on_market();
    `);

    // Backfill days_on_market for existing active properties
    await pool.query(`
      UPDATE property_listings
      SET days_on_market = EXTRACT(DAY FROM NOW() - created_at)::INTEGER
      WHERE status = 'active' AND days_on_market IS NULL;
    `);

    // Create index on days_on_market for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_days_on_market
      ON property_listings(days_on_market)
      WHERE status = 'active';
    `);

    // Create index on view_count for sorting/filtering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_view_count
      ON property_listings(view_count);
    `);

    // Create index on inquiry_count for sorting/filtering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_inquiry_count
      ON property_listings(inquiry_count);
    `);

    // Create index on last_activity_at for sorting by recent activity
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_last_activity_at
      ON property_listings(last_activity_at DESC)
      WHERE last_activity_at IS NOT NULL;
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_days_on_market;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_view_count;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_inquiry_count;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_last_activity_at;`);

    // Drop trigger
    await pool.query(`DROP TRIGGER IF EXISTS calculate_days_on_market ON property_listings;`);

    // Drop trigger function
    await pool.query(`DROP FUNCTION IF EXISTS update_days_on_market();`);

    // Drop columns
    await pool.query(`
      ALTER TABLE property_listings
        DROP COLUMN IF EXISTS days_on_market,
        DROP COLUMN IF EXISTS view_count,
        DROP COLUMN IF EXISTS inquiry_count,
        DROP COLUMN IF EXISTS last_activity_at;
    `);
  },
};
