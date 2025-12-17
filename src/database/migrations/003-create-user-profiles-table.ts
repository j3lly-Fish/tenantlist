import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create User_Profiles table
export const createUserProfilesTableMigration: Migration = {
  name: '003-create-user-profiles-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        bio TEXT,
        phone VARCHAR(20) NOT NULL,
        photo_url VARCHAR(500),
        profile_completed BOOLEAN NOT NULL DEFAULT false,
        subscription_tier subscription_tier NOT NULL DEFAULT 'starter',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_user_profiles_user_id
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TABLE IF EXISTS user_profiles CASCADE');
  },
};
