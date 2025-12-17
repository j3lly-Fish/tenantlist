import { Pool } from 'pg';
import pool from '../../config/database';
import { RefreshToken } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class RefreshTokenModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create a new refresh token
  async create(data: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
    ip_address?: string | null;
  }): Promise<RefreshToken> {
    const result = await this.pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, ip_address)
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

  // Find refresh token by hash
  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const result = await this.pool.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Check if token is valid (not revoked and not expired)
  async isValid(tokenHash: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM refresh_tokens
       WHERE token_hash = $1
       AND revoked = false
       AND expires_at > NOW()`,
      [tokenHash]
    );

    return result.rows.length > 0;
  }

  // Revoke a refresh token
  async revoke(tokenHash: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1',
      [tokenHash]
    );

    return (result.rowCount || 0) > 0;
  }

  // Revoke all refresh tokens for a user
  async revokeAllForUser(userId: string): Promise<number> {
    const result = await this.pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false',
      [userId]
    );

    return result.rowCount || 0;
  }

  // Delete expired tokens (cleanup)
  async deleteExpired(): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );

    return result.rowCount || 0;
  }
}
