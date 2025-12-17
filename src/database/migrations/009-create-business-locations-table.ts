import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create Business_Locations table
export const createBusinessLocationsTableMigration: Migration = {
  name: '009-create-business-locations-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_business_locations_business_id
          FOREIGN KEY (business_id)
          REFERENCES businesses(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_business_locations_business_id ON business_locations(business_id);
      CREATE INDEX IF NOT EXISTS idx_business_locations_city ON business_locations(city);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TABLE IF EXISTS business_locations CASCADE');
  },
};
