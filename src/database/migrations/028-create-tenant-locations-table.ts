import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create tenant_locations table
 *
 * This table stores multiple location requirements for tenant profiles,
 * allowing tenants to specify different markets and space needs across
 * various geographic locations.
 *
 * Features:
 * - Location name and geographic data (city, state, lat/lng)
 * - Space requirements (asset type, sqft range)
 * - Lease term preferences
 * - Cascade deletes when profile is removed
 */
export const createTenantLocationsTableMigration: Migration = {
  name: '028-create-tenant-locations-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_profile_id UUID NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        state VARCHAR(2),
        asset_type VARCHAR(50),
        sqft_min INTEGER,
        sqft_max INTEGER,
        preferred_lease_term VARCHAR(50),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_tenant_locations_tenant_profile_id
          FOREIGN KEY (tenant_profile_id)
          REFERENCES tenant_public_profiles(id)
          ON DELETE CASCADE,
        CONSTRAINT chk_tenant_locations_sqft_range
          CHECK (sqft_min IS NULL OR sqft_max IS NULL OR sqft_min <= sqft_max),
        CONSTRAINT chk_tenant_locations_latitude
          CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
        CONSTRAINT chk_tenant_locations_longitude
          CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
      );

      -- Create index on tenant_profile_id for fast lookup of location requirements
      CREATE INDEX IF NOT EXISTS idx_tenant_locations_tenant_profile_id
      ON tenant_locations(tenant_profile_id);

      -- Create index on city and state for geographic filtering
      CREATE INDEX IF NOT EXISTS idx_tenant_locations_city_state
      ON tenant_locations(city, state)
      WHERE city IS NOT NULL AND state IS NOT NULL;

      -- Create index on asset_type for filtering by property type
      CREATE INDEX IF NOT EXISTS idx_tenant_locations_asset_type
      ON tenant_locations(asset_type)
      WHERE asset_type IS NOT NULL;

      -- Create index on latitude/longitude for spatial queries
      CREATE INDEX IF NOT EXISTS idx_tenant_locations_lat_lng
      ON tenant_locations(latitude, longitude)
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_locations_tenant_profile_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_locations_city_state;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_locations_asset_type;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_locations_lat_lng;`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS tenant_locations CASCADE');
  },
};
