import { Pool } from 'pg';
import pool from '../../config/database';
import { Conversation, ConversationParticipant, ConversationWithDetails } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class ConversationModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create a new conversation with participants
   */
  async create(data: {
    created_by: string;
    participant_ids: string[];
    subject?: string;
    property_listing_id?: string;
    demand_listing_id?: string;
  }): Promise<Conversation> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const conversationId = uuidv4();

      // Create conversation
      const result = await client.query(
        `INSERT INTO conversations (
          id, created_by, subject, property_listing_id, demand_listing_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          conversationId,
          data.created_by,
          data.subject || null,
          data.property_listing_id || null,
          data.demand_listing_id || null,
        ]
      );

      // Add all participants (including creator)
      const allParticipants = [...new Set([data.created_by, ...data.participant_ids])];

      for (const userId of allParticipants) {
        await client.query(
          `INSERT INTO conversation_participants (id, conversation_id, user_id)
           VALUES ($1, $2, $3)`,
          [uuidv4(), conversationId, userId]
        );
      }

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find conversation by ID
   */
  async findById(id: string): Promise<Conversation | null> {
    const result = await this.pool.query(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find conversation by ID with participants and last message
   */
  async findByIdWithDetails(id: string, userId: string): Promise<ConversationWithDetails | null> {
    // Get conversation
    const conversationResult = await this.pool.query(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );

    if (conversationResult.rows.length === 0) {
      return null;
    }

    const conversation = conversationResult.rows[0];

    // Get participants with user info
    const participantsResult = await this.pool.query(
      `SELECT cp.*,
              u.id as user_id, u.email, u.role,
              up.first_name, up.last_name, up.photo_url
       FROM conversation_participants cp
       JOIN users u ON cp.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE cp.conversation_id = $1 AND cp.left_at IS NULL`,
      [id]
    );

    const participants: ConversationParticipant[] = participantsResult.rows.map((row) => ({
      id: row.id,
      conversation_id: row.conversation_id,
      user_id: row.user_id,
      last_read_at: row.last_read_at,
      unread_count: row.unread_count,
      is_muted: row.is_muted,
      joined_at: row.joined_at,
      left_at: row.left_at,
      user: {
        id: row.user_id,
        email: row.email,
        role: row.role,
        profile: row.first_name ? {
          first_name: row.first_name,
          last_name: row.last_name,
          photo_url: row.photo_url,
        } : undefined,
      },
    }));

    // Get last message
    const lastMessageResult = await this.pool.query(
      `SELECT m.*,
              u.id as sender_user_id, u.email as sender_email, u.role as sender_role,
              up.first_name as sender_first_name, up.last_name as sender_last_name, up.photo_url as sender_photo_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE m.conversation_id = $1 AND m.is_deleted = FALSE
       ORDER BY m.created_at DESC
       LIMIT 1`,
      [id]
    );

    const lastMessage = lastMessageResult.rows[0] ? {
      id: lastMessageResult.rows[0].id,
      conversation_id: lastMessageResult.rows[0].conversation_id,
      sender_id: lastMessageResult.rows[0].sender_id,
      content: lastMessageResult.rows[0].content,
      attachments: lastMessageResult.rows[0].attachments || [],
      status: lastMessageResult.rows[0].status,
      is_deleted: lastMessageResult.rows[0].is_deleted,
      deleted_at: lastMessageResult.rows[0].deleted_at,
      created_at: lastMessageResult.rows[0].created_at,
      updated_at: lastMessageResult.rows[0].updated_at,
      sender: {
        id: lastMessageResult.rows[0].sender_user_id,
        email: lastMessageResult.rows[0].sender_email,
        role: lastMessageResult.rows[0].sender_role,
        profile: lastMessageResult.rows[0].sender_first_name ? {
          first_name: lastMessageResult.rows[0].sender_first_name,
          last_name: lastMessageResult.rows[0].sender_last_name,
          photo_url: lastMessageResult.rows[0].sender_photo_url,
        } : undefined,
      },
    } : null;

    // Get unread count for current user
    const unreadResult = await this.pool.query(
      `SELECT unread_count FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [id, userId]
    );

    const unreadCount = unreadResult.rows[0]?.unread_count || 0;

    // Find other participant (for 1-on-1 chats)
    const otherParticipant = participants.find((p) => p.user_id !== userId);

    return {
      ...conversation,
      participants,
      lastMessage,
      unreadCount,
      otherParticipant,
    };
  }

  /**
   * Find all conversations for a user
   */
  async findByUserId(
    userId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ conversations: ConversationWithDetails[]; total: number; hasMore: boolean }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(DISTINCT c.id) as total
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = $1 AND cp.left_at IS NULL`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get conversations
    const result = await this.pool.query(
      `SELECT DISTINCT c.*
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = $1 AND cp.left_at IS NULL
       ORDER BY c.last_message_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get details for each conversation
    const conversations: ConversationWithDetails[] = [];

    for (const conv of result.rows) {
      const details = await this.findByIdWithDetails(conv.id, userId);
      if (details) {
        conversations.push(details);
      }
    }

    return {
      conversations,
      total,
      hasMore: offset + conversations.length < total,
    };
  }

  /**
   * Find existing 1-on-1 conversation between two users
   */
  async findDirectConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    const result = await this.pool.query(
      `SELECT c.* FROM conversations c
       WHERE c.id IN (
         SELECT cp1.conversation_id
         FROM conversation_participants cp1
         JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
         WHERE cp1.user_id = $1 AND cp2.user_id = $2
           AND cp1.left_at IS NULL AND cp2.left_at IS NULL
       )
       AND (
         SELECT COUNT(*) FROM conversation_participants cp
         WHERE cp.conversation_id = c.id AND cp.left_at IS NULL
       ) = 2
       LIMIT 1`,
      [userId1, userId2]
    );

    return result.rows[0] || null;
  }

  /**
   * Get or create a direct conversation between two users
   */
  async getOrCreateDirectConversation(
    creatorId: string,
    otherUserId: string,
    context?: { property_listing_id?: string; demand_listing_id?: string }
  ): Promise<Conversation> {
    // Check if conversation already exists
    const existing = await this.findDirectConversation(creatorId, otherUserId);
    if (existing) {
      return existing;
    }

    // Create new conversation
    return this.create({
      created_by: creatorId,
      participant_ids: [otherUserId],
      property_listing_id: context?.property_listing_id,
      demand_listing_id: context?.demand_listing_id,
    });
  }

  /**
   * Get total unread message count for a user across all conversations
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COALESCE(SUM(unread_count), 0) as total
       FROM conversation_participants
       WHERE user_id = $1 AND left_at IS NULL`,
      [userId]
    );

    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Mark all messages in a conversation as read for a user
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Update participant's last_read_at and reset unread_count
      await client.query(
        `UPDATE conversation_participants
         SET last_read_at = NOW(), unread_count = 0
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      // Create read receipts for all unread messages
      await client.query(
        `INSERT INTO message_read_receipts (id, message_id, user_id)
         SELECT gen_random_uuid(), m.id, $2
         FROM messages m
         WHERE m.conversation_id = $1
           AND m.sender_id != $2
           AND m.is_deleted = FALSE
           AND NOT EXISTS (
             SELECT 1 FROM message_read_receipts mrr
             WHERE mrr.message_id = m.id AND mrr.user_id = $2
           )`,
        [conversationId, userId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add a participant to a conversation
   */
  async addParticipant(conversationId: string, userId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO conversation_participants (id, conversation_id, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (conversation_id, user_id) DO UPDATE
       SET left_at = NULL, joined_at = NOW()`,
      [uuidv4(), conversationId, userId]
    );
  }

  /**
   * Remove a participant from a conversation (soft delete)
   */
  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE conversation_participants
       SET left_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
  }

  /**
   * Check if a user is a participant in a conversation
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Mute/unmute a conversation for a user
   */
  async setMuted(conversationId: string, userId: string, isMuted: boolean): Promise<void> {
    await this.pool.query(
      `UPDATE conversation_participants
       SET is_muted = $3
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId, isMuted]
    );
  }
}
