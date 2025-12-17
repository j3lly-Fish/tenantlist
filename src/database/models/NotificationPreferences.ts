import pool from '../../config/database';
import { EmailType } from '../../services/email/EmailService';

/**
 * Notification Preferences Interface
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;

  // Email preferences
  email_new_matches: boolean;
  email_new_messages: boolean;
  email_business_invites: boolean;
  email_tour_reminders: boolean;
  email_account_updates: boolean;
  email_weekly_digest: boolean;

  // In-app preferences
  inapp_new_matches: boolean;
  inapp_new_messages: boolean;
  inapp_business_invites: boolean;
  inapp_tour_reminders: boolean;
  inapp_account_updates: boolean;

  // Email delivery settings
  email_frequency: 'immediate' | 'daily' | 'weekly';
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;

  // Unsubscribe tracking
  unsubscribed_all: boolean;
  unsubscribed_at: Date | null;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

/**
 * NotificationPreferences Model
 */
export class NotificationPreferencesModel {
  /**
   * Get notification preferences for a user
   * Creates default preferences if none exist
   */
  static async getByUserId(userId: string): Promise<NotificationPreferences> {
    // Try to get existing preferences
    const result = await pool.query<NotificationPreferences>(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create default preferences if none exist
    const insertResult = await pool.query<NotificationPreferences>(
      `INSERT INTO notification_preferences (user_id)
       VALUES ($1)
       RETURNING *`,
      [userId]
    );

    return insertResult.rows[0];
  }

  /**
   * Update notification preferences
   */
  static async update(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<NotificationPreferences> {
    // Build update query dynamically
    const allowedFields = [
      'email_new_matches',
      'email_new_messages',
      'email_business_invites',
      'email_tour_reminders',
      'email_account_updates',
      'email_weekly_digest',
      'inapp_new_matches',
      'inapp_new_messages',
      'inapp_business_invites',
      'inapp_tour_reminders',
      'inapp_account_updates',
      'email_frequency',
      'quiet_hours_start',
      'quiet_hours_end',
      'timezone',
      'unsubscribed_all',
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(preferences)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    // Handle unsubscribed_all timestamp
    if (preferences.unsubscribed_all === true) {
      updates.push(`unsubscribed_at = NOW()`);
    } else if (preferences.unsubscribed_all === false) {
      updates.push(`unsubscribed_at = NULL`);
    }

    if (updates.length === 0) {
      // No valid updates, return existing preferences
      return this.getByUserId(userId);
    }

    values.push(userId);

    const result = await pool.query<NotificationPreferences>(
      `UPDATE notification_preferences
       SET ${updates.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      // No preferences exist yet, create them with updates
      return this.createWithPreferences(userId, preferences);
    }

    return result.rows[0];
  }

  /**
   * Create preferences with specific settings
   */
  private static async createWithPreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<NotificationPreferences> {
    const columns = ['user_id'];
    const placeholders = ['$1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    const allowedFields = [
      'email_new_matches',
      'email_new_messages',
      'email_business_invites',
      'email_tour_reminders',
      'email_account_updates',
      'email_weekly_digest',
      'inapp_new_matches',
      'inapp_new_messages',
      'inapp_business_invites',
      'inapp_tour_reminders',
      'inapp_account_updates',
      'email_frequency',
      'quiet_hours_start',
      'quiet_hours_end',
      'timezone',
      'unsubscribed_all',
    ];

    for (const [key, value] of Object.entries(preferences)) {
      if (allowedFields.includes(key) && value !== undefined) {
        columns.push(key);
        placeholders.push(`$${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    const result = await pool.query<NotificationPreferences>(
      `INSERT INTO notification_preferences (${columns.join(', ')})
       VALUES (${placeholders.join(', ')})
       ON CONFLICT (user_id) DO UPDATE SET
       ${columns.slice(1).map((col, i) => `${col} = $${i + 2}`).join(', ')}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Check if user should receive a specific email type
   */
  static async shouldSendEmail(userId: string, emailType: EmailType): Promise<boolean> {
    const preferences = await this.getByUserId(userId);

    // If unsubscribed from all, don't send any emails (except critical account ones)
    if (preferences.unsubscribed_all) {
      // Always send password reset and verification emails
      if (emailType === EmailType.PASSWORD_RESET || emailType === EmailType.VERIFICATION) {
        return true;
      }
      return false;
    }

    // Check specific email type preference
    switch (emailType) {
      case EmailType.VERIFICATION:
      case EmailType.PASSWORD_RESET:
        // Always send these critical emails
        return true;
      case EmailType.NEW_MATCH:
        return preferences.email_new_matches;
      case EmailType.NEW_MESSAGE:
        return preferences.email_new_messages;
      case EmailType.BUSINESS_INVITE:
        return preferences.email_business_invites;
      case EmailType.TOUR_REMINDER:
        return preferences.email_tour_reminders;
      case EmailType.ACCOUNT_UPDATE:
        return preferences.email_account_updates;
      case EmailType.WEEKLY_DIGEST:
        return preferences.email_weekly_digest;
      default:
        return true;
    }
  }

  /**
   * Unsubscribe user from all marketing emails
   */
  static async unsubscribeAll(userId: string): Promise<void> {
    await pool.query(
      `UPDATE notification_preferences
       SET unsubscribed_all = TRUE, unsubscribed_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Resubscribe user to emails
   */
  static async resubscribe(userId: string): Promise<void> {
    await pool.query(
      `UPDATE notification_preferences
       SET unsubscribed_all = FALSE, unsubscribed_at = NULL
       WHERE user_id = $1`,
      [userId]
    );
  }
}
