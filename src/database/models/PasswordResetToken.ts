import { Pool } from 'pg';
import pool from '../../config/database';
import { PasswordResetToken } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class PasswordResetTokenModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create a new password reset token
  async create(data: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
    ip_address?: string | null;
  }): Promise<PasswordResetToken> {
    const result = await this.pool.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        uuidv4(),
        data.user_id,
        data.token_hash,
        data.expires_at,
        data.ip_address || null,
      ]
    );

    return result.rows[0];
  }

  // Find password reset token by hash
  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const result = await this.pool.query(
      'SELECT * FROM password_reset_tokens WHERE token_hash = $1',
      [tokenHash]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Check if token is valid (not used and not expired)
  async isValid(tokenHash: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM password_reset_tokens
       WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()`,
      [tokenHash]
    );

    return result.rows.length > 0;
  }

  // Mark token as used
  async markAsUsed(tokenHash: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );

    return (result.rowCount || 0) > 0;
  }

  // Invalidate all unused tokens for a user
  async invalidateAllForUser(userId: string): Promise<number> {
    const result = await this.pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );

    return result.rowCount || 0;
  }

  // Delete expired tokens (cleanup)
  async deleteExpired(): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM password_reset_tokens WHERE expires_at < NOW()'
    );

    return result.rowCount || 0;
  }
}
