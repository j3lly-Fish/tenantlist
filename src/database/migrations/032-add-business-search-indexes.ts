import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Add Business Search Indexes
 * Task Group 2.4: Add database indexes for search optimization
 *
 * Indexes added:
 * - businesses.name for ILIKE searches (case-insensitive)
 * - businesses.name for full-text search (using to_tsvector)
 * - businesses.created_at for sorting recent businesses
 */
export const addBusinessSearchIndexesMigration: Migration = {
  name: '032-add-business-search-indexes',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      -- Add index on businesses.name for ILIKE searches (case-insensitive pattern matching)
      CREATE INDEX IF NOT EXISTS idx_businesses_name_lower ON businesses(LOWER(name));

      -- Add full-text search index on businesses.name for advanced search
      CREATE INDEX IF NOT EXISTS idx_businesses_name_tsvector
        ON businesses USING gin(to_tsvector('english', name));

      -- Add index on businesses.created_at for sorting and date-based queries
      -- Note: This index already exists from migration 008, but we add it here for completeness
      -- CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);

      -- Add composite index for common query pattern: user_id + name search
      CREATE INDEX IF NOT EXISTS idx_businesses_user_name
        ON businesses(user_id, LOWER(name));
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query(`
      DROP INDEX IF EXISTS idx_businesses_name_lower;
      DROP INDEX IF EXISTS idx_businesses_name_tsvector;
      DROP INDEX IF EXISTS idx_businesses_user_name;
    `);
  },
};
