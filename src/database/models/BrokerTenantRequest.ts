import { Pool } from 'pg';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Broker tenant request data structure
 */
export interface BrokerTenantRequest {
  id: string;
  broker_user_id: string;
  business_profile_id?: string | null;
  tenant_profile_id: string;
  tenant_email?: string | null;
  tenant_pin?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: Date;
  reviewed_at?: Date | null;
  reviewed_by?: string | null;
}

/**
 * Model for broker tenant request database operations
 */
export class BrokerTenantRequestModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create a new broker tenant request
   *
   * @param data - Request data
   * @returns Created request
   */
  async create(data: {
    broker_user_id: string;
    business_profile_id?: string | null;
    tenant_profile_id: string;
    tenant_email?: string | null;
    tenant_pin?: string | null;
  }): Promise<BrokerTenantRequest> {
    const result = await this.pool.query(
      `INSERT INTO broker_tenant_requests (
        id, broker_user_id, business_profile_id, tenant_profile_id,
        tenant_email, tenant_pin, status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        uuidv4(),
        data.broker_user_id,
        data.business_profile_id || null,
        data.tenant_profile_id,
        data.tenant_email || null,
        data.tenant_pin || null,
        'pending',
      ]
    );

    return result.rows[0];
  }

  /**
   * Find request by ID
   *
   * @param id - Request ID
   * @returns Request or null if not found
   */
  async findById(id: string): Promise<BrokerTenantRequest | null> {
    const result = await this.pool.query(
      'SELECT * FROM broker_tenant_requests WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Find requests by broker user ID
   *
   * @param brokerUserId - Broker user ID
   * @param limit - Number of requests to return
   * @param offset - Offset for pagination
   * @param status - Optional status filter
   * @returns Paginated requests and total count
   */
  async findByBrokerUserId(
    brokerUserId: string,
    limit: number = 20,
    offset: number = 0,
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<{ requests: BrokerTenantRequest[]; total: number }> {
    let query = 'SELECT * FROM broker_tenant_requests WHERE broker_user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM broker_tenant_requests WHERE broker_user_id = $1';
    const params: any[] = [brokerUserId];
    let paramIndex = 2;

    // Add status filter if provided
    if (status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add ordering and pagination
    query += ` ORDER BY requested_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute both queries
    const [requestsResult, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, status ? [brokerUserId, status] : [brokerUserId]),
    ]);

    return {
      requests: requestsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Find pending requests (for admin review)
   *
   * @param limit - Number of requests to return
   * @param offset - Offset for pagination
   * @returns Paginated pending requests and total count
   */
  async findPending(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ requests: BrokerTenantRequest[]; total: number }> {
    const query = `SELECT * FROM broker_tenant_requests
                   WHERE status = 'pending'
                   ORDER BY requested_at ASC
                   LIMIT $1 OFFSET $2`;
    const countQuery = `SELECT COUNT(*) FROM broker_tenant_requests WHERE status = 'pending'`;

    // Execute both queries
    const [requestsResult, countResult] = await Promise.all([
      this.pool.query(query, [limit, offset]),
      this.pool.query(countQuery),
    ]);

    return {
      requests: requestsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Approve request
   *
   * @param id - Request ID
   * @param reviewedBy - User ID of admin who reviewed
   * @returns Updated request or null if not found
   */
  async approve(id: string, reviewedBy: string): Promise<BrokerTenantRequest | null> {
    const result = await this.pool.query(
      `UPDATE broker_tenant_requests
       SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1
       WHERE id = $2
       RETURNING *`,
      [reviewedBy, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Reject request
   *
   * @param id - Request ID
   * @param reviewedBy - User ID of admin who reviewed
   * @returns Updated request or null if not found
   */
  async reject(id: string, reviewedBy: string): Promise<BrokerTenantRequest | null> {
    const result = await this.pool.query(
      `UPDATE broker_tenant_requests
       SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $1
       WHERE id = $2
       RETURNING *`,
      [reviewedBy, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Check if broker already has a request for this tenant
   *
   * @param brokerUserId - Broker user ID
   * @param tenantProfileId - Tenant profile ID
   * @returns Existing request or null if none found
   */
  async findExistingRequest(
    brokerUserId: string,
    tenantProfileId: string
  ): Promise<BrokerTenantRequest | null> {
    const result = await this.pool.query(
      `SELECT * FROM broker_tenant_requests
       WHERE broker_user_id = $1 AND tenant_profile_id = $2
       ORDER BY requested_at DESC
       LIMIT 1`,
      [brokerUserId, tenantProfileId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
