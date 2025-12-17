import { Pool } from 'pg';
import pool from '../../config/database';
import { MFASettings } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * MFASettings Model
 * Built for MVP but currently unused - ready for future activation
 */
export class MFASettingsModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create MFA settings for a user
   * @param user_id - User ID to create MFA settings for
   * @returns Created MFA settings record
   */
  async create(user_id: string): Promise<MFASettings> {
    const result = await this.pool.query(
      `INSERT INTO mfa_settings (id, user_id, enabled, secret, backup_codes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uuidv4(), user_id, false, null, null]
    );

    return result.rows[0];
  }

  /**
   * Find MFA settings by user ID
   * @param user_id - User ID to find MFA settings for
   * @returns MFA settings record or null if not found
   */
  async findByUserId(user_id: string): Promise<MFASettings | null> {
    const result = await this.pool.query(
      'SELECT * FROM mfa_settings WHERE user_id = $1',
      [user_id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update MFA settings for a user
   * @param user_id - User ID to update MFA settings for
   * @param enabled - Whether MFA is enabled
   * @param secret - TOTP secret (optional)
   * @param backup_codes - Array of backup codes (optional)
   * @returns Updated MFA settings record or null if not found
   */
  async update(
    user_id: string,
    enabled: boolean,
    secret?: string | null,
    backup_codes?: string[] | null
  ): Promise<MFASettings | null> {
    const result = await this.pool.query(
      `UPDATE mfa_settings
       SET enabled = $1,
           secret = $2,
           backup_codes = $3,
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [enabled, secret, JSON.stringify(backup_codes), user_id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete MFA settings for a user
   * @param user_id - User ID to delete MFA settings for
   * @returns True if deleted, false if not found
   */
  async delete(user_id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM mfa_settings WHERE user_id = $1',
      [user_id]
    );

    return (result.rowCount || 0) > 0;
  }
}
