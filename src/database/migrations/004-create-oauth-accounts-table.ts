import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create OAuth_Accounts table
export const createOAuthAccountsTableMigration: Migration = {
  name: '004-create-oauth-accounts-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS oauth_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        provider oauth_provider NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_oauth_accounts_user_id
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT unique_provider_user
          UNIQUE (provider, provider_user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TABLE IF EXISTS oauth_accounts CASCADE');
  },
};
