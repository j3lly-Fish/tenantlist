import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create notification_preferences table
 *
 * Stores user preferences for email and in-app notifications.
 * Users can control which types of notifications they receive.
 */
export const createNotificationPreferencesMigration: Migration = {
  name: '018-create-notification-preferences-table',

  async up(pool: Pool): Promise<void> {
    // Create notification_preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Email notification preferences (default all enabled)
        email_new_matches BOOLEAN DEFAULT TRUE,
        email_new_messages BOOLEAN DEFAULT TRUE,
        email_business_invites BOOLEAN DEFAULT TRUE,
        email_tour_reminders BOOLEAN DEFAULT TRUE,
        email_account_updates BOOLEAN DEFAULT TRUE,
        email_weekly_digest BOOLEAN DEFAULT TRUE,

        -- In-app notification preferences
        inapp_new_matches BOOLEAN DEFAULT TRUE,
        inapp_new_messages BOOLEAN DEFAULT TRUE,
        inapp_business_invites BOOLEAN DEFAULT TRUE,
        inapp_tour_reminders BOOLEAN DEFAULT TRUE,
        inapp_account_updates BOOLEAN DEFAULT TRUE,

        -- Email delivery settings
        email_frequency VARCHAR(20) DEFAULT 'immediate',
        quiet_hours_start TIME,
        quiet_hours_end TIME,
        timezone VARCHAR(50) DEFAULT 'America/New_York',

        -- Unsubscribe tracking
        unsubscribed_all BOOLEAN DEFAULT FALSE,
        unsubscribed_at TIMESTAMP WITH TIME ZONE,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- One preferences record per user
        UNIQUE(user_id)
      );
    `);

    // Create index for user lookup
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
      ON notification_preferences(user_id);
    `);

    // Create trigger for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_notification_preferences_updated_at ON notification_preferences;

      CREATE TRIGGER trigger_update_notification_preferences_updated_at
        BEFORE UPDATE ON notification_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_notification_preferences_updated_at();
    `);

    console.log('Created notification_preferences table with indexes and triggers');
  },

  async down(pool: Pool): Promise<void> {
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_notification_preferences_updated_at ON notification_preferences;
      DROP FUNCTION IF EXISTS update_notification_preferences_updated_at;
      DROP TABLE IF EXISTS notification_preferences CASCADE;
    `);

    console.log('Dropped notification_preferences table');
  },
};
