import { Pool } from 'pg';
import pool from '../../config/database';
import { User, UserRole } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class UserModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create a new user
  async create(data: {
    email: string;
    password_hash: string | null;
    role: UserRole;
    email_verified?: boolean;
  }): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        uuidv4(),
        data.email,
        data.password_hash,
        data.role,
        data.email_verified || false,
      ]
    );

    return result.rows[0];
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Find user by ID
  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Update user
  async update(id: string, data: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Delete user
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  // Update last login timestamp
  async updateLastLogin(id: string): Promise<void> {
    await this.pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [id]
    );
  }

  // Set email verification token
  async setEmailVerificationToken(
    id: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET email_verification_token = $1,
           email_verification_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [token, expiresAt, id]
    );
  }

  // Verify email
  async verifyEmail(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE users
       SET email_verified = true,
           email_verification_token = NULL,
           email_verification_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }
}
