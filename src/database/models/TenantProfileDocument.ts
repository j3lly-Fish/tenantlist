import { Pool } from 'pg';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tenant profile document data structure
 */
export interface TenantProfileDocument {
  id: string;
  tenant_profile_id: string;
  document_name: string;
  document_url: string;
  document_type?: string | null;
  uploaded_at: Date;
}

/**
 * Model for tenant profile document database operations
 */
export class TenantProfileDocumentModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Add a document to a tenant profile
   *
   * @param data - Document data
   * @returns Created document
   */
  async create(data: {
    tenant_profile_id: string;
    document_name: string;
    document_url: string;
    document_type?: 'pdf' | 'image' | 'doc' | 'xlsx' | 'other' | null;
  }): Promise<TenantProfileDocument> {
    const result = await this.pool.query(
      `INSERT INTO tenant_profile_documents (
        id, tenant_profile_id, document_name, document_url, document_type
      )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        uuidv4(),
        data.tenant_profile_id,
        data.document_name,
        data.document_url,
        data.document_type || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Find documents by tenant profile ID
   *
   * @param tenantProfileId - Tenant profile ID
   * @returns Array of documents ordered by upload date
   */
  async findByTenantProfileId(tenantProfileId: string): Promise<TenantProfileDocument[]> {
    const result = await this.pool.query(
      'SELECT * FROM tenant_profile_documents WHERE tenant_profile_id = $1 ORDER BY uploaded_at DESC',
      [tenantProfileId]
    );

    return result.rows;
  }

  /**
   * Delete document
   *
   * @param id - Document ID
   * @returns True if document was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM tenant_profile_documents WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Find document by ID
   *
   * @param id - Document ID
   * @returns Document or null if not found
   */
  async findById(id: string): Promise<TenantProfileDocument | null> {
    const result = await this.pool.query(
      'SELECT * FROM tenant_profile_documents WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
