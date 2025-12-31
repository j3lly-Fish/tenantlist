import { Pool } from 'pg';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { BrokerDeal } from '../../services/BrokerDashboardEventService';

/**
 * Model for broker deal database operations
 */
export class BrokerDealModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create a new broker deal
   *
   * @param data - Broker deal data
   * @returns Created broker deal
   */
  async create(data: {
    broker_user_id: string;
    tenant_business_id?: string | null;
    property_id?: string | null;
    demand_listing_id?: string | null;
    status?: 'prospecting' | 'touring' | 'offer_submitted' | 'signed' | 'lost';
    commission_percentage?: number | null;
    estimated_commission?: number | null;
    notes?: string | null;
  }): Promise<BrokerDeal> {
    const result = await this.pool.query(
      `INSERT INTO broker_deals (
        id, broker_user_id, tenant_business_id, property_id, demand_listing_id,
        status, commission_percentage, estimated_commission, notes
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        uuidv4(),
        data.broker_user_id,
        data.tenant_business_id || null,
        data.property_id || null,
        data.demand_listing_id || null,
        data.status || 'prospecting',
        data.commission_percentage || null,
        data.estimated_commission || null,
        data.notes || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Find broker deals by broker user ID with pagination
   *
   * @param brokerUserId - Broker user ID to search for
   * @param limit - Number of deals to return
   * @param offset - Offset for pagination
   * @param status - Optional status filter
   * @returns Paginated deals and total count
   */
  async findByBrokerUserId(
    brokerUserId: string,
    limit: number = 20,
    offset: number = 0,
    status?: string
  ): Promise<{ deals: BrokerDeal[]; total: number }> {
    let query = 'SELECT * FROM broker_deals WHERE broker_user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM broker_deals WHERE broker_user_id = $1';
    const params: any[] = [brokerUserId];

    // Add status filter if provided
    if (status) {
      query += ' AND status = $2';
      countQuery += ' AND status = $2';
      params.push(status);
    }

    // Add ordering and pagination
    query += ' ORDER BY created_at DESC';
    const limitOffset = status ? [limit, offset] : [limit, offset];
    const paginationIndex = params.length + 1;
    query += ` LIMIT $${paginationIndex} OFFSET $${paginationIndex + 1}`;
    params.push(...limitOffset);

    // Execute both queries
    const [dealsResult, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, status ? [brokerUserId, status] : [brokerUserId]),
    ]);

    return {
      deals: dealsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Find a single broker deal by ID
   *
   * @param dealId - Deal ID to search for
   * @returns Broker deal or null if not found
   */
  async findById(dealId: string): Promise<BrokerDeal | null> {
    const result = await this.pool.query(
      'SELECT * FROM broker_deals WHERE id = $1',
      [dealId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update broker deal
   *
   * @param dealId - Deal ID to update
   * @param data - Partial broker deal data to update
   * @returns Updated broker deal or null if not found
   */
  async update(dealId: string, data: Partial<BrokerDeal>): Promise<BrokerDeal | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id' &&
        key !== 'created_at' &&
        value !== undefined
      ) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(dealId);
    }

    // Always update updated_at timestamp
    fields.push(`updated_at = NOW()`);
    values.push(dealId);

    const result = await this.pool.query(
      `UPDATE broker_deals SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete broker deal
   *
   * @param dealId - Deal ID to delete
   * @returns True if deal was deleted, false otherwise
   */
  async delete(dealId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM broker_deals WHERE id = $1',
      [dealId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Close a deal (mark as signed or lost) and update closed_at timestamp
   *
   * @param dealId - Deal ID to close
   * @param status - Final status ('signed' or 'lost')
   * @returns Updated broker deal or null if not found
   */
  async closeDeal(
    dealId: string,
    status: 'signed' | 'lost'
  ): Promise<BrokerDeal | null> {
    const result = await this.pool.query(
      `UPDATE broker_deals
       SET status = $1, closed_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, dealId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
