import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create property_matches table
 *
 * Stores match scores between tenant demand listings (QFPs) and property listings.
 * Used by the matching algorithm to recommend properties to tenants.
 */
export const createPropertyMatchesMigration: Migration = {
  name: '017-create-property-matches-table',

  async up(pool: Pool): Promise<void> {
    // Create property_matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        demand_listing_id UUID NOT NULL REFERENCES demand_listings(id) ON DELETE CASCADE,
        property_listing_id UUID NOT NULL REFERENCES property_listings(id) ON DELETE CASCADE,

        -- Overall match score (0-100)
        match_score DECIMAL(5,2) NOT NULL DEFAULT 0,

        -- Individual scoring components (0-100 each)
        location_score DECIMAL(5,2) DEFAULT 0,
        sqft_score DECIMAL(5,2) DEFAULT 0,
        price_score DECIMAL(5,2) DEFAULT 0,
        asset_type_score DECIMAL(5,2) DEFAULT 0,
        amenities_score DECIMAL(5,2) DEFAULT 0,

        -- Match details (JSON for flexibility)
        match_details JSONB DEFAULT '{}',

        -- Tenant interaction tracking
        is_viewed BOOLEAN DEFAULT FALSE,
        is_saved BOOLEAN DEFAULT FALSE,
        is_dismissed BOOLEAN DEFAULT FALSE,
        viewed_at TIMESTAMP WITH TIME ZONE,
        saved_at TIMESTAMP WITH TIME ZONE,
        dismissed_at TIMESTAMP WITH TIME ZONE,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- Ensure unique matches
        UNIQUE(demand_listing_id, property_listing_id)
      );
    `);

    // Create indexes for efficient querying
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_matches_demand_listing
      ON property_matches(demand_listing_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_matches_property_listing
      ON property_matches(property_listing_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_matches_score
      ON property_matches(match_score DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_matches_not_dismissed
      ON property_matches(demand_listing_id, match_score DESC)
      WHERE is_dismissed = FALSE;
    `);

    // Create trigger for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_property_matches_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_property_matches_updated_at ON property_matches;

      CREATE TRIGGER trigger_update_property_matches_updated_at
        BEFORE UPDATE ON property_matches
        FOR EACH ROW
        EXECUTE FUNCTION update_property_matches_updated_at();
    `);

    console.log('Created property_matches table with indexes and triggers');
  },

  async down(pool: Pool): Promise<void> {
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_property_matches_updated_at ON property_matches;
      DROP FUNCTION IF EXISTS update_property_matches_updated_at;
      DROP TABLE IF EXISTS property_matches CASCADE;
    `);

    console.log('Dropped property_matches table');
  },
};
