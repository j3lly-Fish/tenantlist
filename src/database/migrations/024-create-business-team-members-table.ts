import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create business_team_members table
 *
 * This table manages team members for business profiles, supporting
 * collaborative brokerage management with role-based access.
 *
 * Features:
 * - Links team members to business profiles
 * - Role-based access (broker, manager, admin, viewer)
 * - Invitation workflow (invited, active, inactive statuses)
 * - Unique constraint prevents duplicate team memberships
 * - Cascade deletes when business profile is removed
 */
export const createBusinessTeamMembersTableMigration: Migration = {
  name: '024-create-business-team-members-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_profile_id UUID NOT NULL,
        user_id UUID,
        email VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'invited',
        invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
        joined_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_business_team_members_business_profile_id
          FOREIGN KEY (business_profile_id)
          REFERENCES business_profiles(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_business_team_members_user_id
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT chk_business_team_members_role
          CHECK (role IN ('broker', 'manager', 'admin', 'viewer')),
        CONSTRAINT chk_business_team_members_status
          CHECK (status IN ('invited', 'active', 'inactive')),
        CONSTRAINT uq_business_team_members_business_user
          UNIQUE (business_profile_id, user_id)
      );

      -- Create index on business_profile_id for fast lookup of team members
      CREATE INDEX IF NOT EXISTS idx_business_team_members_business_profile_id
      ON business_team_members(business_profile_id);

      -- Create index on user_id for finding user's team memberships
      CREATE INDEX IF NOT EXISTS idx_business_team_members_user_id
      ON business_team_members(user_id)
      WHERE user_id IS NOT NULL;

      -- Create index on status for filtering active team members
      CREATE INDEX IF NOT EXISTS idx_business_team_members_status
      ON business_team_members(status);
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_business_team_members_business_profile_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_business_team_members_user_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_business_team_members_status;`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS business_team_members CASCADE');
  },
};
