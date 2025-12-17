import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create Business_Metrics table
export const createBusinessMetricsTableMigration: Migration = {
  name: '010-create-business-metrics-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        demand_listing_id UUID,
        metric_date DATE NOT NULL,
        views_count INTEGER NOT NULL DEFAULT 0,
        clicks_count INTEGER NOT NULL DEFAULT 0,
        property_invites_count INTEGER NOT NULL DEFAULT 0,
        declined_count INTEGER NOT NULL DEFAULT 0,
        messages_count INTEGER NOT NULL DEFAULT 0,
        qfps_submitted_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_business_metrics_business_id
          FOREIGN KEY (business_id)
          REFERENCES businesses(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_business_metrics_demand_listing_id
          FOREIGN KEY (demand_listing_id)
          REFERENCES demand_listings(id)
          ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_business_metrics_business_id ON business_metrics(business_id);
      CREATE INDEX IF NOT EXISTS idx_business_metrics_demand_listing_id ON business_metrics(demand_listing_id);
      CREATE INDEX IF NOT EXISTS idx_business_metrics_business_date ON business_metrics(business_id, metric_date);
      CREATE INDEX IF NOT EXISTS idx_business_metrics_metric_date ON business_metrics(metric_date);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TABLE IF EXISTS business_metrics CASCADE');
  },
};
