import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create MFA_Settings table (built but disabled for MVP)
export const createMFASettingsTableMigration: Migration = {
  name: '007-create-mfa-settings-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mfa_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        enabled BOOLEAN NOT NULL DEFAULT false,
        secret VARCHAR(255),
        backup_codes JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_mfa_settings_user_id
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_mfa_settings_user_id ON mfa_settings(user_id);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TABLE IF EXISTS mfa_settings CASCADE');
  },
};
