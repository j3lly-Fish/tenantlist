import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create Password_Reset_Tokens table
export const createPasswordResetTokensTableMigration: Migration = {
  name: '006-create-password-reset-tokens-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        ip_address VARCHAR(45),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_password_reset_tokens_user_id
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TABLE IF EXISTS password_reset_tokens CASCADE');
  },
};
