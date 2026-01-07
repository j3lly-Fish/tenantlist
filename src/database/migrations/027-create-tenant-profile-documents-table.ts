import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create tenant_profile_documents table
 *
 * This table stores documents attached to tenant public profiles,
 * such as offering memorandums, floor plans, financial documents,
 * and other supporting materials.
 *
 * Features:
 * - Document name and URL storage
 * - Document type classification
 * - Upload timestamp tracking
 * - Cascade deletes when profile is removed
 */
export const createTenantProfileDocumentsTableMigration: Migration = {
  name: '027-create-tenant-profile-documents-table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_profile_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_profile_id UUID NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        document_url TEXT NOT NULL,
        document_type VARCHAR(50),
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_tenant_profile_documents_tenant_profile_id
          FOREIGN KEY (tenant_profile_id)
          REFERENCES tenant_public_profiles(id)
          ON DELETE CASCADE,
        CONSTRAINT chk_tenant_profile_documents_document_type
          CHECK (document_type IS NULL OR document_type IN ('pdf', 'image', 'doc', 'xlsx', 'other'))
      );

      -- Create index on tenant_profile_id for fast lookup of profile documents
      CREATE INDEX IF NOT EXISTS idx_tenant_profile_documents_tenant_profile_id
      ON tenant_profile_documents(tenant_profile_id);

      -- Create index on document_type for filtering by type
      CREATE INDEX IF NOT EXISTS idx_tenant_profile_documents_document_type
      ON tenant_profile_documents(document_type)
      WHERE document_type IS NOT NULL;

      -- Create index on uploaded_at for sorting by recency
      CREATE INDEX IF NOT EXISTS idx_tenant_profile_documents_uploaded_at
      ON tenant_profile_documents(uploaded_at DESC);
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop indexes
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_profile_documents_tenant_profile_id;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_profile_documents_document_type;`);
    await pool.query(`DROP INDEX IF EXISTS idx_tenant_profile_documents_uploaded_at;`);

    // Drop table
    await pool.query('DROP TABLE IF EXISTS tenant_profile_documents CASCADE');
  },
};
