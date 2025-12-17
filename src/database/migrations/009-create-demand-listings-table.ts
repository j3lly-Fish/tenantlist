import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create Demand_Listings table (QFPs - Qualified Facility Profiles)
export const createDemandListingsTableMigration: Migration = {
  name: '009-create-demand-listings-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS demand_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        address TEXT,
        sqft_min INTEGER,
        sqft_max INTEGER,
        budget_min DECIMAL(12, 2),
        budget_max DECIMAL(12, 2),
        asset_type VARCHAR(50) NOT NULL,
        requirements JSONB,
        match_percentage VARCHAR(10) NOT NULL DEFAULT 'N/A',
        status demand_listing_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_demand_listings_business_id
          FOREIGN KEY (business_id)
          REFERENCES businesses(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_demand_listings_business_id ON demand_listings(business_id);
      CREATE INDEX IF NOT EXISTS idx_demand_listings_city ON demand_listings(city);
      CREATE INDEX IF NOT EXISTS idx_demand_listings_state ON demand_listings(state);
      CREATE INDEX IF NOT EXISTS idx_demand_listings_status ON demand_listings(status);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TABLE IF EXISTS demand_listings CASCADE');
  },
};
