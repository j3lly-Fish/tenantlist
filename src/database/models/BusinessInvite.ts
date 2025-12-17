import { Pool } from 'pg';
import pool from '../../config/database';
import { BusinessInvite, BusinessInviteStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class BusinessInviteModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create a new business invite
  async create(data: {
    business_id: string;
    invited_by_user_id: string;
    invited_user_email: string;
    status?: BusinessInviteStatus;
  }): Promise<BusinessInvite> {
    const result = await this.pool.query(
      `INSERT INTO business_invites (id, business_id, invited_by_user_id, invited_user_email, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        uuidv4(),
        data.business_id,
        data.invited_by_user_id,
        data.invited_user_email,
        data.status || 'pending',
      ]
    );

    return result.rows[0];
  }

  // Find invite by ID
  async findById(id: string): Promise<BusinessInvite | null> {
    const result = await this.pool.query(
      'SELECT * FROM business_invites WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Find all invites by business ID
  async findByBusinessId(businessId: string): Promise<BusinessInvite[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_invites WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );

    return result.rows;
  }

  // Count pending invites by business ID
  async countPendingByBusinessId(businessId: string): Promise<number> {
    const result = await this.pool.query(
      "SELECT COUNT(*) as count FROM business_invites WHERE business_id = $1 AND status = 'pending'",
      [businessId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  // Find invites by email
  async findByEmail(email: string): Promise<BusinessInvite[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_invites WHERE invited_user_email = $1 ORDER BY created_at DESC',
      [email]
    );

    return result.rows;
  }

  // Update invite status
  async update(
    id: string,
    status: BusinessInviteStatus
  ): Promise<BusinessInvite | null> {
    const result = await this.pool.query(
      `UPDATE business_invites
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Delete invite
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM business_invites WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }
}
