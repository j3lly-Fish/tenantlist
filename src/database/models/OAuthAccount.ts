import { Pool } from 'pg';
import pool from '../../config/database';
import { OAuthAccount, OAuthProvider } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class OAuthAccountModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  // Create a new OAuth account
  async create(data: {
    user_id: string;
    provider: OAuthProvider;
    provider_user_id: string;
  }): Promise<OAuthAccount> {
    const result = await this.pool.query(
      `INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uuidv4(), data.user_id, data.provider, data.provider_user_id]
    );

    return result.rows[0];
  }

  // Find OAuth account by provider and provider user ID
  async findByProvider(
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<OAuthAccount | null> {
    const result = await this.pool.query(
      'SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2',
      [provider, providerUserId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Find all OAuth accounts for a user
  async findByUserId(userId: string): Promise<OAuthAccount[]> {
    const result = await this.pool.query(
      'SELECT * FROM oauth_accounts WHERE user_id = $1',
      [userId]
    );

    return result.rows;
  }

  // Delete OAuth account
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM oauth_accounts WHERE id = $1',
      [id]
    );

    return (result.rowCount || 0) > 0;
  }
}
