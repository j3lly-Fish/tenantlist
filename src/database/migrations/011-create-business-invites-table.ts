import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create Business_Invites table
export const createBusinessInvitesTableMigration: Migration = {
  name: '011-create-business-invites-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        invited_by_user_id UUID NOT NULL,
        invited_user_email VARCHAR(255) NOT NULL,
        status business_invite_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_business_invites_business_id
          FOREIGN KEY (business_id)
          REFERENCES businesses(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_business_invites_invited_by_user_id
          FOREIGN KEY (invited_by_user_id)
          REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_business_invites_business_id ON business_invites(business_id);
      CREATE INDEX IF NOT EXISTS idx_business_invites_email ON business_invites(invited_user_email);
      CREATE INDEX IF NOT EXISTS idx_business_invites_status ON business_invites(status);
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TABLE IF EXISTS business_invites CASCADE');
  },
};
