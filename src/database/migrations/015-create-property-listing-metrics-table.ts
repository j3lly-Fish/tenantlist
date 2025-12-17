import { Pool } from 'pg';
import { Migration } from './migration-runner';

export const createPropertyListingMetricsTableMigration: Migration = {
  name: '015-create-property-listing-metrics-table',

  async up(pool: Pool): Promise<void> {
    // Create property_listing_metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_listing_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_listing_id UUID NOT NULL,
        metric_date DATE NOT NULL,
        views_count INTEGER NOT NULL DEFAULT 0,
        clicks_count INTEGER NOT NULL DEFAULT 0,
        inquiries_count INTEGER NOT NULL DEFAULT 0,
        favorites_count INTEGER NOT NULL DEFAULT 0,
        shares_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

        -- Foreign key constraint
        CONSTRAINT fk_property_listing_metrics_listing_id
          FOREIGN KEY (property_listing_id)
          REFERENCES property_listings(id)
          ON DELETE CASCADE,

        -- Unique constraint to ensure one metrics row per property per day
        CONSTRAINT unique_property_listing_metric_date
          UNIQUE (property_listing_id, metric_date)
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listing_metrics_listing_id
      ON property_listing_metrics(property_listing_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listing_metrics_date
      ON property_listing_metrics(metric_date);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listing_metrics_listing_date
      ON property_listing_metrics(property_listing_id, metric_date DESC);
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_property_listing_metrics_listing_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listing_metrics_date;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listing_metrics_listing_date;`);

    // Drop table
    await pool.query(`DROP TABLE IF EXISTS property_listing_metrics CASCADE;`);
  },
};
