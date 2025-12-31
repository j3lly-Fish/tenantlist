import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create broker_deals table
 *
 * This table tracks deals that brokers are working on, connecting tenants
 * with properties. It supports the broker dashboard's deal pipeline view
 * and commission tracking.
 *
 * Features:
 * - Links broker to tenant business and property listing
 * - Tracks deal status (prospecting, touring, offer_submitted, signed, lost)
 * - Commission percentage and estimated commission amount
 * - Notes for broker's internal tracking
 * - Timestamps for created, updated, and closed dates
 */
export const createBrokerDealsTableMigration: Migration = {
  name: '022-create-broker-deals-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS broker_deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        broker_user_id UUID NOT NULL,
        tenant_business_id UUID,
        property_id UUID,
        demand_listing_id UUID,
        status VARCHAR(50) DEFAULT 'prospecting',
        commission_percentage NUMERIC(5,2),
        estimated_commission NUMERIC(12,2),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        closed_at TIMESTAMP,
        CONSTRAINT fk_broker_deals_broker_user_id
          FOREIGN KEY (broker_user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_broker_deals_tenant_business_id
          FOREIGN KEY (tenant_business_id)
          REFERENCES businesses(id)
          ON DELETE SET NULL,
        CONSTRAINT fk_broker_deals_property_id
          FOREIGN KEY (property_id)
          REFERENCES property_listings(id)
          ON DELETE SET NULL,
        CONSTRAINT fk_broker_deals_demand_listing_id
          FOREIGN KEY (demand_listing_id)
          REFERENCES demand_listings(id)
          ON DELETE SET NULL,
        CONSTRAINT chk_broker_deals_status
          CHECK (status IN ('prospecting', 'touring', 'offer_submitted', 'signed', 'lost'))
      );

      -- Create index on broker_user_id for fast lookup of all deals for a broker
      CREATE INDEX IF NOT EXISTS idx_broker_deals_broker_user_id
      ON broker_deals(broker_user_id);

      -- Create index on status for filtering deals by status
      CREATE INDEX IF NOT EXISTS idx_broker_deals_status
      ON broker_deals(status);

      -- Create composite index for filtering active deals by broker
      CREATE INDEX IF NOT EXISTS idx_broker_deals_broker_status
      ON broker_deals(broker_user_id, status)
      WHERE status NOT IN ('signed', 'lost');

      -- Create index on tenant_business_id for finding deals for a tenant
      CREATE INDEX IF NOT EXISTS idx_broker_deals_tenant_business_id
      ON broker_deals(tenant_business_id)
      WHERE tenant_business_id IS NOT NULL;

      -- Create index on property_id for finding deals for a property
      CREATE INDEX IF NOT EXISTS idx_broker_deals_property_id
      ON broker_deals(property_id)
      WHERE property_id IS NOT NULL;

      -- Create index on created_at for sorting by recency
      CREATE INDEX IF NOT EXISTS idx_broker_deals_created_at
      ON broker_deals(created_at DESC);

      -- Create index on closed_at for historical deal queries
      CREATE INDEX IF NOT EXISTS idx_broker_deals_closed_at
      ON broker_deals(closed_at DESC)
      WHERE closed_at IS NOT NULL;
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_broker_deals_broker_user_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_deals_status;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_deals_broker_status;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_deals_tenant_business_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_deals_property_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_deals_created_at;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_deals_closed_at;`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS broker_deals CASCADE');
  },
};
