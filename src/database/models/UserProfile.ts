import { Pool } from 'pg';
import pool from '../../config/database';
import { UserProfile } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class UserProfileModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create a new user profile
  async create(data: {
    user_id: string;
    first_name: string;
    last_name: string;
    bio?: string | null;
    phone: string;
    photo_url?: string | null;
  }): Promise<UserProfile> {
    const result = await this.pool.query(
      `INSERT INTO user_profiles (id, user_id, first_name, last_name, bio, phone, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        uuidv4(),
        data.user_id,
        data.first_name,
        data.last_name,
        data.bio || null,
        data.phone,
        data.photo_url || null,
      ]
    );

    return result.rows[0];
  }

  // Find profile by user ID
  async findByUserId(userId: string): Promise<UserProfile | null> {
    const result = await this.pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Update profile
  async update(userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findByUserId(userId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await this.pool.query(
      `UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Delete profile
  async delete(userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    return (result.rowCount || 0) > 0;
  }
}
