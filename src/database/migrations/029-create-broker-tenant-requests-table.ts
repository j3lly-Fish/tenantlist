import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create broker_tenant_requests table
 *
 * This table manages the broker approval workflow for accessing
 * enterprise tenant profiles. Brokers submit requests with tenant
 * email and PIN, which admins review and approve/reject.
 *
 * Features:
 * - Request tracking with status workflow
 * - Tenant PIN verification
 * - Admin review tracking
 * - Links broker, business profile, and tenant profile
 */
export const createBrokerTenantRequestsTableMigration: Migration = {
  name: '029-create-broker-tenant-requests-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS broker_tenant_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        broker_user_id UUID NOT NULL,
        business_profile_id UUID,
        tenant_profile_id UUID NOT NULL,
        tenant_email VARCHAR(255),
        tenant_pin VARCHAR(10),
        status VARCHAR(50) DEFAULT 'pending',
        requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
        reviewed_at TIMESTAMP,
        reviewed_by UUID,
        CONSTRAINT fk_broker_tenant_requests_broker_user_id
          FOREIGN KEY (broker_user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_broker_tenant_requests_business_profile_id
          FOREIGN KEY (business_profile_id)
          REFERENCES business_profiles(id)
          ON DELETE SET NULL,
        CONSTRAINT fk_broker_tenant_requests_tenant_profile_id
          FOREIGN KEY (tenant_profile_id)
          REFERENCES tenant_public_profiles(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_broker_tenant_requests_reviewed_by
          FOREIGN KEY (reviewed_by)
          REFERENCES users(id)
          ON DELETE SET NULL,
        CONSTRAINT chk_broker_tenant_requests_status
          CHECK (status IN ('pending', 'approved', 'rejected'))
      );

      -- Create index on broker_user_id for finding broker's requests
      CREATE INDEX IF NOT EXISTS idx_broker_tenant_requests_broker_user_id
      ON broker_tenant_requests(broker_user_id);

      -- Create index on tenant_profile_id for finding requests for a tenant
      CREATE INDEX IF NOT EXISTS idx_broker_tenant_requests_tenant_profile_id
      ON broker_tenant_requests(tenant_profile_id);

      -- Create index on status for filtering pending requests
      CREATE INDEX IF NOT EXISTS idx_broker_tenant_requests_status
      ON broker_tenant_requests(status);

      -- Create composite index for broker's pending requests
      CREATE INDEX IF NOT EXISTS idx_broker_tenant_requests_broker_status
      ON broker_tenant_requests(broker_user_id, status)
      WHERE status = 'pending';

      -- Create index on requested_at for sorting by recency
      CREATE INDEX IF NOT EXISTS idx_broker_tenant_requests_requested_at
      ON broker_tenant_requests(requested_at DESC);
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_broker_tenant_requests_broker_user_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_tenant_requests_tenant_profile_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_tenant_requests_status;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_tenant_requests_broker_status;`);
    await pool.query(`DROP INDEX IF EXISTS idx_broker_tenant_requests_requested_at;`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS broker_tenant_requests CASCADE');
  },
};
