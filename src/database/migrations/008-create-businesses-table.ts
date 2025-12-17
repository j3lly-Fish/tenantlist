import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create Businesses table
export const createBusinessesTableMigration: Migration = {
  name: '008-create-businesses-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        logo_url VARCHAR(500),
        category VARCHAR(100) NOT NULL,
        status business_status NOT NULL DEFAULT 'pending_verification',
        is_verified BOOLEAN NOT NULL DEFAULT false,
        stealth_mode_enabled BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_businesses_user_id
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
      CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
      CREATE INDEX IF NOT EXISTS idx_businesses_user_status ON businesses(user_id, status, created_at);
      CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TABLE IF EXISTS businesses CASCADE');
  },
};
