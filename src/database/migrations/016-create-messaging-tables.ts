import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration to create messaging system tables
 *
 * Tables:
 * - conversations: Container for messages between participants
 * - conversation_participants: Links users to conversations with read tracking
 * - messages: Individual messages within conversations
 *
 * Features:
 * - 1-on-1 messaging between any users (tenant, landlord, broker)
 * - Read receipts tracking per participant
 * - Message history with timestamps
 * - Soft delete support for messages
 * - Optional context linking (property_listing_id, demand_listing_id)
 */
export const createMessagingTablesMigration: Migration = {
  name: '016-create-messaging-tables',

  async up(pool: Pool): Promise<void> {
    // Create message_status enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Optional context for the conversation
        -- Links conversation to a specific property or demand listing
        property_listing_id UUID REFERENCES property_listings(id) ON DELETE SET NULL,
        demand_listing_id UUID REFERENCES demand_listings(id) ON DELETE SET NULL,

        -- Conversation metadata
        subject VARCHAR(255),
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create conversation_participants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Tracking
        last_read_at TIMESTAMP WITH TIME ZONE,
        unread_count INTEGER DEFAULT 0,
        is_muted BOOLEAN DEFAULT FALSE,

        -- Timestamps
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        left_at TIMESTAMP WITH TIME ZONE,

        -- Ensure unique user per conversation
        CONSTRAINT unique_participant UNIQUE (conversation_id, user_id)
      );
    `);

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Message content
        content TEXT NOT NULL,

        -- Optional attachments (JSONB array of {name, url, type, size})
        attachments JSONB DEFAULT '[]'::jsonb,

        -- Status tracking
        status message_status DEFAULT 'sent',

        -- Soft delete
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP WITH TIME ZONE,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create message_read_receipts table for detailed read tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_read_receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- Ensure unique read receipt per message per user
        CONSTRAINT unique_read_receipt UNIQUE (message_id, user_id)
      );
    `);

    // Create indexes for performance
    // Conversations
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_created_by
      ON conversations(created_by);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_property_listing
      ON conversations(property_listing_id) WHERE property_listing_id IS NOT NULL;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_demand_listing
      ON conversations(demand_listing_id) WHERE demand_listing_id IS NOT NULL;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_last_message
      ON conversations(last_message_at DESC);
    `);

    // Conversation participants
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_user
      ON conversation_participants(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_conversation
      ON conversation_participants(conversation_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_unread
      ON conversation_participants(user_id, unread_count)
      WHERE unread_count > 0;
    `);

    // Messages
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversation_id, created_at DESC);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender
      ON messages(sender_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_not_deleted
      ON messages(conversation_id, created_at DESC)
      WHERE is_deleted = FALSE;
    `);

    // Read receipts
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_read_receipts_message
      ON message_read_receipts(message_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_read_receipts_user
      ON message_read_receipts(user_id);
    `);

    // Create function to update conversation's last_message_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_conversation_last_message()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE conversations
        SET last_message_at = NEW.created_at, updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger to update last_message_at on new message
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
      CREATE TRIGGER trigger_update_conversation_last_message
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_conversation_last_message();
    `);

    // Create function to increment unread counts for other participants
    await pool.query(`
      CREATE OR REPLACE FUNCTION increment_unread_counts()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE conversation_participants
        SET unread_count = unread_count + 1
        WHERE conversation_id = NEW.conversation_id
          AND user_id != NEW.sender_id
          AND left_at IS NULL;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger to increment unread counts on new message
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_increment_unread_counts ON messages;
      CREATE TRIGGER trigger_increment_unread_counts
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION increment_unread_counts();
    `);
  },

  async down(pool: Pool): Promise<void> {
    // Drop triggers first
    await pool.query('DROP TRIGGER IF EXISTS trigger_increment_unread_counts ON messages');
    await pool.query('DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages');

    // Drop functions
    await pool.query('DROP FUNCTION IF EXISTS increment_unread_counts');
    await pool.query('DROP FUNCTION IF EXISTS update_conversation_last_message');

    // Drop tables in reverse order (respecting foreign keys)
    await pool.query('DROP TABLE IF EXISTS message_read_receipts CASCADE');
    await pool.query('DROP TABLE IF EXISTS messages CASCADE');
    await pool.query('DROP TABLE IF EXISTS conversation_participants CASCADE');
    await pool.query('DROP TABLE IF EXISTS conversations CASCADE');

    // Drop enum
    await pool.query('DROP TYPE IF EXISTS message_status CASCADE');
  },
};
