import { Pool } from 'pg';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business team member data structure
 */
export interface BusinessTeamMember {
  id: string;
  business_profile_id: string;
  user_id?: string | null;
  email?: string | null;
  role: 'broker' | 'manager' | 'admin' | 'viewer';
  status: 'invited' | 'active' | 'inactive';
  invited_at: Date;
  joined_at?: Date | null;
  created_at: Date;
}

/**
 * Model for business team member database operations
 */
export class BusinessTeamMemberModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Add a team member to a business profile
   *
   * @param data - Team member data
   * @returns Created team member
   */
  async create(data: {
    business_profile_id: string;
    user_id?: string | null;
    email?: string | null;
    role: 'broker' | 'manager' | 'admin' | 'viewer';
    status?: 'invited' | 'active' | 'inactive';
  }): Promise<BusinessTeamMember> {
    const result = await this.pool.query(
      `INSERT INTO business_team_members (
        id, business_profile_id, user_id, email, role, status
      )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        uuidv4(),
        data.business_profile_id,
        data.user_id || null,
        data.email || null,
        data.role,
        data.status || 'invited',
      ]
    );

    return result.rows[0];
  }

  /**
   * Find team members by business profile ID
   *
   * @param businessProfileId - Business profile ID
   * @returns Array of team members
   */
  async findByBusinessProfileId(businessProfileId: string): Promise<BusinessTeamMember[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_team_members WHERE business_profile_id = $1 ORDER BY created_at DESC',
      [businessProfileId]
    );

    return result.rows;
  }

  /**
   * Find team member by ID
   *
   * @param id - Team member ID
   * @returns Team member or null if not found
   */
  async findById(id: string): Promise<BusinessTeamMember | null> {
    const result = await this.pool.query(
      'SELECT * FROM business_team_members WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Find team memberships by user ID
   *
   * @param userId - User ID
   * @returns Array of team memberships
   */
  async findByUserId(userId: string): Promise<BusinessTeamMember[]> {
    const result = await this.pool.query(
      'SELECT * FROM business_team_members WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows;
  }

  /**
   * Update team member
   *
   * @param id - Team member ID
   * @param data - Partial team member data to update
   * @returns Updated team member or null if not found
   */
  async update(id: string, data: Partial<BusinessTeamMember>): Promise<BusinessTeamMember | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== 'id' &&
        key !== 'business_profile_id' &&
        key !== 'created_at' &&
        key !== 'invited_at' &&
        value !== undefined
      ) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.pool.query(
      `UPDATE business_team_members SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete team member
   *
   * @param id - Team member ID
   * @returns True if team member was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM business_team_members WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Activate team member (when they accept invitation)
   *
   * @param id - Team member ID
   * @returns Updated team member or null if not found
   */
  async activate(id: string): Promise<BusinessTeamMember | null> {
    const result = await this.pool.query(
      `UPDATE business_team_members
       SET status = 'active', joined_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Count team members by business profile ID
   *
   * @param businessProfileId - Business profile ID
   * @param status - Optional status filter
   * @returns Count of team members
   */
  async countByBusinessProfileId(
    businessProfileId: string,
    status?: 'invited' | 'active' | 'inactive'
  ): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM business_team_members WHERE business_profile_id = $1';
    const params: any[] = [businessProfileId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    const result = await this.pool.query(query, params);

    return parseInt(result.rows[0].count, 10);
  }
}
