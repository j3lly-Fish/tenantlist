import { Pool } from 'pg';
import { Migration } from './migration-runner';

export const createPropertyListingsTableMigration: Migration = {
  name: '014-create-property-listings-table',

  async up(pool: Pool): Promise<void> {
    // Create property_listing_status enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE property_listing_status AS ENUM ('active', 'pending', 'leased', 'off_market');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create property_type enum if it doesn't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE property_type AS ENUM ('retail', 'restaurant', 'office', 'industrial', 'warehouse', 'medical', 'flex', 'land', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create property_listings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        property_type property_type NOT NULL DEFAULT 'other',
        status property_listing_status NOT NULL DEFAULT 'pending',

        -- Location
        address VARCHAR(500) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),

        -- Property details
        sqft INTEGER NOT NULL,
        lot_size DECIMAL(10, 2),
        year_built INTEGER,
        floors INTEGER,

        -- Pricing
        asking_price DECIMAL(12, 2),
        price_per_sqft DECIMAL(10, 2),
        lease_type VARCHAR(50),
        cam_charges DECIMAL(10, 2),

        -- Availability
        available_date DATE,
        min_lease_term VARCHAR(50),
        max_lease_term VARCHAR(50),

        -- Features & amenities (JSONB arrays)
        amenities JSONB DEFAULT '[]'::jsonb,
        highlights JSONB DEFAULT '[]'::jsonb,

        -- Media (JSONB)
        photos JSONB DEFAULT '[]'::jsonb,
        virtual_tour_url VARCHAR(500),

        -- Documents (JSONB)
        documents JSONB DEFAULT '[]'::jsonb,

        -- Contact
        contact_name VARCHAR(100),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),

        -- Visibility
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,

        -- Timestamps
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

        -- Foreign key constraint
        CONSTRAINT fk_property_listings_user_id
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    // Create indexes for common queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_user_id ON property_listings(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_status ON property_listings(status);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_property_type ON property_listings(property_type);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_city ON property_listings(city);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_state ON property_listings(state);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_sqft ON property_listings(sqft);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_asking_price ON property_listings(asking_price);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_is_featured ON property_listings(is_featured);
    `);
    // Composite index for search/filter queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_search
      ON property_listings(status, property_type, state, city, sqft, asking_price);
    `);
    // Composite index for user's listings
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_listings_user_status
      ON property_listings(user_id, status, created_at DESC);
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_user_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_status;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_property_type;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_city;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_state;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_sqft;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_asking_price;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_is_featured;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_search;`);
    await pool.query(`DROP INDEX IF EXISTS idx_property_listings_user_status;`);

    // Drop table
    await pool.query(`DROP TABLE IF EXISTS property_listings CASCADE;`);

    // Drop enums
    await pool.query(`DROP TYPE IF EXISTS property_listing_status;`);
    await pool.query(`DROP TYPE IF EXISTS property_type;`);
  },
};
